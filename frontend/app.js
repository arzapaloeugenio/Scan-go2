/* Tottus Scan & Go - lógica principal (HTML + CSS + JS independientes) */
const IGV_RATE = 0.18;
// RN-CAJA-RÁPIDA: tope estricto de 40 artículos por compra rápida Scan & Go.
// Más de 40 debe procesarse en caja tradicional (modal bloqueante).
const MAX_ITEMS = 40;
// Tiempos QR elegidos: 5 min caja (llegar sin prisa) + 3 min salida (tramo corto).
// Evita screenshots reutilizados: corto, un solo uso y se invalida al expirar/regenerar.
const QR_CAJA_TTL_SEC = 5 * 60;
const QR_SALIDA_TTL_SEC = 3 * 60;
const QR_SECRET = "tottus-scan-go-demo";

const PRODUCTS = [
  { id: 1,  name: "Leche Gloria Entera 1L", brand: "Gloria", price: 5.20, oldPrice: 5.90, code: "7750123450013", image: "img/LecheGloriaEntera1L.png", cat: "lacteos" },
  { id: 2,  name: "Pan de Molde Blanco 650g", brand: "Bimbo", price: 7.50, oldPrice: null, code: "7750123450020", image: "img/Bimbo.png", cat: "panaderia" },
  { id: 3,  name: "Arroz Superior 5kg", brand: "Costeño", price: 22.90, oldPrice: 26.90, code: "7750123450037", image: "img/Costeño.png", cat: "abarrotes" },
  { id: 4,  name: "Aceite Vegetal 1L", brand: "Primor", price: 9.80, oldPrice: null, code: "7750123450044", image: "img/Primor.png", cat: "abarrotes" },
  { id: 5,  name: "Pollo Entero x kg", brand: "Tottus", price: 12.90, oldPrice: 14.50, code: "7750123450051", image: "img/PolloTottus.png", cat: "carnes" },
  { id: 6,  name: "Gaseosa Inca Kola 2L", brand: "Inca Kola", price: 8.50, oldPrice: 9.50, code: "7750123450068", image: "img/IncaKola.png", cat: "bebidas" },
  { id: 7,  name: "Fideos Spaghetti 500g", brand: "Don Vittorio", price: 3.80, oldPrice: null, code: "7750123450075", image: "img/don-vittorio-spaguetti-x-500-gr.png", cat: "abarrotes" },
  { id: 8,  name: "Detergente 2kg", brand: "Ariel", price: 24.90, oldPrice: 32.90, code: "7750123450082", image: "img/Ariel.png", cat: "limpieza" },
  { id: 9,  name: "Manzana Gala x kg", brand: "Tottus Fresco", price: 6.90, oldPrice: null, code: "7750123450099", image: "img/TottusFresco.png", cat: "frutas" },
  { id: 10, name: "Chocolate Sublime 40g", brand: "Nestlé", price: 2.50, oldPrice: 3.00, code: "7750123450105", image: "img/NestléSublime.png", cat: "golosinas" },
  { id: 11, name: "Café Instantáneo 200g", brand: "Nescafé", price: 19.90, oldPrice: 23.90, code: "7750123450112", image: "img/Nescafé.png", cat: "abarrotes" },
  { id: 12, name: "Papel Higiénico 24 rollos", brand: "Suave", price: 27.50, oldPrice: null, code: "7750123450129", image: "img/Suave.png", cat: "limpieza" },
  { id: 13, name: "Cerveza Cristal Six Pack 355ml", brand: "Cristal", price: 24.90, oldPrice: 29.90, code: "7750123450136", image: "img/CRISTAL-SIX-PACK-LATA.png", cat: "licores", restricted: true },
  { id: 14, name: "Vino Tinto Borgoña 750ml", brand: "Tabernero", price: 32.50, oldPrice: null, code: "7750123450143", image: "img/Tabernero.png", cat: "licores", restricted: true },
];

PRODUCTS.forEach(p => {
  p.discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
});

const $ = (id) => document.getElementById(id);
const money = (n) => "S/ " + n.toFixed(2);

let cart = {}; // code -> qty
let currentFilter = "all";
let searchTerm = "";
let scannerRunning = false;
// Estado del pago/retiro
let order = null; // { ticketId, method, total, items, subtotal, igv, saving, qty, caja:{code,token,exp,used}, salida:{...}, status }
let qrTimer = null;
const ORDER_KEY = "tottus_order";
let scanT0 = 0; // perf RNF02 (<3s por scan)
let payT0 = 0; // perf objetivo pago (<=60s)

function saveOrder() {
  try {
    if (order) localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    else localStorage.removeItem(ORDER_KEY);
  } catch { /* storage lleno/bloqueado */ }
}
function loadOrder() {
  try {
    const o = JSON.parse(localStorage.getItem(ORDER_KEY) || "null");
    order = (o && o.ticketId) ? o : null;
  } catch { order = null; }
}
function clearOrder() {
  order = null;
  try { localStorage.removeItem(ORDER_KEY); } catch { /* noop */ }
}
const HISTORY_KEY = "tottus_history";
function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}
function saveHistoryEntry(entry) {
  try {
    const h = getHistory();
    h.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 20)));
  } catch { /* noop */ }
}
function beep(ok = true) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = beep._ctx || (beep._ctx = new Ctx());
    if (ctx.state === "suspended") ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = ok ? "sine" : "square";
    o.frequency.value = ok ? 880 : 220;
    g.gain.value = 0.08;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(() => o.stop(), ok ? 120 : 200);
  } catch { /* sin audio */ }
}

function loadState() {
  try {
    cart = JSON.parse(localStorage.getItem("tottus_cart") || "{}");
  } catch { cart = {}; }
}
function saveState() {
  if (cartTotalQty() > MAX_ITEMS) return false; // bloqueo guardado: intento de artículo 41+
  localStorage.setItem("tottus_cart", JSON.stringify(cart));
  return true;
}
function getUser() {
  try { return JSON.parse(localStorage.getItem("tottus_user") || "null"); }
  catch { return null; }
}
function calcAge(birthStr) {
  if (!birthStr) return null;
  const b = new Date(birthStr + "T00:00:00");
  if (isNaN(b)) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
function isAdultUser() {
  const u = getUser();
  if (!u) return false;
  if (typeof u.isAdult === "boolean") return u.isAdult;
  const age = calcAge(u.birth);
  return age !== null && age >= 18;
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

// RN-CAJA-RÁPIDA: módulo de límite 40 (validación <2s, O(1))
function isFastLimitReached(addQty = 1) {
  return cartTotalQty() + addQty > MAX_ITEMS;
}
function showFastLimitModal() {
  const m = $("fastLimitModal");
  if (m) m.hidden = false;
}
function hideFastLimitModal() {
  const m = $("fastLimitModal");
  if (m) m.hidden = true;
}

function cartTotalQty() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function addToCart(code, qty = 1) {
  const prod = PRODUCTS.find(p => p.code === code);
  if (!prod) { toast("❌ Código no encontrado: " + code); return false; }
  if (prod.restricted && !isAdultUser()) {
    toast("🔞 Solo +18 años: valida tu edad para llevar licores (RN02)");
    return false;
  }
  const current = cartTotalQty();
  if (current + qty > MAX_ITEMS) {
    showFastLimitModal();
    beep(false);
    toast(`⚠️ Máximo ${MAX_ITEMS} productos. Tienes ${current}.`);
    return false;
  }
  cart[code] = (cart[code] || 0) + qty;
  saveState();
  renderAll();
  toast(`✅ ${prod.name} agregado`);
  const total = cartTotalQty();
  if (total === 1) botSay(`🎉 ¡Bien ${firstName()}! Agregaste tu primer producto. Sigue escaneando; verás el total y el IGV actualizarse en el carrito 🛒`);
  else if (total === MAX_ITEMS) botSay(`⚠️ Llegaste al máximo de ${MAX_ITEMS} productos. Ve a <b>🛒 Carrito → Finalizar compra</b> para pagar desde tu celular.`);
  return true;
}

function changeQty(code, delta) {
  if (delta > 0 && isFastLimitReached(delta)) {
    showFastLimitModal();
    beep(false);
    toast(`⚠️ Límite de ${MAX_ITEMS} productos`);
    return;
  }
  const next = (cart[code] || 0) + delta;
  if (next <= 0) delete cart[code];
  else {
    if (cartTotalQty() + delta > MAX_ITEMS) {
      showFastLimitModal();
      beep(false);
      toast(`⚠️ Límite de ${MAX_ITEMS} productos`);
      return;
    }
    cart[code] = next;
  }
  saveState();
  renderAll();
}

function calcTotals() {
  let total = 0, saving = 0;
  for (const [code, qty] of Object.entries(cart)) {
    const p = PRODUCTS.find(x => x.code === code);
    if (!p) continue;
    total += p.price * qty;
    if (p.oldPrice) saving += (p.oldPrice - p.price) * qty;
  }
  const subtotal = total / (1 + IGV_RATE);
  const igv = total - subtotal;
  return { total, subtotal, igv, saving };
}

// ---------- RENDER ----------
function renderProducts() {
  const grid = $("productGrid");
  const list = PRODUCTS.filter(p => {
    if (currentFilter === "oferta" && !p.discount) return false;
    if (searchTerm && !(p.name + p.brand).toLowerCase().includes(searchTerm)) return false;
    return true;
  });
  $("productCount").textContent = `(${list.length})`;
  grid.innerHTML = list.map(p => `
    <article class="product">
      <div class="product-img"><img src="${p.image}" class="product-image" alt="${p.name}">
        ${p.discount ? `<span class="discount-tag">-${p.discount}%</span>` : ""}
        ${p.restricted ? `<span class="restricted-tag">+18</span>` : ""}
      </div>
      <div class="product-body">
        <span class="product-brand">${p.brand}</span>
        <strong>${p.name}</strong>
        <span class="product-code">EAN: ${p.code}</span>
        ${p.restricted ? `<small class="age-note">🔞 Venta solo mayores de 18</small>` : ""}
        <div class="price-row">
          <span class="price">${money(p.price)}</span>
          ${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}
        </div>
        <button class="add-btn" data-add="${p.code}">+ Agregar</button>
      </div>
    </article>`).join("") || `<p class="muted">Sin resultados para tu búsqueda.</p>`;

  grid.querySelectorAll("[data-add]").forEach(b =>
    b.addEventListener("click", () => addToCart(b.dataset.add)));
}

function renderCart() {
  const listEl = $("cartList");
  const qty = cartTotalQty();
  const badge = $("cartBadge");
  if (badge.textContent !== String(qty)) {
    badge.textContent = qty;
    badge.classList.remove("pop");
    void badge.offsetWidth;
    badge.classList.add("pop");
  }
  $("cartCountLabel").textContent = `(${qty})`;
  $("cartProgress").style.width = Math.min(100, qty / MAX_ITEMS * 100) + "%";
  $("cartProgressLabel").textContent = `${qty} / ${MAX_ITEMS}`;

  const entries = Object.entries(cart);
  if (!entries.length) {
    listEl.innerHTML = `<div class="empty-cart">🛒 Tu carrito está vacío.<br><small class="muted">Escanea o agrega productos del catálogo.</small></div>`;
  } else {
    listEl.innerHTML = entries.map(([code, q]) => {
      const p = PRODUCTS.find(x => x.code === code);
      if (!p) return "";
      return `<div class="cart-item">
        <img src="${p.image}" class="product-image" alt="${p.name}">
        <div class="cart-info">
          <strong>${p.name}</strong>
          <small>${money(p.price)} c/u · EAN ${p.code}</small><br>
          <small><b>${money(p.price * q)}</b> total</small>
        </div>
        <div class="qty-controls">
          <button data-dec="${code}">−</button>
          <strong>${q}</strong>
          <button data-inc="${code}">+</button>
        </div>
      </div>`;
    }).join("");
    listEl.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
    listEl.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
  }

  const t = calcTotals();
  $("subtotalEl").textContent = money(t.subtotal);
  $("igvEl").textContent = money(t.igv);
  $("savingEl").textContent = "− " + money(t.saving);
  $("totalEl").textContent = money(t.total);
  const btnCo = $("btnCheckout");
  if (btnCo) {
    btnCo.disabled = qty === 0;
    btnCo.classList.toggle("btn-disabled", qty === 0);
    btnCo.textContent = qty === 0 ? "Agrega productos para continuar" : "Finalizar compra →";
  }
}

function renderCodesHelp() {
  $("codesList").innerHTML = PRODUCTS.map(p =>
    `<button data-code="${p.code}" title="${p.name}">${p.code}</button>`).join("");
  $("codesList").querySelectorAll("button").forEach(b =>
    b.addEventListener("click", () => { $("manualCode").value = b.dataset.code; }));
}

function renderAll() { renderProducts(); renderCart(); renderHistory(); }

// ---------- NAVEGACIÓN ----------
function showView(name) {
  ["home", "scanner", "cart", "checkout", "login"].forEach(v => {
    $("view-" + v).hidden = (v !== name);
  });
  document.querySelectorAll(".bottom-nav button").forEach(b =>
    b.classList.toggle("active", b.dataset.nav === name));
  if (name !== "scanner") stopCamera();
  if (getUser() && name !== "login") botGuideView(name);
  window.scrollTo({ top: 0 });
}

function updateAuthUI() {
  const user = getUser();
  const logged = !!user;
  $("appHeader").hidden = !logged;
  $("bottomNav").hidden = !logged;
  if (logged) {
    const tag = user.isAdult === false ? " (menor 🔞)" : "";
    $("headerUser").textContent = "Hola, " + user.name.split(" ")[0] + tag;
    showView("home");
  } else {
    showView("login");
  }
}

// ---------- SCANNER (html5-qrcode vía CDN, con degradación a ingreso manual) ----------
const SCANNER_UNAVAILABLE_MSG = "El escáner no está disponible. Puedes ingresar el código manualmente.";
function isScannerLibAvailable() {
  if (window.__html5QrcodeCdnFailed) return false;
  return typeof window.Html5QrcodeScanner !== "undefined";
}
function updateScannerAvailability() {
  const available = isScannerLibAvailable();
  const statusEl = $("scannerStatus");
  const btnStart = $("btnStartCamera");
  const btnStop = $("btnStopCamera");
  if (!available && scannerRunning) {
    // El CDN falló con el escáner activo: liberar cámara y restablecer UI sin tocar el ingreso manual.
    stopCamera();
  }
  if (btnStart) btnStart.disabled = !available;
  if (btnStop) btnStop.disabled = !available;
  if (!available && statusEl) statusEl.textContent = SCANNER_UNAVAILABLE_MSG;
  if (available && statusEl && !scannerRunning && statusEl.textContent === SCANNER_UNAVAILABLE_MSG) {
    statusEl.textContent = "Cámara detenida";
  }
  return available;
}
function onScanFailure(error) {
  // Se ignoran los errores de lectura por frame para no saturar la UI
}

async function startCamera() {
  if (scannerRunning) return;
  const statusEl = $("scannerStatus");
  try {
    if (!isScannerLibAvailable()) {
      updateScannerAvailability();
      toast("⚠️ Cámara no disponible, usa código manual");
      return;
    }
    const html5QrcodeScanner = new window.Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    window._html5QrcodeScanner = html5QrcodeScanner;
    scannerRunning = true;
    scanT0 = performance.now();
    if (statusEl) statusEl.textContent = "📷 Apunta al código de barras...";
    function onScanSuccess(decodedText, decodedResult) {
      html5QrcodeScanner.clear().then(() => {
        scannerRunning = false;
        window._html5QrcodeScanner = null;
        if (statusEl) statusEl.textContent = "✅ Código leído";
        onScannedCode(decodedText);
      }).catch(() => {
        scannerRunning = false;
        onScannedCode(decodedText);
      });
    }
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  } catch (e) {
    scannerRunning = false;
    window._html5QrcodeScanner = null;
    try {
      const readerEl = $("reader");
      if (readerEl) readerEl.innerHTML = "";
    } catch { /* noop */ }
    // No se reintenta: se deja el ingreso manual operativo y se refleja el estado real del CDN.
    updateScannerAvailability();
    if (isScannerLibAvailable() && statusEl) statusEl.textContent = "⚠️ No se pudo abrir la cámara. Usa ingreso manual.";
    toast("⚠️ Cámara no disponible, usa código manual");
  }
}

async function stopCamera() {
  try {
    const active = window._html5QrcodeScanner;
    if (active) {
      await active.clear();
      window._html5QrcodeScanner = null;
    }
  } catch { /* noop */ }
  scannerRunning = false;
  try {
    const readerEl = $("reader");
    if (readerEl) readerEl.innerHTML = "";
  } catch { /* noop */ }
  const st = $("scannerStatus");
  if (st && $("view-scanner").hidden === false) st.textContent = "Cámara detenida";
}

function onScannedCode(code) {
  if (isFastLimitReached(1)) {
    $("scanResult").textContent = "⛔ Límite de 40 alcanzado: no se agregará el artículo 41.";
    showFastLimitModal();
    beep(false);
    scanT0 = 0;
    return;
  }
  const dt = scanT0 ? ((performance.now() - scanT0) / 1000) : 0;
  const perf = dt ? ` <span class="perf-hint">⏱️ ${dt.toFixed(1)}s (meta &lt;3s ${dt < 3 ? "✅" : "⚠️"})</span>` : "";
  $("scanResult").innerHTML = "Código detectado: " + code.replace(/</g, "&lt;") + perf;
  const ok = addToCart(code, 1);
  beep(ok);
  if (ok) $("scanResult").innerHTML = "✅ Agregado: " + code.replace(/</g, "&lt;") + perf;
  scanT0 = 0;
}

function renderHistory() {
  const el = $("historyList");
  if (!el) return;
  const h = getHistory();
  if (!h.length) {
    el.innerHTML = `<p class="muted small">Sin compras aún. Tu boleta guardada aparecerá aquí.</p>`;
    return;
  }
  el.innerHTML = h.map(o =>
    `<div class="hist-item"><strong>${o.ticketId}</strong><small>${o.date} · ${o.method} · ${o.qty} items</small><b>${money(o.total)}</b></div>`
  ).join("");
}

// ---------- TOBI: robot guía Tottus ----------
let botHideTimer = null;
let botTypeTimer = null;
let botLastMsg = "";

function botSay(html, keepMs = 11000) {
  const b = $("botBubble"), t = $("botText"), av = $("botAvatar");
  if (!b || !t) return;
  botLastMsg = html;
  clearTimeout(botHideTimer);
  clearInterval(botTypeTimer);
  // Estado base colapsado: actualiza el texto en segundo plano sin expandir el robot.
  // Solo el click del usuario (botWidget/botAvatar) controla la clase active.
  av.classList.remove("talking");
  void av.offsetWidth;
  av.classList.add("talking");
  // Efecto "escribiendo": se tipea el texto plano y al final se pinta el HTML completo
  const plain = html.replace(/<[^>]+>/g, "");
  let i = 0;
  t.textContent = "";
  t.classList.add("caret");
  botTypeTimer = setInterval(() => {
    i++;
    t.textContent = plain.slice(0, i);
    if (i >= plain.length) {
      clearInterval(botTypeTimer);
      t.classList.remove("caret");
      t.innerHTML = html;
    }
  }, 16);
  // Sin auto-expand ni auto-colapso: el texto queda listo en segundo plano.
}

function botClose() {
  const b = $("botBubble");
  const w = $("botWidget");
  if (b) { b.classList.remove('active'); b.hidden = true; }
  if (w) w.classList.remove('active');
  clearTimeout(botHideTimer);
  clearInterval(botTypeTimer);
}

function firstName() {
  const u = getUser();
  return u ? u.name.split(" ")[0] : "amigo/a";
}

// Mensajes contextuales por vista (guía paso a paso)
function botGuideView(name) {
  if (name === "scanner") {
    botSay(`📷 <b>Escaneo rápido</b><br>Pulsa <b>Activar cámara</b> y encuadra el código de barras dentro del marco verde. Se agrega solo. También puedes usar el código manual.`);
  } else if (name === "cart") {
    botSay(`🛒 Este es tu carrito, ${firstName()}. Puedes sumar/restar con <b>−</b> y <b>+</b>. Máximo <b>${MAX_ITEMS}</b> productos por compra. Cuando termines, pulsa <b>Finalizar compra</b> 💚`);
  } else if (name === "checkout") {
    botSay(`💳 Estás en la zona de pago. Elige Yape, Plin o Tarjeta y pulsa <b>Pagar ahora</b>. Yo te guío con los QR de caja y salida 🔒`);
  }
}

// ---------- CONFETI: celebración de compra ----------
function confettiBurst() {
  const cv = $("confettiCanvas");
  if (!cv) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ["#00a651", "#044d29", "#5df08d", "#ffffff", "#ffd100"]; // verde Tottus + blanco + dorado
  const parts = Array.from({ length: 160 }, () => ({
    x: Math.random() * cv.width,
    y: -20 - Math.random() * cv.height * .4,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    vy: 2 + Math.random() * 3.5,
    vx: -1.5 + Math.random() * 3,
    rot: Math.random() * Math.PI,
    vr: -.15 + Math.random() * .3,
    color: colors[Math.floor(Math.random() * colors.length)],
    round: Math.random() > .7,
  }));
  const t0 = performance.now();
  function frame(t) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += .04; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (t - t0 < 4500) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, cv.width, cv.height);
  }
  requestAnimationFrame(frame);
}

// ---------- PAGO + QR TEMPORAL + CAJA + SEGURIDAD ----------
function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function genToken() {
  const a = new Uint32Array(2);
  (crypto.getRandomValues ? crypto.getRandomValues(a) : a.map(() => Math.floor(Math.random() * 1e9)));
  return [...a].map(x => x.toString(36)).join("").slice(0, 10).toUpperCase();
}
function genCode6() { return String(Math.floor(100000 + Math.random() * 900000)); }

function buildPayload(ticketId, kind, total, code, token, exp) {
  const base = `TOTTUS|${ticketId}|${kind}|${total.toFixed(2)}|${code}|${token}|${exp}`;
  return `${base}|${simpleHash(base + QR_SECRET)}`;
}

function drawQR(canvasId, text) {
  const canvas = $(canvasId);
  const ctx = canvas.getContext("2d");
  canvas.classList.remove("expired");
  if (window.QRCode?.toCanvas) {
    window.QRCode.toCanvas(canvas, text, { width: 200, margin: 1 }, (err) => {
      if (err) fallbackQR(canvas, text);
    });
  } else fallbackQR(canvas, text);
}
// Reserva sin internet: dibuja patrón + token (no escaneable real, solo demo).
function fallbackQR(canvas, text) {
  const ctx = canvas.getContext("2d");
  canvas.width = 200; canvas.height = 200;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = "#000";
  let s = 0; for (const c of text) s += c.charCodeAt(0);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
    if ((x * 31 + y * 17 + s) % 3 === 0) ctx.fillRect(10 + x * 9, 10 + y * 9, 8, 8);
  }
}

function fmtTimer(sec) {
  return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
}

function stopQrTimer() { if (qrTimer) { clearInterval(qrTimer); qrTimer = null; } }

// Progreso visual 1-4 del checkout (solo verde/blanco)
function setCheckoutStep(n) {
  ["cp1", "cp2", "cp3", "cp4"].forEach((id, i) => {
    const el = $(id);
    if (el) el.classList.toggle("on", i + 1 <= n);
  });
}

function tickQr() {
  if (!order) return;
  const now = Date.now();
  if (order.status === "PAGADO_PENDIENTE_CAJA") {
    const left = Math.max(0, Math.round((order.caja.exp - now) / 1000));
    $("qrCajaTimer").textContent = fmtTimer(left);
    if (left <= 0) {
      $("qrCajaStatus").textContent = "⛔ QR expirado: regenera uno nuevo";
      $("qrCajaStatus").classList.add("bad");
      $("qrCajaCanvas").classList.add("expired");
    }
  }
  if (order.status === "VALIDADO_CAJA") {
    const left = Math.max(0, Math.round((order.salida.exp - now) / 1000));
    $("qrSalidaTimer").textContent = fmtTimer(left);
    if (left <= 0) {
      $("qrSalidaStatus").textContent = "⛔ Pase expirado: regenera uno nuevo";
      $("qrSalidaStatus").classList.add("bad");
      $("qrSalidaCanvas").classList.add("expired");
    }
  }
}

function startQrTimer() {
  stopQrTimer();
  tickQr();
  qrTimer = setInterval(tickQr, 1000);
}

function openCheckout() {
  const qty = cartTotalQty();
  if (!qty && !order) { toast("🛒 Agrega productos primero"); return; }
  if (order && (order.status === "PAGADO_PENDIENTE_CAJA" || order.status === "VALIDADO_CAJA")) {
    restoreOrderUI();
    showView("checkout"); return; // retomar flujo vigente (persistido)
  }
  payT0 = performance.now();
  const t = calcTotals();
  $("payTotalLabel").textContent = money(t.total);
  $("payItemsLabel").textContent = `(${qty} items)`;
  const hint = $("payTimerHint");
  if (hint) hint.innerHTML = `⏱️ Cronómetro de pago iniciado (meta ≤60s)`;
  $("payStep1").hidden = false;
  $("payStep2").hidden = true;
  $("payStep3").hidden = true;
  $("payStep4").hidden = true;
  setCheckoutStep(1);
  showView("checkout");
}

function restoreOrderUI() {
  if (!order) return;
  $("payStep1").hidden = true;
  $("payStep2").hidden = order.status !== "PAGADO_PENDIENTE_CAJA";
  $("payStep3").hidden = order.status !== "VALIDADO_CAJA";
  $("payStep4").hidden = true;
  if (order.status === "PAGADO_PENDIENTE_CAJA" && order.caja) {
    $("qrCajaCode").textContent = order.caja.code;
    drawQR("qrCajaCanvas", buildPayload(order.ticketId, "CAJA", order.total, order.caja.code, order.caja.token, order.caja.exp));
    setCheckoutStep(2);
    startQrTimer();
  } else if (order.status === "VALIDADO_CAJA" && order.salida) {
    $("qrSalidaCode").textContent = order.salida.code;
    drawQR("qrSalidaCanvas", buildPayload(order.ticketId, "SALIDA", order.total, order.salida.code, order.salida.token, order.salida.exp));
    setCheckoutStep(3);
    startQrTimer();
  }
}

// Paso 1: pre-boleta (no vacía carrito aún, por si el pago falla)
function buildPreTicket() {
  const qty = cartTotalQty();
  const t = calcTotals();
  const user = getUser() || { name: "Cliente", email: "" };
  const lines = Object.entries(cart).map(([code, q]) => {
    const p = PRODUCTS.find(x => x.code === code);
    return `${q}x ${p.name}\n   ${money(p.price)} c/u → ${money(p.price * q)}`;
  });
  return { qty, t, user, lines };
}

// Reemplaza al checkout anterior: ahora genera pre-boleta y pide pago
function checkout() {
  const qty = cartTotalQty();
  if (!qty) { toast("🛒 Agrega productos primero"); return; }
  payT0 = performance.now();
  const hint = $("payTimerHint");
  if (hint) hint.innerHTML = `⏱️ Cronómetro de pago iniciado (meta ≤60s)`;
  const { qty: q, t, user, lines } = buildPreTicket();
  const ticket = `TOTTUS SCAN & GO - BOLETA DEMO (SUNAT)
RUC demo: 20100123456 | Ticket pendiente de pago
Cliente: ${user.name} | DNI: ${user.dni || "-"}
Fecha: ${new Date().toLocaleString("es-PE")}
--------------------------
${lines.join("\n")}
--------------------------
Subtotal: ${money(t.subtotal)}
IGV 18%: ${money(t.igv)}
TOTAL: ${money(t.total)}
Items: ${q}/${MAX_ITEMS}`;
  $("ticketBody").innerHTML = `<pre>${ticket.replace(/</g, "&lt;")}</pre>`;
  $("ticketCard").hidden = false;
  renderAll();
  $("ticketCard").scrollIntoView({ behavior: "smooth" });
  toast("🧾 Revisa y pulsa Pagar");
}

function payNow() {
  const qty = cartTotalQty();
  if (!qty) { toast("El carrito está vacío"); return; }
  const { t } = buildPreTicket();
  const method = document.querySelector('input[name="payMethod"]:checked')?.value || "Yape";
  if (method === "Tarjeta") {
    const num = ($("cardNumber").value || "").replace(/\s/g, "");
    const exp = ($("cardExp").value || "").trim();
    const cvv = ($("cardCvv").value || "").trim();
    if (!/^\d{16}$/.test(num)) { toast("⚠️ Tarjeta demo: 16 dígitos"); return; }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) { toast("⚠️ Vence MM/AA"); return; }
    if (!/^\d{3}$/.test(cvv)) { toast("⚠️ CVV 3 dígitos"); return; }
  }
  const paySecs = payT0 ? ((performance.now() - payT0) / 1000) : 0;
  const ticketId = "TSG-" + Date.now().toString(36).toUpperCase();
  order = {
    ticketId, method,
    total: t.total, subtotal: t.subtotal, igv: t.igv, saving: t.saving, qty,
    items: JSON.parse(JSON.stringify(cart)),
    status: "PAGADO_PENDIENTE_CAJA",
    caja: null, salida: null, paySecs: Math.round(paySecs),
  };
  // Pago simulado exitoso → vaciar carrito (ya está cobrado)
  cart = {}; saveState(); renderAll();
  issueCajaQR();
  saveOrder();
  $("payStep1").hidden = true;
  $("payStep2").hidden = false;
  $("payStep3").hidden = true;
  $("payStep4").hidden = true;
  setCheckoutStep(2);
  payT0 = 0;
  toast(`💚 Pago ${method} aprobado en ${paySecs.toFixed(0)}s (meta ≤60s ${paySecs <= 60 ? "✅" : "⚠️"})`);
}

function issueCajaQR() {
  const exp = Date.now() + QR_CAJA_TTL_SEC * 1000;
  order.caja = { code: genCode6(), token: genToken(), exp, used: false };
  order.status = "PAGADO_PENDIENTE_CAJA";
  saveOrder();
  $("qrCajaCode").textContent = order.caja.code;
  $("qrCajaStatus").textContent = "QR vigente — muestra en caja";
  $("qrCajaStatus").classList.remove("bad");
  drawQR("qrCajaCanvas", buildPayload(order.ticketId, "CAJA", order.total, order.caja.code, order.caja.token, exp));
  startQrTimer();
  botSay(`🔒 <b>Sobre tu QR</b>: muestra este código <b>solo en la caja</b>. Es de <b>un solo uso</b> y caduca en <b>5 minutos</b>; si lo regeneras, el anterior queda anulado al instante. Así nadie puede robarte con una captura de pantalla 😉`, 16000);
}

function issueSalidaQR() {
  const exp = Date.now() + QR_SALIDA_TTL_SEC * 1000;
  order.salida = { code: genCode6(), token: genToken(), exp, used: false };
  order.status = "VALIDADO_CAJA";
  saveOrder();
  $("payStep2").hidden = true;
  $("payStep3").hidden = false;
  setCheckoutStep(3);
  $("qrSalidaCode").textContent = order.salida.code;
  $("qrSalidaStatus").textContent = "Pase vigente — muestra en seguridad";
  $("qrSalidaStatus").classList.remove("bad");
  drawQR("qrSalidaCanvas", buildPayload(order.ticketId, "SALIDA", order.total, order.salida.code, order.salida.token, exp));
  startQrTimer();
  botSay(`🛡️ Último paso, ${firstName()}: muestra este <b>pase de salida</b> al personal de seguridad de la puerta. También caduca (3 min) y es de un solo uso. ¡Casi listo!`);
}

function validateCaja(inputCode) {
  if (!order || order.status !== "PAGADO_PENDIENTE_CAJA") return;
  if (order.caja.used) { toast("QR ya usado"); return; }
  if (Date.now() > order.caja.exp) { toast("⛔ QR expirado, regenera"); return; }
  if (inputCode && inputCode !== order.caja.code) { toast("❌ Código de caja incorrecto"); return; }
  order.caja.used = true; // un solo uso: captura posterior ya no sirve
  issueSalidaQR();
  toast("✅ Caja confirmó tu compra. Ve a seguridad.");
}

function validateSalida(inputCode) {
  if (!order || order.status !== "VALIDADO_CAJA") return;
  if (order.salida.used) { toast("Pase ya usado"); return; }
  if (Date.now() > order.salida.exp) { toast("⛔ Pase expirado, regenera"); return; }
  if (inputCode && inputCode !== order.salida.code) { toast("❌ Código de salida incorrecto"); return; }
  order.salida.used = true;
  order.status = "AUTORIZADO";
  stopQrTimer();
  const user = getUser() || { name: "Cliente" };
  const dniTxt = user.dni ? ` | DNI: ${String(user.dni).replace(/</g, "&lt;")}` : "";
  $("payStep3").hidden = true;
  $("payStep4").hidden = false;
  setCheckoutStep(4);
  $("finalTicketBody").innerHTML =
    `<pre>TOTTUS SCAN & GO ✅ SALIDA AUTORIZADA\nRUC demo: 20100123456 | ${order.ticketId}\nCliente: ${user.name.replace(/</g, "&lt;")}${dniTxt}\nPagado: ${money(order.total)} (${order.method}) en ${order.paySecs || 0}s\nSubtotal: ${money(order.subtotal)} | IGV: ${money(order.igv)}\nCaja: validada · Seguridad: validada\nItems: ${order.qty}\nPresenta esta pantalla al salir.</pre>`;
  $("payStep4").scrollIntoView({ behavior: "smooth" });
  saveHistoryEntry({ ticketId: order.ticketId, date: new Date().toLocaleString("es-PE"), total: order.total, qty: order.qty, method: order.method });
  renderHistory();
  clearOrder(); // compra cerrada; QRs quedan invalidados (también en storage)
  confettiBurst();
  botSay(`🎉 <b>¡FELICIDADES POR TU COMPRA, ${firstName()}!</b> 🥳 Seguridad ya validó tu salida: puedes retirarte. Cada compra con Scan &amp; Go te ahorra la cola... ¡te espero en tu próxima visita! 💚`, 16000);
  toast("🛡️ Salida autorizada");
}

// ---------- INIT ----------
function init() {
  loadState();
  loadOrder();
  renderCodesHelp();
  renderAll();
  updateAuthUI();
  // Estado inicial del escáner según el CDN (no bloquea el resto de la app).
  updateScannerAvailability();
  const cdnScript = document.getElementById("html5qrcode-cdn");
  if (cdnScript && !cdnScript._scanGoErrorBound) {
    cdnScript._scanGoErrorBound = true;
    cdnScript.addEventListener("error", () => {
      window.__html5QrcodeCdnFailed = true;
      updateScannerAvailability();
    });
  }
  if (order && getUser()) {
    restoreOrderUI();
    toast("🔄 Retomaste tu pago pendiente");
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline opcional */ });
  }

  $("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("loginName").value.trim();
    const email = $("loginEmail").value.trim();
    const pass = $("loginPass").value;
    const dni = $("loginDNI").value.trim();
    const birth = $("loginBirth").value;
    if (name.length < 3 || !email || pass.length < 4) { toast("Completa todos los campos"); return; }
    if (!/^\d{8}$/.test(dni)) { toast("⚠️ DNI debe tener 8 dígitos"); return; }
    const age = calcAge(birth);
    if (age === null) { toast("⚠️ Ingresa tu fecha de nacimiento"); return; }
    const isAdult = age >= 18;
    localStorage.setItem("tottus_user", JSON.stringify({ name, email, dni, birth, age, isAdult }));
    updateAuthUI();
    toast(isAdult ? "👋 Bienvenido/a, " + name.split(" ")[0] : "👋 Hola " + name.split(" ")[0] + " (menor: licores bloqueados 🔞)");
    botSay(isAdult ? `👋 <b>¡Hola, ${name.split(" ")[0]}!</b> Soy <b>Tobi</b>, tu guía de Tottus Scan &amp; Go 🤖. Paso 1: escanea productos con 📷 <b>Escanear</b>. Paso 2: paga desde tu celular. Paso 3: valida en caja y salida. ¡Sin colas!` : `👋 <b>¡Hola, ${name.split(" ")[0]}!</b> Eres menor de edad: los licores (+18) están bloqueados por RN02 🔞. Puedes comprar todo lo demás 💚`);
  });

  // Acceso demo: entra sin escribir nada (ideal para exposición en clase)
  $("btnDemo").addEventListener("click", () => {
    localStorage.setItem("tottus_user", JSON.stringify({ name: "Cliente Demo", email: "demo@tottus.pe", dni: "12345678", birth: "2000-01-01", age: 26, isAdult: true }));
    updateAuthUI();
    toast("⚡ Entraste en modo DEMO ¡A comprar! 🛒");
    botSay(`👋 <b>¡Hola, Cliente!</b> Soy <b>Tobi</b> 🤖. Estás en el modo de prueba de Tottus Scan &amp; Go: agrega productos del catálogo o pulsa 📷 <b>Escanear</b> (hay códigos de prueba). Yo te acompaño en tu compra hasta la salida 🛡️`);
  });

  // Login mejorado: ver/ocultar contraseña
  $("btnTogglePass").addEventListener("click", () => {
    const i = $("loginPass");
    i.type = i.type === "password" ? "text" : "password";
    $("btnTogglePass").textContent = i.type === "password" ? "👁️" : "🙈";
  });

  // Acceso minimalista: botones reales abren cada formulario por JavaScript (sin hash)
  if (!window._emailLoginBound) {
    window._emailLoginBound = true;
    // Limpia hash heredado (#loginForm/#registerForm): conserva la página sin recargar ni desplazar
    if (/^#(loginForm|registerForm|loginCard)$/.test(location.hash || "")) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    const introSel = [".login-pill", ".login-hero h1", ".hero-desc", ".hero-steps", ".hero-auth"];
    let lastOpener = null;
    function setIntroHidden(hidden) {
      introSel.forEach((s) => {
        const el = document.querySelector("#view-login " + s);
        if (el) el.hidden = hidden;
      });
    }
    function showEmailLogin(opener) {
      lastOpener = opener || null;
      setIntroHidden(true);
      const reg = $("loginForm");
      if (reg) reg.hidden = true;
      const card = $("loginCard");
      if (card) card.hidden = false;
      const mail = $("authEmail");
      if (mail) setTimeout(() => mail.focus({ preventScroll: false }), 50);
    }
    function showRegister(opener) {
      lastOpener = opener || null;
      setIntroHidden(true);
      const card = $("loginCard");
      if (card) card.hidden = true;
      const reg = $("loginForm");
      if (reg) reg.hidden = false;
      const name = $("loginName");
      if (name) setTimeout(() => name.focus({ preventScroll: false }), 50);
    }
    function showWelcome() {
      const card = $("loginCard");
      if (card) card.hidden = true;
      const reg = $("loginForm");
      if (reg) reg.hidden = true;
      setIntroHidden(false);
      if (/^#(loginForm|registerForm|loginCard)$/.test(location.hash || "")) {
        history.replaceState(null, "", location.pathname + location.search);
      }
      ["authEmailError", "authPassError"].forEach((id) => {
        const p = $(id);
        if (p) p.hidden = true;
      });
      ["authEmail", "authPass"].forEach((id) => {
        const i = $(id);
        if (i) i.removeAttribute("aria-invalid");
      });
      const hero = document.querySelector("#view-login .login-hero");
      if (hero) hero.scrollIntoView({ block: "start" });
      if (lastOpener) lastOpener.focus({ preventScroll: true });
      lastOpener = null;
    }
    const btnGoLogin = $("btnGoLogin");
    if (btnGoLogin) btnGoLogin.addEventListener("click", () => showEmailLogin(btnGoLogin));
    const btnGoRegister = $("btnGoRegister");
    if (btnGoRegister) btnGoRegister.addEventListener("click", () => showRegister(btnGoRegister));
    const btnBack = $("btnBackToWelcome");
    if (btnBack) btnBack.addEventListener("click", showWelcome);
    const btnBackReg = $("btnBackToWelcomeReg");
    if (btnBackReg) btnBackReg.addEventListener("click", showWelcome);
    const btnForgot = $("btnForgotPass");
    if (btnForgot) btnForgot.addEventListener("click", () => toast("Recuperación no disponible en la demo"));
    const btnToggleAuth = $("btnToggleAuthPass");
    if (btnToggleAuth) btnToggleAuth.addEventListener("click", () => {
      const i = $("authPass");
      if (!i) return;
      i.type = i.type === "password" ? "text" : "password";
      btnToggleAuth.textContent = i.type === "password" ? "👁️" : "🙈";
    });
    const emailForm = $("emailLoginForm");
    if (emailForm) emailForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = ($("authEmail").value || "").trim();
      const pass = $("authPass").value || "";
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const errMail = $("authEmailError");
      const errPass = $("authPassError");
      if (errMail) {
        errMail.hidden = emailOk;
        if (!emailOk) errMail.textContent = "Ingresa un correo válido.";
      }
      $("authEmail").setAttribute("aria-invalid", String(!emailOk));
      const passOk = pass.length > 0;
      if (errPass) {
        errPass.hidden = passOk;
        if (!passOk) errPass.textContent = "Ingresa tu contraseña.";
      }
      $("authPass").setAttribute("aria-invalid", String(!passOk));
      if (!emailOk || !passOk) return;
      // Demostración local: se reutiliza el perfil guardado si el correo coincide;
      // la contraseña nunca se almacena ni se registra.
      let profile = null;
      try {
        const prev = JSON.parse(localStorage.getItem("tottus_user") || "null");
        if (prev && prev.email && String(prev.email).toLowerCase() === email.toLowerCase()) profile = prev;
      } catch { profile = null; }
      if (!profile) {
        const base = email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Cliente";
        const name = base.replace(/\b\w/g, (c) => c.toUpperCase());
        profile = { name, email, dni: "", birth: "", age: null, isAdult: true };
      }
      try { localStorage.setItem("tottus_user", JSON.stringify(profile)); } catch { /* noop */ }
      $("authPass").value = "";
      showWelcome();
      updateAuthUI();
      toast("👋 Bienvenido/a, " + String(profile.name).split(" ")[0]);
      botSay(`👋 <b>¡Hola, ${String(profile.name).split(" ")[0]}!</b> Soy <b>Tobi</b> 🤖. Escanea con 📷 <b>Escanear</b>, paga desde tu celular y valida en caja y salida. ¡Sin colas!`);
    });
  }

  // TOBI: apertura/cierre solo desde el cuerpo con la "T"
  document.querySelector('.bot-body').addEventListener('click', (event) => {
    event.stopPropagation();
    $("botWidget").classList.toggle('active');
    const b = $("botBubble");
    if (b) {
      const isOpen = $("botWidget").classList.contains('active');
      b.hidden = !isOpen;
      b.classList.toggle('active', isOpen);
      if (isOpen && botLastMsg && !$("botText").textContent) botSay(botLastMsg);
    }
  });
  $("botBubble").addEventListener("click", (event) => {
    event.stopPropagation();
  });
  $("botClose").addEventListener("click", (event) => {
    event.stopPropagation();
    $("botWidget").classList.remove('active');
    botClose();
  });
  botSay(`👋 <b>¡Hola! Soy Tobi</b> 🤖🌿, el robot guía de Tottus. Inicia sesión o entra con la demo y yo te enseño a comprar sin hacer colas 🛒💨`);

  document.querySelectorAll(".bottom-nav button").forEach(b => {
    b.addEventListener("click", () => {
      if (b.dataset.nav === "logout") {
        localStorage.removeItem("tottus_user");
        stopCamera();
        stopQrTimer();
        botClose();
        updateAuthUI();
        toast("Sesión cerrada");
      } else if (b.dataset.nav === "checkout") openCheckout();
      else showView(b.dataset.nav);
    });
  });

  $("btnGoCart").addEventListener("click", () => showView("cart"));
  $("btnOpenScanner").addEventListener("click", () => showView("scanner"));
  $("btnVerOfertas").addEventListener("click", () => {
    currentFilter = "oferta";
    document.querySelectorAll(".chip-filter").forEach(c => c.classList.toggle("active", c.dataset.filter === "oferta"));
    renderProducts();
  });

  document.querySelectorAll(".chip-filter").forEach(c => {
    c.addEventListener("click", () => {
      currentFilter = c.dataset.filter;
      document.querySelectorAll(".chip-filter").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      renderProducts();
    });
  });

  $("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderProducts();
  });

  $("btnStartCamera").addEventListener("click", startCamera);
  $("btnStopCamera").addEventListener("click", stopCamera);
  $("btnManualAdd").addEventListener("click", () => {
    const code = $("manualCode").value.trim();
    if (!code) { toast("Ingresa un código"); return; }
    scanT0 = performance.now();
    onScannedCode(code);
    $("manualCode").value = "";
  });

  $("btnClearCart").addEventListener("click", () => {
    if (!cartTotalQty()) return;
    if (confirm("¿Vaciar carrito?")) { cart = {}; saveState(); renderAll(); }
  });
  $("btnCheckout").addEventListener("click", checkout);
  $("btnGoToPay").addEventListener("click", openCheckout);
  $("btnPayNow").addEventListener("click", payNow);
  document.querySelectorAll('input[name="payMethod"]').forEach(r =>
    r.addEventListener("change", () => {
      const f = $("cardForm");
      if (f) f.hidden = document.querySelector('input[name="payMethod"]:checked')?.value !== "Tarjeta";
    }));
  $("btnRegenCaja").addEventListener("click", () => {
    if (!order) return;
    issueCajaQR();
    toast("↻ Nuevo QR de caja (5:00). El anterior ya no sirve.");
  });
  $("btnValidateCaja").addEventListener("click", () => validateCaja(null));
  $("btnCajaManual").addEventListener("click", () => validateCaja($("cajaInput").value.trim()));
  $("btnRegenSalida").addEventListener("click", () => {
    if (!order || order.status !== "VALIDADO_CAJA") return;
    issueSalidaQR();
    $("qrSalidaCode").textContent = order.salida.code;
    toast("↻ Nuevo pase de salida (3:00). El anterior ya no sirve.");
  });
  $("btnValidateSalida").addEventListener("click", () => validateSalida(null));
  $("btnSegManual").addEventListener("click", () => validateSalida($("segInput").value.trim()));
  $("btnNewPurchase").addEventListener("click", () => {
    $("payStep1").hidden = false;
    $("payStep4").hidden = true;
    showView("home");
  });
  $("btnCloseTicket").addEventListener("click", () => {
    $("ticketCard").hidden = true;
    showView("home");
  });
  const btnPrint = $("btnPrintTicket");
  if (btnPrint) btnPrint.addEventListener("click", () => window.print());
  const btnPrintF = $("btnPrintFinal");
  if (btnPrintF) btnPrintF.addEventListener("click", () => window.print());
  const btnClearH = $("btnClearHistory");
  if (btnClearH) btnClearH.addEventListener("click", () => {
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* noop */ }
    renderHistory();
  });
  const btnFast = $("btnCloseFastModal");
  if (btnFast) btnFast.addEventListener("click", hideFastLimitModal);
  const fastModal = $("fastLimitModal");
  if (fastModal) fastModal.addEventListener("click", (e) => {
    if (e.target === fastModal) hideFastLimitModal();
  });
}

document.addEventListener("DOMContentLoaded", init);
