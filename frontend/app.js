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
// URL base del backend. Punto único de configuración de la API.
// - Desarrollo local (localhost/127.0.0.1): backend en http://localhost:3000.
// - Despliegue: por defecto se usa el MISMO origen (backend que sirve el frontend).
//   Si el backend vive en otra URL, se define antes de cargar app.js:
//     <script>window.SCANGO_API_BASE_URL = "https://mi-backend.example.com";</script>
// Esto evita depender de una URL local fija en producción.
const API_BASE_URL = (() => {
  const override = (typeof window !== "undefined" && window.SCANGO_API_BASE_URL) || "";
  if (String(override).trim() !== "") {
    return String(override).trim().replace(/\/+$/, "");
  }
  const host = (typeof location !== "undefined" && location.hostname) || "";
  // Desarrollo local: localhost, 127.0.0.1, IPv6 local o archivo abierto directamente.
  if (host === "" || host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return "http://localhost:3000";
  }
  return ""; // despliegue: mismo origen (o window.SCANGO_API_BASE_URL)
})();

// Catálogo local de respaldo (se conserva intacto). Se usa cuando la API no responde.
const PRODUCTOS_LOCALES = [
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

// Catálogo activo del frontend. Inicia con el respaldo local y, si la API
// responde correctamente, se reemplaza por los productos remotos normalizados.
let PRODUCTS = PRODUCTOS_LOCALES.slice();

PRODUCTOS_LOCALES.forEach(p => {
  p.discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
});

// ---------- CATÁLOGO REMOTO (Paso 2B) ----------
// Normaliza un producto del backend a la estructura interna que ya consumen
// renderProducts/renderCart/addToCart/onScannedCode (sin tocar esas funciones).
function normalizarProductoAPI(item) {
  if (!item || typeof item !== "object") return null;
  const code = String(item.codigoBarras == null ? "" : item.codigoBarras).trim();
  const name = String(item.nombre == null ? "" : item.nombre).trim();
  const price = Number(item.precio);
  if (!code || !name || !Number.isFinite(price)) return null;
  const ant = item.precioAntiguo;
  const oldPrice = (ant === null || ant === undefined || ant === "") ? null : Number(ant);
  // Marca/categoría son solo de presentación; se toman del respaldo local si existen.
  const base = PRODUCTOS_LOCALES.find((p) => p.code === code) || {};
  const prod = {
    code,
    name,
    price,
    oldPrice: Number.isFinite(oldPrice) ? oldPrice : null,
    image: String(item.imagen == null ? "" : item.imagen),
    restricted: Boolean(item.restringido),
    brand: base.brand || "",
    cat: base.cat || "",
  };
  if (base.id != null) prod.id = base.id;
  prod.discount = prod.oldPrice ? Math.round((1 - prod.price / prod.oldPrice) * 100) : 0;
  return prod;
}

// Carga el catálogo desde GET /api/products. Ante cualquier fallo conserva el
// respaldo local y avisa una sola vez. No permite reejecuciones innecesarias.
let catalogoRemotoIntentado = false;
// Mantiene el catálogo alineado con el modo activo: demo = solo local, real = API.
let ultimoModoCatalogo = false;
function sincronizarCatalogoConModo() {
  if (demoMode === ultimoModoCatalogo) return;
  ultimoModoCatalogo = demoMode;
  catalogoRemotoIntentado = false;
  cargarProductosDesdeAPI().then(() => renderAll());
}
async function cargarProductosDesdeAPI() {
  if (catalogoRemotoIntentado) return;
  catalogoRemotoIntentado = true;
  // Modo demo: usa exclusivamente el catálogo local, sin llamar a fetch.
  if (demoMode) {
    PRODUCTS = PRODUCTOS_LOCALES.slice();
    console.log("[modo-demo] catálogo local cargado");
    return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const payload = await response.json();
    const lista = Array.isArray(payload) ? payload : (payload && payload.data);
    if (!payload || payload.success === false || !Array.isArray(lista)) {
      throw new Error("respuesta inválida");
    }
    const remotos = lista.map(normalizarProductoAPI).filter(Boolean);
    if (!remotos.length) throw new Error("catálogo remoto vacío o inválido");
    PRODUCTS = remotos;
    console.log("[modo-real] catálogo cargado desde la API");
  } catch (e) {
    PRODUCTS = PRODUCTOS_LOCALES.slice();
    console.warn("[modo-real] API no disponible; catálogo local de respaldo");
  }
}

// Busca un producto por código de barras.
// - Modo demo: solo PRODUCTOS_LOCALES, sin fetch.
// - Modo real: GET a la API; devuelve el producto o un mensaje de error claro.
// Resultado: { producto, error }; error === null cuando la búsqueda fue válida.
const busquedasProductoEnCurso = new Map();
async function buscarProductoPorCodigo(codigo, perfToken = null) {
  const code = String(codigo == null ? "" : codigo).trim();
  if (!code) return { producto: null, error: "Código de barras vacío." };
  // Modo demo: catálogo local exclusivamente (nunca fetch).
  if (demoMode) {
    markScanPerfToken(perfToken, "lookupStartAt");
    const local = PRODUCTOS_LOCALES.find((p) => p.code === code) || null;
    if (local && !PRODUCTS.some((p) => p.code === local.code)) PRODUCTS.push(local);
    markScanPerfToken(perfToken, "lookupEndAt");
    return { producto: local, error: null };
  }
  // Evita solicitudes duplicadas provocadas por la misma lectura rápida.
  if (busquedasProductoEnCurso.has(code)) return busquedasProductoEnCurso.get(code);
  const tarea = (async () => {
    try {
      markScanPerfToken(perfToken, "fetchStartAt");
      const response = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(code)}`);
      setScanPerfHttpStatus(perfToken, response.status);
      markScanPerfToken(perfToken, "fetchHeadersAt");
      if (response.status === 404) {
        // Respuesta definitiva: el EAN no está registrado en el catálogo.
        let msg = "";
        try {
          const cuerpo = await response.json();
          markScanPerfToken(perfToken, "fetchJsonAt");
          if (cuerpo && typeof cuerpo.message === "string") msg = cuerpo.message;
        } catch { /* cuerpo no JSON */ }
        markScanPerfToken(perfToken, "fetchEndAt");
        return { producto: null, error: msg || `El código EAN ${code} no está registrado.` };
      }
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      markScanPerfToken(perfToken, "fetchJsonAt");
      markScanPerfToken(perfToken, "fetchEndAt");
      const item = (payload && payload.success !== false) ? (payload.data || payload) : null;
      const prod = normalizarProductoAPI(item);
      if (!prod) throw new Error("respuesta inválida");
      // Garantiza que addToCart() encuentre el producto.
      if (!PRODUCTS.some((p) => p.code === prod.code)) PRODUCTS.push(prod);
      return { producto: prod, error: null };
    } catch (e) {
      // Error de red/CORS o respuesta inválida: NO se afirma que el producto
      // no exista y NO se activa demoMode automáticamente.
      markScanPerfToken(perfToken, "fetchEndAt");
      console.warn("[modo-real] error de conexión al consultar el catálogo:", e);
      return {
        producto: null,
        error: "Error de conexión con el servidor. No se pudo verificar el código.",
      };
    }
  })();
  busquedasProductoEnCurso.set(code, tarea);
  try { return await tarea; } finally { busquedasProductoEnCurso.delete(code); }
}

const $ = (id) => document.getElementById(id);
const money = (n) => "S/ " + n.toFixed(2);

let cart = {}; // code -> qty
let currentFilter = "all";
let searchTerm = "";
let scannerRunning = false;
// Sesión visual de demostración: solo memoria, sin cuenta ni credenciales.
let demoMode = false;
// Elemento que abrió el aviso de Google: para devolverle el foco al cerrar.
let googleModalTrigger = null;

// Limpieza defensiva (Etapa 3): borra únicamente restos de un selector o
// cuentas falsas de Google que versiones anteriores pudieran haber dejado en
// el navegador. NO toca carrito, configuración, historial ni perfil legítimo.
function limpiarDatosFalsosGoogle() {
  try {
    const claves = ["scango_google_accounts"];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.indexOf("scango_google_") === 0) claves.push(key);
    }
    claves.forEach((k) => { try { localStorage.removeItem(k); } catch { /* noop */ } });
  } catch { /* storage bloqueado */ }
}

// Perfil local inventado (Etapa 3): versiones anteriores guardaban en
// "tottus_user" un perfil de correo (sin id del backend) y lo presentaban como
// cliente registrado. Ese perfil no es una sesión autenticada: se retira para
// volver al login. Los perfiles identificados por DNI (con id numérico real)
// NO se tocan, y el modo demostración nunca se persiste.
function limpiarPerfilLocalInventado() {
  try {
    const raw = localStorage.getItem("tottus_user");
    if (!raw) return;
    const u = JSON.parse(raw);
    const tieneIdBackend = !!(u && Number.isInteger(u.id) && u.id > 0);
    if (!tieneIdBackend) localStorage.removeItem("tottus_user");
  } catch { /* perfil corrupto: se ignora */ }
}

// ---------- SESIÓN REAL (registro/login por correo y contraseña) ----------
// Proyección pública: solo los datos que ya consume el frontend. Nunca
// contraseñas, hashes ni tokens. Devuelve null si el id del backend no es válido.
function guardarSesionCliente(data) {
  if (!data || typeof data !== "object") return null;
  const id = Number(data.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  const ageRaw = data.edad == null ? NaN : Number(data.edad);
  const profile = {
    id,
    name: String(data.nombre == null ? "" : data.nombre).trim() || "Cliente",
    email: String(data.correo == null ? "" : data.correo).trim(),
    dni: data.dni == null ? "" : String(data.dni).trim(),
    birth: data.fechaNacimiento == null ? "" : String(data.fechaNacimiento),
    age: Number.isInteger(ageRaw) && ageRaw >= 0 ? ageRaw : null,
    isAdult: data.esAdulto === true,
  };
  try { localStorage.setItem("tottus_user", JSON.stringify(profile)); } catch { /* storage bloqueado */ }
  demoMode = false;
  return profile;
}

// Mensaje breve de estado junto al formulario (carga, error o éxito).
function setFormStatus(el, msg, type) {
  if (!el) return;
  el.textContent = msg || "";
  el.hidden = !msg;
  el.classList.toggle("is-error", !!msg && type === "error");
  el.classList.toggle("is-success", !!msg && type === "success");
}
// Estado del pago/retiro
let order = null; // { ticketId, method, total, items, subtotal, igv, saving, qty, caja:{code,token,exp,used}, salida:{...}, status }
let qrTimer = null;
// La clave antigua "tottus_order" se conserva intacta, pero ya no se usa ni se
// migra porque no es posible determinar a qué modo o cliente pertenecía.
const ORDER_KEY_DEMO = "tottus_order_demo";
const ORDER_KEY_REAL_PREFIX = "tottus_order_real_";
let scanT0 = 0; // perf RNF02 (<3s por scan)
let payT0 = 0; // perf objetivo pago (<=60s)

// La orden activa depende exclusivamente del modo y del cliente real actual.
function claveOrdenActual() {
  if (demoMode) return ORDER_KEY_DEMO;
  const clienteId = currentClienteId();
  return clienteId === null ? null : ORDER_KEY_REAL_PREFIX + clienteId;
}
function saveOrder() {
  const key = claveOrdenActual();
  if (!key) return;
  try {
    if (order) localStorage.setItem(key, JSON.stringify(order));
    else localStorage.removeItem(key);
  } catch { /* storage lleno/bloqueado */ }
}
function loadOrder() {
  const key = claveOrdenActual();
  if (!key) { order = null; return; }
  try {
    const o = JSON.parse(localStorage.getItem(key) || "null");
    order = (o && o.ticketId) ? o : null;
  } catch { order = null; }
}
function clearOrder() {
  const key = claveOrdenActual();
  order = null;
  if (!key) return;
  try { localStorage.removeItem(key); } catch { /* noop */ }
}
// Oculta y vacía cualquier boleta/ticket visible de un contexto anterior.
// Evita que una boleta demo quede a la vista al pasar a modo real (o al revés).
function limpiarBoletaVisible() {
  const ticketCard = $("ticketCard");
  if (ticketCard) ticketCard.hidden = true;
  const ticketBody = $("ticketBody");
  if (ticketBody) ticketBody.innerHTML = "";
  const finalTicket = $("finalTicketBody");
  if (finalTicket) finalTicket.innerHTML = "";
  const pasoFinal = $("payStep4");
  if (pasoFinal) pasoFinal.hidden = true;
}
const HISTORY_KEY = "tottus_history";
const DEMO_HISTORY_KEY = "tottus_demo_history";
function getDemoHistory() {
  try {
    const h = JSON.parse(localStorage.getItem(DEMO_HISTORY_KEY) || "[]");
    return Array.isArray(h) ? h : [];
  } catch { return []; }
}
function saveDemoHistoryEntry(entry) {
  try {
    const h = getDemoHistory();
    h.unshift(entry);
    localStorage.setItem(DEMO_HISTORY_KEY, JSON.stringify(h.slice(0, 20)));
  } catch { /* noop */ }
}
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
// Historial remoto (PostgreSQL): el backend expone el historial por cliente en
// GET /api/historial/cliente/:idCliente (con sus productos).
// - Demo: solo lee "tottus_demo_history" de localStorage; nunca llama al backend.
// - Real sin sesión: no consulta ni muestra datos (requiere iniciar sesión).
// - Real con ID: usa exclusivamente el servidor; si falla, no mezcla datos locales.
// `historialRemoto === null` = aún no cargado o servidor no disponible.
let historialRemoto = null;
let historialCargando = false;
let historialError = false;
let historialSolicitud = 0;
let historialClienteId = null;
// Invalida respuestas en vuelo y borra cualquier historial de otra sesión.
function limpiarHistorialRemoto() {
  historialSolicitud += 1;
  historialRemoto = null;
  historialCargando = false;
  historialError = false;
  historialClienteId = null;
  renderHistory();
}
async function cargarHistorialRemoto() {
  // Modo demo: historial simulado local, sin ninguna llamada a la API.
  if (demoMode) {
    limpiarHistorialRemoto();
    return;
  }
  const clienteId = currentClienteId();
  // Sin sesión real: no se llama al backend ni se muestra el historial demo.
  if (clienteId === null) {
    limpiarHistorialRemoto();
    return;
  }
  // Solo se evita duplicar la carga del mismo cliente; un cliente distinto
  // invalida la solicitud anterior mediante el contador.
  if (historialCargando && historialClienteId === clienteId) return;
  const solicitud = ++historialSolicitud;
  historialCargando = true;
  historialClienteId = clienteId;
  historialRemoto = null;
  historialError = false;
  try {
    const response = await fetch(`${API_BASE_URL}/api/historial/cliente/${clienteId}`);
    let payload = null;
    try { payload = await response.json(); } catch { payload = null; }
    if (solicitud !== historialSolicitud) return;
    if (response.ok && payload && payload.success === true && Array.isArray(payload.data)) {
      historialRemoto = payload.data;
      historialError = false;
    } else {
      // Error del servidor: historial vacío, sin mezclar datos locales.
      historialRemoto = null;
      historialError = true;
    }
  } catch {
    if (solicitud !== historialSolicitud) return;
    // Sin backend: historial vacío, sin mezclar datos locales.
    historialRemoto = null;
    historialError = true;
  }
  finally {
    if (solicitud === historialSolicitud) {
      historialCargando = false;
      renderHistory();
    }
  }
}
function formatearFechaHistorial(fecha) {
  try {
    const d = new Date(fecha);
    if (isNaN(d)) return String(fecha || "");
    return d.toLocaleString("es-PE");
  } catch { return String(fecha || ""); }
}
// Normaliza ambas fuentes (demo local y remota) al mismo modelo que pinta la UI.
function historialVista() {
  if (demoMode) return getDemoHistory();
  if (currentClienteId() === null) return [];
  if (historialRemoto !== null) {
    return historialRemoto.map((c) => ({
      ticketId: c.compraId != null ? `N.° ${c.compraId}` : "Compra",
      date: formatearFechaHistorial(c.fecha),
      total: Number(c.total) || 0,
      qty: (c.items || []).reduce((s, i) => s + (Number(i.cantidad) || 0), 0),
      method: c.estado || "",
    }));
  }
  return [];
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

// La clave antigua "tottus_cart" se conserva intacta. No se migra
// automáticamente porque no puede determinarse si pertenecía a demo o a un
// cliente real.
const CART_KEY_DEMO = "tottus_cart_demo";
const CART_KEY_REAL_PREFIX = "tottus_cart_real_";
// Carrito activo: demo aislado y real aislado por id de cliente.
function claveCarritoActual() {
  if (demoMode) return CART_KEY_DEMO;
  const clienteId = currentClienteId();
  return clienteId === null ? null : CART_KEY_REAL_PREFIX + clienteId;
}
function loadState() {
  const key = claveCarritoActual();
  if (!key) { cart = {}; return; }
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    cart = (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : {};
  } catch { cart = {}; }
}
function saveState() {
  if (cartTotalQty() > MAX_ITEMS) return false; // bloqueo guardado: intento de artículo 41+
  const key = claveCarritoActual();
  if (!key) return false; // sin contexto activo no se escribe un carrito compartido
  try {
    localStorage.setItem(key, JSON.stringify(cart));
    return true;
  } catch { return false; }
}
function getUser() {
  try { return JSON.parse(localStorage.getItem("tottus_user") || "null"); }
  catch { return null; }
}
// Identidad visible única. En demo NO consulta tottus_user; en real exige id
// entero positivo y conserva el resto del perfil público ya persistido.
function identidadActiva() {
  if (demoMode) {
    return {
      id: null,
      name: "Cliente demo",
      email: "",
      dni: "",
      birth: "",
      age: null,
      isAdult: true,
      demo: true,
    };
  }
  const u = getUser();
  if (!u || typeof u !== "object") return null;
  const id = Number(u.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return Object.assign({}, u, {
    id,
    name: String(u.name == null ? "" : u.name).trim() || "Cliente",
  });
}
if (typeof window !== "undefined") window.scanGoIdentidadActiva = identidadActiva;
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
  if (demoMode) return true; // demo visual adulta, sin identidad persistida
  const u = getUser();
  if (!u) return false;
  if (typeof u.isAdult === "boolean") return u.isAdult;
  const age = calcAge(u.birth);
  return age !== null && age >= 18;
}

// ---------- REGISTRO: validación por campo (sin backend) ----------
function setRegError(inputId, errorId, msg) {
  const input = $(inputId);
  const err = $(errorId);
  const ok = !msg;
  if (err) {
    err.hidden = ok;
    if (!ok) err.textContent = msg;
  }
  if (input) input.setAttribute("aria-invalid", String(!ok));
  return ok;
}
function clearRegisterErrors() {
  ["loginNameError", "loginEmailError", "loginPassError", "loginPassConfirmError", "loginDNIError", "loginBirthError"].forEach((id) => {
    const p = $(id);
    if (p) { p.hidden = true; p.textContent = ""; }
  });
  ["loginName", "loginEmail", "loginPass", "loginPassConfirm", "loginDNI", "loginBirth"].forEach((id) => {
    const i = $(id);
    if (i) i.removeAttribute("aria-invalid");
  });
  const ok = $("registerSuccess");
  if (ok) { ok.hidden = true; ok.textContent = ""; }
  setFormStatus($("registerError"), "");
}
function validateRegisterField(field) {
  const val = (id) => ($(id) ? $(id).value : "");
  if (field === "name" || !field) {
    const v = (val("loginName") || "").trim();
    if (!v) return setRegError("loginName", "loginNameError", "Ingresa tu nombre y apellido.");
    if (v.length < 3) return setRegError("loginName", "loginNameError", "Mínimo 3 caracteres.");
    setRegError("loginName", "loginNameError", "");
  }
  if (field === "email" || !field) {
    const v = (val("loginEmail") || "").trim();
    if (!v) return setRegError("loginEmail", "loginEmailError", "Ingresa tu correo electrónico.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setRegError("loginEmail", "loginEmailError", "Ingresa un correo válido.");
    setRegError("loginEmail", "loginEmailError", "");
  }
  if (field === "pass" || !field) {
    const v = val("loginPass") || "";
    if (!v) return setRegError("loginPass", "loginPassError", "Ingresa una contraseña.");
    if (v.length < 4) return setRegError("loginPass", "loginPassError", "Mínimo 4 caracteres.");
    setRegError("loginPass", "loginPassError", "");
  }
  if (field === "confirm" || !field) {
    const p = val("loginPassConfirm") || "";
    const o = val("loginPass") || "";
    if (!p) return setRegError("loginPassConfirm", "loginPassConfirmError", "Confirma tu contraseña.");
    if (p !== o) return setRegError("loginPassConfirm", "loginPassConfirmError", "Las contraseñas no coinciden.");
    setRegError("loginPassConfirm", "loginPassConfirmError", "");
  }
  if (field === "dni" || !field) {
    const v = (val("loginDNI") || "").trim();
    if (!v) return setRegError("loginDNI", "loginDNIError", "Ingresa tu DNI.");
    if (!/^\d{8}$/.test(v)) return setRegError("loginDNI", "loginDNIError", "El DNI debe tener exactamente 8 números.");
    setRegError("loginDNI", "loginDNIError", "");
  }
  if (field === "birth" || !field) {
    const v = val("loginBirth") || "";
    if (!v) return setRegError("loginBirth", "loginBirthError", "Ingresa tu fecha de nacimiento.");
    const d = new Date(v + "T00:00:00");
    if (isNaN(d)) return setRegError("loginBirth", "loginBirthError", "Fecha no válida.");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d > today) return setRegError("loginBirth", "loginBirthError", "No puede ser una fecha futura.");
    setRegError("loginBirth", "loginBirthError", "");
  }
  return true;
}
function validateRegisterAll() {
  const order = ["name", "email", "pass", "confirm", "dni", "birth"];
  let firstBad = null;
  let allOk = true;
  order.forEach((f) => {
    const ok = validateRegisterField(f);
    if (!ok && allOk) {
      allOk = false;
      const map = { name: "loginName", email: "loginEmail", pass: "loginPass", confirm: "loginPassConfirm", dni: "loginDNI", birth: "loginBirth" };
      firstBad = map[f];
    }
  });
  // Recomprueba confirmación si la original cambió (doble verificación explícita).
  if (allOk) validateRegisterField("confirm");
  return { ok: allOk, firstBad };
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
  if (name === "scanner" && !scannerRunning && !scannerInitializing) {
    setScannerVisual(false);
    updateScannerAvailability();
  }
  if (identidadActiva() && name !== "login") botGuideView(name);
  window.scrollTo({ top: 0 });
}

function updateAuthUI() {
  sincronizarCatalogoConModo();
  // Prioridad absoluta al modo demo: nunca se lee la identidad real para
  // pintar cabecera, insignia ni mensajes cuando demoMode está activo.
  const user = identidadActiva();
  const logged = !!user;
  // Estado visual único: access (bienvenida/login/registro) vs dashboard.
  document.body.classList.toggle("access-mode", !logged);
  document.body.classList.toggle("dashboard-mode", logged);
  $("appHeader").hidden = !logged;
  $("bottomNav").hidden = !logged;
  const logoutSpan = document.querySelector('.bottom-nav button[data-nav="logout"] span');
  if (logoutSpan) logoutSpan.textContent = demoMode ? "Salir de demo" : "Salir";
  const badge = $("demoBadge");
  if (demoMode) {
    $("headerUser").textContent = "Hola, " + user.name;
    if (badge) badge.hidden = false;
    showView("home");
  } else if (user) {
    if (badge) badge.hidden = true;
    const tag = user.isAdult === false ? " (menor 🔞)" : "";
    $("headerUser").textContent = "Hola, " + user.name.split(" ")[0] + tag;
    showView("home");
  } else {
    if (badge) badge.hidden = true;
    showView("login");
  }
}

// Acceso de demostración: sesión solo visual, sin cuenta ni credenciales.
// Reutiliza updateAuthUI/showView (la misma vía que abre la tienda al autenticarse).
function enterDemo() {
  if (demoMode) { showView("home"); return; }
  // Carrito y orden ya se guardan en cada cambio, en la clave del contexto
  // activo. Al entrar a demo solo se cargan las claves exclusivas de demo.
  demoMode = true;
  PRODUCTS = PRODUCTOS_LOCALES.slice();
  console.log("[modo-demo] catálogo local cargado");
  // Cambia a los estados exclusivos de demo sin tocar tottus_user ni las
  // claves reales, que permanecen intactas.
  loadState();
  loadOrder();
  limpiarHistorialRemoto();
  limpiarBoletaVisible();
  updateAuthUI();
  renderAll();
  toast("⚡ Modo demo: explora la tienda 🛒");
  botSay(`👋 <b>¡Hola, Cliente!</b> Soy <b>Tobi</b> 🤖. Estás en el modo de prueba de Tottus Scan &amp; Go: agrega productos del catálogo o pulsa 📷 <b>Escanear</b> (hay códigos de prueba). Yo te acompaño en tu compra hasta la salida 🛡️`);
}

// ---------- SCANNER (Quagga2 vía CDN, con degradación a ingreso manual) ----------
const SCANNER_UNAVAILABLE_MSG = "El escáner no está disponible. Puedes ingresar el código manualmente.";
const SCANNER_HTTPS_MSG = "La cámara requiere HTTPS. La dirección HTTP de la red local no tiene permiso para utilizar la cámara. Abre la aplicación mediante HTTPS o usa el ingreso manual.";
const SCANNER_PERMISSION_MSG = "El permiso de cámara fue rechazado. Actívalo desde la configuración del navegador.";
const SCANNER_NO_CAMERA_MSG = "No se encontró una cámara disponible en este dispositivo.";
const SCANNER_STARTED_MSG = "Cámara activa. Alinea las barras dentro del rectángulo.";
const SCANNER_READY_MSG = "Cámara lista. Mantén el código horizontal y estable.";
const SCANNER_UNSTABLE_MSG = "Lectura inestable. Mantén el código quieto y bien iluminado.";
const SCANNER_DETECTED_MSG = "Código detectado.";
const SCANNER_UNKNOWN_MSG = "Código de barras no registrado:";
const SCANNER_ADDED_MSG = "Producto agregado:";
const SCANNER_BUSY_MSG = "La cámara está siendo utilizada por otra aplicación.";
const SCANNER_EXTERNAL_MSG = "El lector externo no está disponible. Usa el ingreso manual.";
const SCANNER_STARTING_MSG = "Iniciando cámara...";
let scannerInitializing = false;
let scanCandidate = "";
let scanCandidateAt = 0;
let scanCandidateCount = 0;
let scanProcessing = false;
let lastConfirmedCode = "";
let lastConfirmedAt = 0;
const SCAN_CONFIRM_MS = 1800;
const SCAN_CONFIRMED_REPEAT_MS = 3000;
// ---------- INSTRUMENTACIÓN TEMPORAL DE RENDIMIENTO ([scan-perf]) ----------
// Fase 5C: un solo contexto de medición por ciclo de lectura. Solo memoria y
// Console; no persiste, no se envía al backend y no cambia el flujo. Los logs
// no incluyen EAN, producto, identidad ni datos personales.
let scanPerfCtx = null;
let scanPerfSeq = 0;
const scanPerfRound = (ms) => (ms == null ? null : Math.round(ms * 10) / 10);
function beginScanPerf() {
  // Un ciclo anterior sin resumen no debe mezclarse con el nuevo.
  if (scanPerfCtx && !scanPerfCtx.emitted) emitScanPerf({ success: false, errorStage: "scan_restarted" });
  scanPerfSeq += 1;
  scanPerfCtx = {
    scanId: "scan-" + Date.now().toString(36) + "-" + scanPerfSeq,
    mode: demoMode ? "demo" : "real",
    openAt: performance.now(),
    readyAt: null,
    decodeAt: null,
    fetchStartAt: null,
    fetchHeadersAt: null,
    fetchJsonAt: null,
    fetchEndAt: null,
    lookupStartAt: null,
    lookupEndAt: null,
    uiStartAt: null,
    uiEndAt: null,
    httpStatus: null,
    pendingUi: false,
    emitted: false
  };
  return scanPerfCtx;
}
function markScanPerf(field) {
  if (!scanPerfCtx || scanPerfCtx.emitted) return;
  if (scanPerfCtx[field] == null) scanPerfCtx[field] = performance.now();
}
// Marcas ligadas al contexto exacto que originó la búsqueda: evita que una
// lectura manual concurrente contamine el ciclo de cámara en curso.
function markScanPerfToken(token, field) {
  if (!token || token !== scanPerfCtx || token.emitted) return;
  if (token[field] == null) token[field] = performance.now();
}
function setScanPerfHttpStatus(token, status) {
  if (!token || token !== scanPerfCtx || token.emitted) return;
  token.httpStatus = status;
}
function scanPerfReadingActive() {
  return !!scanPerfCtx && !scanPerfCtx.emitted && scanPerfCtx.decodeAt != null && scanPerfCtx.pendingUi === true;
}
function emitScanPerf({ success, errorStage = null } = {}) {
  if (!scanPerfCtx || scanPerfCtx.emitted) return;
  const c = scanPerfCtx;
  c.emitted = true;
  scanPerfCtx = null;
  const searchStart = c.fetchStartAt != null ? c.fetchStartAt : c.lookupStartAt;
  console.log("[scan-perf]", {
    scanId: c.scanId,
    mode: c.mode,
    scanner_open_to_ready_ms: scanPerfRound(c.readyAt != null ? c.readyAt - c.openAt : null),
    scanner_ready_to_decode_ms: scanPerfRound(c.readyAt != null && c.decodeAt != null ? c.decodeAt - c.readyAt : null),
    ean_decode_to_fetch_ms: scanPerfRound(c.decodeAt != null && searchStart != null ? searchStart - c.decodeAt : null),
    product_fetch_headers_ms: scanPerfRound(c.fetchStartAt != null && c.fetchHeadersAt != null ? c.fetchHeadersAt - c.fetchStartAt : null),
    product_fetch_json_ms: scanPerfRound(c.fetchHeadersAt != null && c.fetchJsonAt != null ? c.fetchJsonAt - c.fetchHeadersAt : null),
    product_fetch_duration_ms: scanPerfRound(c.fetchStartAt != null && c.fetchEndAt != null ? c.fetchEndAt - c.fetchStartAt : null),
    product_lookup_duration_ms: scanPerfRound(c.lookupStartAt != null && c.lookupEndAt != null ? c.lookupEndAt - c.lookupStartAt : null),
    response_to_ui_ms: scanPerfRound(c.uiStartAt != null && c.uiEndAt != null ? c.uiEndAt - c.uiStartAt : null),
    total_from_camera_ready_ms: scanPerfRound(c.readyAt != null && c.uiEndAt != null ? c.uiEndAt - c.readyAt : null),
    total_from_open_ms: scanPerfRound(c.uiEndAt != null ? c.uiEndAt - c.openAt : null),
    httpStatus: c.httpStatus,
    success: !!success,
    errorStage: errorStage || null,
    timestamp: new Date().toISOString()
  });
}
function abortScanPerf(errorStage) {
  if (!scanPerfCtx || scanPerfCtx.emitted) return;
  emitScanPerf({ success: false, errorStage });
}
function isScannerLibAvailable() {
  if (window.__quaggaCdnFailed) return false;
  return typeof window.Quagga !== "undefined" && !!window.Quagga;
}
// Diagnóstico previo visible: solo lee propiedades, no abre la cámara ni usa getUserMedia como lector.
function getScannerDiagnosis() {
  return {
    secure: window.isSecureContext,
    hasMediaDevices: !!navigator.mediaDevices,
    hasGetUserMedia: !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function"),
    hasLibGlobal: typeof window.Quagga !== "undefined",
    cdnFailed: !!window.__quaggaCdnFailed,
    libAvailable: isScannerLibAvailable()
  };
}
// Clasifica el error de apertura sin reintentar ni crear un segundo lector.
function classifyScannerError(e) {
  const name = (e && e.name) || "";
  const msg = String((e && e.message) || e || "");
  const blob = name + " " + msg;
  if (name === "NotAllowedError" || /NotAllowed|Permission denied|Permission dismissed/i.test(blob)) return SCANNER_PERMISSION_MSG;
  if (name === "NotReadableError" || name === "TrackStartError" || /in use|being used|busy|trackstart|notreadable/i.test(blob)) return SCANNER_BUSY_MSG;
  if (name === "NotFoundError" || name === "OverconstrainedError" || /NotFound|Overconstrained|DevicesNotFound|no (camera|device)/i.test(blob)) return SCANNER_NO_CAMERA_MSG;
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") return SCANNER_NO_CAMERA_MSG;
  return "";
}
// Estabilidad EAN-13: normaliza, exige numérico, valida dígito verificador y
// requiere dos lecturas consecutivas idénticas. Sin autocorrección.
function normalizeScanText(raw) {
  return String(raw || "").trim().replace(/[\s-]+/g, "");
}
function isNumericCode(s) {
  return /^\d+$/.test(s);
}
function isRegisteredCode(s) {
  return PRODUCTS.some((p) => p.code === s);
}
function isValidEan13(code) {
  if (!/^\d{13}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = code.charCodeAt(i) - 48;
    sum += (i % 2 === 0) ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === (code.charCodeAt(12) - 48);
}
function resetScanCandidate() {
  scanCandidate = "";
  scanCandidateAt = 0;
  scanCandidateCount = 0;
}
// Configuración inicial Quagga2 (1D, sin QR): LiveStream en #reader, trasera,
// locate y frecuencia 10. Solo lectores 1D indicados.
function buildQuaggaConfig() {
  return {
    inputStream: {
      type: "LiveStream",
      target: document.querySelector("#reader"),
      constraints: {
        facingMode: "environment",
        width: { min: 320 },
        height: { min: 240 }
      },
      area: { top: "35%", right: "8%", bottom: "35%", left: "8%" }
    },
    locator: { patchSize: "medium", halfSample: true },
    decoder: {
      readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader"],
      multiple: false
    },
    locate: true,
    frequency: 10
  };
}
// Un solo listener onDetected: extrae código y formato, reutiliza onScanSuccess().
function handleQuaggaDetected(result) {
  try {
    const cr = result && result.codeResult;
    const raw = cr && cr.code;
    const format = cr && cr.format;
    if (!raw) return;
    onScanSuccess(raw, { format: format || "" });
  } catch { /* noop */ }
}
function ensureQuaggaDetectedListener() {
  if (window._quaggaDetectedBound) return;
  if (!window.Quagga || typeof window.Quagga.onDetected !== "function") return;
  window._quaggaDetectedBound = true;
  window.Quagga.onDetected(handleQuaggaDetected);
}
function detachQuaggaDetectedListener() {
  try {
    if (window.Quagga && typeof window.Quagga.offDetected === "function") {
      window.Quagga.offDetected(handleQuaggaDetected);
    }
  } catch { /* noop */ }
  window._quaggaDetectedBound = false;
}
// Estado visual del lector (solo presentación): el visor, el marco y la línea
// verde existen únicamente con la cámara activa. No altera la instancia Quagga.
function setScannerVisual(active) {
  const readerEl = $("reader");
  const alignHint = $("scanAlignHint");
  const idleHint = $("scannerIdleHint");
  if (active) {
    if (readerEl) { readerEl.hidden = false; void readerEl.offsetWidth; readerEl.classList.add("is-active"); }
    if (alignHint) alignHint.hidden = false;
    if (idleHint) idleHint.hidden = true;
  } else {
    if (readerEl) { readerEl.classList.remove("is-active"); readerEl.hidden = true; }
    if (alignHint) alignHint.hidden = true;
    if (idleHint) idleHint.hidden = false;
  }
}
// Zoom moderado solo si el track lo admite. Nunca falla ni fuerza enfoque.
function applyModerateZoom() {
  try {
    const readerEl = $("reader");
    if (!readerEl) return;
    const video = readerEl.querySelector("video");
    if (!video || !video.srcObject) return;
    const tracks = (video.srcObject.getVideoTracks && video.srcObject.getVideoTracks()) || [];
    const track = tracks[0];
    if (!track || typeof track.getCapabilities !== "function") return;
    const caps = track.getCapabilities() || {};
    if (!caps.zoom) return;
    const min = caps.zoom.min || 1;
    const max = caps.zoom.max || 1;
    if (!(max > min)) return;
    const target = Math.min(max, Math.max(min, 1.4));
    if (typeof track.applyConstraints === "function") {
      track.applyConstraints({ advanced: [{ zoom: target }] }).catch(() => {});
    }
  } catch { /* zoom no disponible: continuar sin zoom */ }
}
function onScanSuccess(decodedText, decodedResult) {
  if (scanProcessing) return;
  // String exacto: conserva ceros iniciales, sin Number, sin autocorrección ni parciales.
  const code = normalizeScanText(decodedText);
  const statusEl = $("scannerStatus");
  if (!code || !isNumericCode(code) || code.length < 6 || code.length > 14) {
    resetScanCandidate();
    if (statusEl) statusEl.textContent = SCANNER_UNSTABLE_MSG;
    return;
  }
  if (code.length === 13 && !isValidEan13(code) && !isRegisteredCode(code)) {
    resetScanCandidate();
    if (statusEl) statusEl.textContent = SCANNER_UNSTABLE_MSG;
    return;
  }
  const now = Date.now();
  // Si cambia un dígito, reinicia el contador del candidato.
  if (scanCandidate !== code) {
    scanCandidate = code;
    scanCandidateAt = now;
    scanCandidateCount = 1;
    if (statusEl) statusEl.textContent = SCANNER_UNSTABLE_MSG;
    return;
  }
  if ((now - scanCandidateAt) > SCAN_CONFIRM_MS) {
    scanCandidate = code;
    scanCandidateAt = now;
    scanCandidateCount = 1;
    if (statusEl) statusEl.textContent = SCANNER_UNSTABLE_MSG;
    return;
  }
  scanCandidateCount += 1;
  // Acepta tras dos detecciones idénticas consecutivas; sin "no encontrado" previo.
  if (scanCandidateCount < 2) {
    if (statusEl) statusEl.textContent = SCANNER_UNSTABLE_MSG;
    return;
  }
  if (code === lastConfirmedCode && (now - lastConfirmedAt) < SCAN_CONFIRMED_REPEAT_MS) {
    resetScanCandidate();
    return;
  }
  lastConfirmedCode = code;
  lastConfirmedAt = now;
  resetScanCandidate();
  markScanPerf("decodeAt");
  if (scanPerfCtx) scanPerfCtx.pendingUi = true;
  scanProcessing = true;
  const wasRunning = !!window._quaggaRunning;
  if (statusEl) statusEl.textContent = SCANNER_DETECTED_MSG;
  const finalCode = code;
  const releaseAndFinish = () => {
    try {
      if (window.Quagga && window._quaggaRunning) {
        try { window.Quagga.stop(); } catch { /* ya detenida */ }
      }
    } catch { /* noop */ }
    detachQuaggaDetectedListener();
    window._quaggaRunning = false;
    scannerRunning = false;
    scannerInitializing = false;
    scanProcessing = false;
    try {
      const readerEl = $("reader");
      if (readerEl) readerEl.innerHTML = "";
    } catch { /* noop */ }
    const btnStart = $("btnStartCamera");
    if (btnStart && isScannerLibAvailable()) btnStart.disabled = false;
    setScannerVisual(false);
    const btnStopAfter = $("btnStopCamera");
    if (btnStopAfter) btnStopAfter.disabled = true;
    onScannedCode(finalCode);
  };
  if (wasRunning) {
    releaseAndFinish();
  } else {
    scannerRunning = false;
    scannerInitializing = false;
    scanProcessing = false;
    onScannedCode(finalCode);
  }
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
  if (btnStart) btnStart.disabled = !available || scannerRunning || scannerInitializing;
  if (btnStop) btnStop.disabled = !available || !scannerRunning;
  if (!available || (!scannerRunning && !scannerInitializing)) setScannerVisual(false);
  if (!available && statusEl) statusEl.textContent = SCANNER_UNAVAILABLE_MSG;
  if (available && statusEl && !scannerRunning && (statusEl.textContent === SCANNER_UNAVAILABLE_MSG || statusEl.textContent === "Cámara detenida")) {
    statusEl.textContent = SCANNER_READY_MSG;
  }
  return available;
}
function onScanFailure(error) {
  // Se ignoran los errores de lectura por frame para no saturar la UI
}

async function startCamera() {
  if (scannerRunning || scannerInitializing || window._quaggaRunning) return;
  beginScanPerf();
  const statusEl = $("scannerStatus");
  const btnStart = $("btnStartCamera");
  try {
    // Caso CDN / lector externo: se conserva el mensaje de Fase 1 en estado y se distingue en aviso.
    if (!isScannerLibAvailable()) {
      updateScannerAvailability();
      toast(SCANNER_EXTERNAL_MSG);
      abortScanPerf("scanner_library_unavailable");
      return;
    }
    // Diagnóstico previo: solo lectura de propiedades (contexto seguro,
    // cámara, librería y fallo CDN).
    const diag = getScannerDiagnosis();
    // Origen HTTP local inseguro: no se intenta abrir la cámara; el ingreso manual sigue activo.
    if (diag.secure === false) {
      scannerRunning = false;
      scannerInitializing = false;
      if (statusEl) statusEl.textContent = SCANNER_HTTPS_MSG;
      toast("⚠️ Usa HTTPS o el ingreso manual");
      abortScanPerf("insecure_context");
      return;
    }
    // Navegador sin soporte de cámara: mensaje propio, sin intentar el lector.
    if (!diag.hasMediaDevices || !diag.hasGetUserMedia) {
      scannerRunning = false;
      scannerInitializing = false;
      if (statusEl) statusEl.textContent = SCANNER_NO_CAMERA_MSG;
      toast("⚠️ Cámara no disponible, usa código manual");
      abortScanPerf("camera_not_supported");
      return;
    }
    // Una sola instancia Quagga2 en #reader. Permiso solo aquí, sin auto-apertura.
    scannerInitializing = true;
    resetScanCandidate();
    scanProcessing = false;
    if (btnStart) btnStart.disabled = true;
    const btnStopInit = $("btnStopCamera");
    if (btnStopInit) btnStopInit.disabled = true;
    if (statusEl) statusEl.textContent = SCANNER_STARTING_MSG;
    setScannerVisual(false);
    ensureQuaggaDetectedListener();
    window.Quagga.init(buildQuaggaConfig(), (initErr) => {
      if (initErr) {
        scannerRunning = false;
        scannerInitializing = false;
        scanProcessing = false;
        resetScanCandidate();
        window._quaggaRunning = false;
        try { window.Quagga.stop(); } catch { /* noop */ }
        updateScannerAvailability();
        if (isScannerLibAvailable() && statusEl) {
          statusEl.textContent = classifyScannerError(initErr) || "⚠️ No se pudo abrir la cámara. Usa ingreso manual.";
        } else if (statusEl) {
          statusEl.textContent = SCANNER_UNAVAILABLE_MSG;
        }
        if (btnStart && isScannerLibAvailable()) btnStart.disabled = false;
        else if (btnStart) updateScannerAvailability();
        toast("⚠️ Cámara no disponible, usa código manual");
        abortScanPerf("camera_init");
        return;
      }
      try {
        window.Quagga.start();
      } catch (e) {
        scannerRunning = false;
        scannerInitializing = false;
        window._quaggaRunning = false;
        updateScannerAvailability();
        if (isScannerLibAvailable() && statusEl) {
          statusEl.textContent = classifyScannerError(e) || "⚠️ No se pudo abrir la cámara. Usa ingreso manual.";
        }
        if (btnStart && isScannerLibAvailable()) btnStart.disabled = false;
        toast("⚠️ Cámara no disponible, usa código manual");
        abortScanPerf("camera_start");
        return;
      }
      // Medición real: inicia cuando el lector quedó preparado (tras start).
      window._quaggaRunning = true;
      scannerRunning = true;
      scannerInitializing = false;
      scanT0 = performance.now();
      markScanPerf("readyAt");
      if (statusEl) statusEl.textContent = SCANNER_STARTED_MSG;
      setScannerVisual(true);
      if (btnStart) btnStart.disabled = true;
      const btnStopOk = $("btnStopCamera");
      if (btnStopOk) btnStopOk.disabled = false;
      setTimeout(applyModerateZoom, 1200);
    });
  } catch (e) {
    scannerRunning = false;
    scannerInitializing = false;
    scanProcessing = false;
    resetScanCandidate();
    try { if (window.Quagga) window.Quagga.stop(); } catch { /* noop */ }
    window._quaggaRunning = false;
    try {
      const readerEl = $("reader");
      if (readerEl) readerEl.innerHTML = "";
    } catch { /* noop */ }
    // No se reintenta ni se crea un segundo lector: se deja el ingreso manual operativo.
    updateScannerAvailability();
    if (isScannerLibAvailable()) {
      if (btnStart) btnStart.disabled = false;
      if (statusEl) {
        const mapped = classifyScannerError(e);
        statusEl.textContent = mapped || "⚠️ No se pudo abrir la cámara. Usa ingreso manual.";
      }
    } else if (statusEl) {
      statusEl.textContent = SCANNER_UNAVAILABLE_MSG;
    }
    toast("⚠️ Cámara no disponible, usa código manual");
    abortScanPerf("camera_open_exception");
  }
}

async function stopCamera() {
  abortScanPerf("camera_stopped");
  try {
    if (window.Quagga && window._quaggaRunning) {
      try { window.Quagga.stop(); } catch { /* ya detenida */ }
    }
  } catch { /* noop */ }
  detachQuaggaDetectedListener();
  window._quaggaRunning = false;
  scannerRunning = false;
  scannerInitializing = false;
  scanProcessing = false;
  resetScanCandidate();
  try {
    const readerEl = $("reader");
    if (readerEl) readerEl.innerHTML = "";
  } catch { /* noop */ }
  const btnStart = $("btnStartCamera");
  if (btnStart && isScannerLibAvailable()) btnStart.disabled = false;
  const btnStop = $("btnStopCamera");
  if (btnStop) btnStop.disabled = true;
  setScannerVisual(false);
  const st = $("scannerStatus");
  if (st && $("view-scanner").hidden === false) st.textContent = SCANNER_READY_MSG;
}

// Muestra el mensaje del lector reutilizando el área de estado existente
// (#scanResult). Un mensaje de error bloquea temporalmente los mensajes de
// error continuo del escáner para que pueda leerse con calma.
const ESTADO_LECTOR_MS = 4000;
let estadoLectorBloqueadoHasta = 0;
let estadoLectorTimer = null;
function mostrarEstadoLector(mensaje, esError = false) {
  const el = $("scanResult");
  if (!el) return;
  // No sobrescribir un error visible con mensajes no-error durante su ventana.
  if (Date.now() < estadoLectorBloqueadoHasta && !esError) return;
  if (estadoLectorTimer) { clearTimeout(estadoLectorTimer); estadoLectorTimer = null; }
  el.textContent = mensaje;
  el.classList.toggle("is-error", !!esError);
  if (esError) {
    estadoLectorBloqueadoHasta = Date.now() + ESTADO_LECTOR_MS;
    estadoLectorTimer = setTimeout(() => {
      estadoLectorBloqueadoHasta = 0;
      estadoLectorTimer = null;
      const st = $("scanResult");
      if (st && st.classList.contains("is-error")) {
        st.classList.remove("is-error");
        st.textContent = "";
      }
    }, ESTADO_LECTOR_MS);
  } else {
    estadoLectorBloqueadoHasta = 0;
  }
}

async function onScannedCode(rawCode) {
  const code = normalizeScanText(rawCode);
  if (!code || !isNumericCode(code)) {
    mostrarEstadoLector(SCANNER_UNSTABLE_MSG);
    beep(false);
    scanT0 = 0;
    if (scanPerfReadingActive()) abortScanPerf("invalid_code");
    return;
  }
  if (isFastLimitReached(1)) {
    mostrarEstadoLector("⛔ Límite de 40 alcanzado: no se agregará el artículo 41.");
    showFastLimitModal();
    beep(false);
    scanT0 = 0;
    if (scanPerfReadingActive()) abortScanPerf("fast_limit");
    return;
  }
  // Tiempo real de detección con meta menor de 3 segundos, sin simulación.
  const dt = scanT0 ? ((performance.now() - scanT0) / 1000) : 0;
  const perf = dt ? ` <span class="perf-hint">⏱️ ${dt.toFixed(1)}s (meta &lt;3s ${dt < 3 ? "✅" : "⚠️"})</span>` : "";
  const perfToken = scanPerfReadingActive() ? scanPerfCtx : null;
  if (perfToken) perfToken.pendingUi = false;
  const { producto: prod, error } = await buscarProductoPorCodigo(code, perfToken);
  const perfReading = !!perfToken && perfToken === scanPerfCtx && !perfToken.emitted;
  if (perfReading) markScanPerf("uiStartAt");
  if (!prod) {
    // 404: EAN no registrado. Error de red: no se afirma que no exista.
    mostrarEstadoLector(error || (SCANNER_UNKNOWN_MSG + " " + String(code).trim()), true);
    beep(false);
    scanT0 = 0;
    if (perfReading) {
      markScanPerf("uiEndAt");
      const stage = (scanPerfCtx && scanPerfCtx.mode === "demo")
        ? "product_lookup"
        : ((scanPerfCtx && scanPerfCtx.httpStatus === 404) ? "product_not_found" : "product_fetch");
      abortScanPerf(stage);
    }
    return;
  }
  estadoLectorBloqueadoHasta = 0;
  const resultEl = $("scanResult");
  resultEl.classList.remove("is-error");
  resultEl.innerHTML = SCANNER_DETECTED_MSG + " " + code.replace(/</g, "&lt;") + perf;
  const ok = addToCart(code, 1);
  beep(ok);
  if (ok) resultEl.innerHTML = SCANNER_ADDED_MSG + " " + prod.name.replace(/</g, "&lt;") + perf;
  scanT0 = 0;
  if (perfReading) {
    markScanPerf("uiEndAt");
    emitScanPerf({ success: ok, errorStage: ok ? null : "add_to_cart" });
  }
}

// El botón solo puede borrar el historial simulado de demo. El historial real
// se deriva de órdenes persistidas en el backend y no tiene endpoint DELETE:
// se deshabilita y se muestra un mensaje honesto en lugar de simular el borrado.
function actualizarBotonBorrarHistorial() {
  const btn = $("btnClearHistory");
  if (!btn) return;
  btn.disabled = !demoMode;
  btn.textContent = demoMode
    ? "Borrar historial"
    : "El historial real no puede eliminarse desde esta versión";
  btn.title = demoMode
    ? "Borra solo el historial del modo demo"
    : "El historial real proviene de tus compras registradas en el servidor.";
}

function renderHistory() {
  actualizarBotonBorrarHistorial();
  const el = $("historyList");
  if (!el) return;
  if (!demoMode && currentClienteId() === null) {
    el.innerHTML = `<p class="muted small">Inicia sesión para ver tu historial de compras.</p>`;
    return;
  }
  if (!demoMode && historialError) {
    el.innerHTML = `<p class="muted small">No se pudo cargar tu historial desde el servidor.</p>`;
    return;
  }
  const h = historialVista();
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
  // Sin meneo con el panel cerrado (nada de animación al cargar) ni con reduced-motion.
  av.classList.remove("talking");
  try {
    const panelOpen = document.getElementById("botWidget")?.classList.contains("active");
    const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (panelOpen && !calm) {
      void av.offsetWidth;
      av.classList.add("talking");
    }
  } catch { /* texto intacto, sin animación */ }
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
  const av = $("botAvatar");
  if (b) { b.classList.remove('active'); b.hidden = true; }
  if (av) { av.classList.remove("tobi-greet"); cancelAnimationFrame(av._greetRaf); clearTimeout(av._greetTimer); }
  if (w) w.classList.remove('active');
  clearTimeout(botHideTimer);
  clearInterval(botTypeTimer);
}

// TOBI botón (punto 1, solo aditivo): el propio robot saluda al abrirse el panel.
// No cambia textos ni la lógica de abrir/cerrar; la clase .tobi-greet se añade
// en el momento del clic (doble rAF + reflow para reiniciar en cada apertura)
// y se retira ~2.6s después, volviendo a la pose normal. Con prefers-reduced-motion
// no se anima: la cara feliz + brazo se muestran por CSS mientras el panel abre.
function tobiGreetOnOpen() {
  try {
    const av = $("botAvatar");
    if (!av) return;
    cancelAnimationFrame(av._greetRaf);
    clearTimeout(av._greetTimer);
    av.classList.remove("tobi-greet");
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => {
      av.classList.remove("tobi-greet");
      void av.offsetWidth;
      av.classList.add("tobi-greet");
      clearTimeout(av._greetTimer);
      av._greetTimer = setTimeout(() => av.classList.remove("tobi-greet"), 2600);
    };
    if (typeof requestAnimationFrame === "function") {
      av._greetRaf = requestAnimationFrame(() => {
        av._greetRaf = requestAnimationFrame(start);
      });
    } else {
      start();
    }
  } catch { /* animación opcional */ }
}

// TOBI icono "T" (panel cerrado): saltito discreto cada ~7s hasta el primer press.
// Solo aditivo; no toca abrir/cerrar. Con prefers-reduced-motion no salta.
function tobiNudgeOnce() {
  try {
    if (window._tobiPressedOnce) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const w = $("botWidget");
    const av = $("botAvatar");
    if (!w || !av) return;
    if (w.classList.contains("active")) return;
    if (!document.body.classList.contains("dashboard-mode")) return;
    av.classList.remove("tobi-nudge");
    void av.offsetWidth;
    av.classList.add("tobi-nudge");
    clearTimeout(av._nudgeTimer);
    av._nudgeTimer = setTimeout(() => av.classList.remove("tobi-nudge"), 900);
  } catch { /* opcional */ }
}
function tobiNudgeStart() {
  try {
    if (window._tobiNudgeTimer) return;
    window._tobiNudgeTimer = setInterval(tobiNudgeOnce, 7000);
  } catch { /* opcional */ }
}

// TOBI primer saltito: lo adelanta a unos segundos tras cargar (el intervalo
// existente lo repite cada ~7s). Solo aditivo; no toca tobiNudgeOnce/Start.
function tobiNudgePrimer() {
  try {
    setTimeout(() => { try { tobiNudgeOnce(); } catch { /* opcional */ } }, 3500);
  } catch { /* opcional */ }
}

function firstName() {
  const ident = identidadActiva();
  return ident ? ident.name.split(" ")[0] : "amigo/a";
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
  if (!qty && !order) { toast("No hay productos en el carrito."); return; }
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
  // Identidad activa: demo = Cliente demo sin datos reales; real = perfil válido.
  const user = identidadActiva() || { name: "Cliente", email: "" };
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
  const esDemo = demoMode;
  const ticket = `TOTTUS SCAN & GO - ${esDemo ? "BOLETA DEMO (SUNAT)" : "BOLETA (SUNAT)"}
${esDemo ? "RUC demo: 20100123456" : "RUC 20100123456"} | Ticket pendiente de pago
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

// ---------- REGISTRO DE COMPRA EN BACKEND (botón "Pagar ahora") ----------
// Endpoint real: POST /api/ordenes  (backend/src/routes/ordenRoutes.js →
// carritoController.registrarCompra). El backend recalcula precios, subtotales
// y total en PostgreSQL (transacción BEGIN/COMMIT/ROLLBACK); el frontend nunca
// envía precios ni totales como fuente de verdad.
// Identificador real del cliente (registro/login por correo) guardado en
// localStorage['tottus_user']. Devuelve null en demo o sin sesión válida.
// El modo demo se distingue solo con demoMode, nunca por el ID del cliente.
function currentClienteId() {
  if (demoMode) return null;
  try {
    const raw = localStorage.getItem("tottus_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    const id = u && Number(u.id);
    if (!Number.isInteger(id) || id <= 0) return null;
    return id;
  } catch {
    // JSON inválido o storage bloqueado: sin identidad real.
    return null;
  }
}
// Protección contra doble pago: bloquea nuevos envíos mientras hay uno en curso.
let pagoEnProceso = false;

// Transforma el carrito ({ codigo: cantidad }) en los items exactos del backend
// y registra la compra. Devuelve los `data` confirmados por el servidor
// (compraId/total/items) o null ante cualquier error; en el modo real, ante
// cualquier error el carrito se conserva intacto y no se registra nada.
async function registrarCompra(carrito = cart) {
  if (pagoEnProceso) return null;
  const items = [];
  for (const [code, qty] of Object.entries(carrito || {})) {
    const codigoBarras = String(code == null ? "" : code).trim();
    const cantidad = Number(qty);
    if (!codigoBarras) continue; // sin elementos vacíos
    if (!Number.isInteger(cantidad) || cantidad <= 0) continue; // entero > 0
    items.push({ codigoBarras, cantidad });
  }
  if (!items.length) {
    toast("No hay productos en el carrito.");
    return null;
  }

  // Caso A — demo: compra simulada 100% local, sin fetch ni POST.
  if (demoMode) {
    const qty = items.reduce((s, i) => s + i.cantidad, 0);
    const total = items.reduce((s, i) => {
      const p = PRODUCTS.find((x) => x.code === i.codigoBarras)
        || PRODUCTOS_LOCALES.find((x) => x.code === i.codigoBarras);
      return s + (p ? Number(p.price) * i.cantidad : 0);
    }, 0);
    const ticketId = "TSG-" + Date.now().toString(36).toUpperCase();
    // La orden simulada vive solo en "tottus_demo_history".
    saveDemoHistoryEntry({
      ticketId,
      date: new Date().toLocaleString("es-PE"),
      total,
      qty,
      method: "Demo",
    });
    cart = {};
    saveState();
    renderAll();
    toast("Compra de demostración completada. No se registraron datos reales.");
    return { demo: true, compraId: null, ticketId, total, qty };
  }

  // Caso B — real sin sesión válida: se detiene antes de cualquier fetch.
  const clienteId = currentClienteId();
  if (clienteId === null) {
    toast("Inicia sesión para completar la compra.");
    return null; // carrito intacto, sin POST ni simulación demo
  }

  const btn = $("btnPayNow");
  const btnTexto = btn ? btn.textContent : "";
  pagoEnProceso = true;
  if (btn) { btn.disabled = true; btn.textContent = "Procesando..."; }
  try {
    // Caso C — real con ID entero positivo: cliente real, nunca el demo.
    const response = await fetch(`${API_BASE_URL}/api/ordenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: clienteId, items }),
    });
    // Un solo parseo: si el cuerpo no es JSON válido se trata como error.
    let payload = null;
    try { payload = await response.json(); } catch { payload = null; }
    // Éxito real: solo HTTP 201 + success true + identificador de compra.
    if (response.status !== 201 || !payload || payload.success !== true
        || !payload.data || payload.data.compraId == null) {
      const msg = (payload && typeof payload.message === "string" && payload.message)
        ? payload.message
        : "No se pudo registrar la compra. Inténtalo nuevamente.";
      toast(msg); // mensaje seguro emitido por la API (toast usa textContent)
      return null; // 400/404/500: carrito intacto, sin compra demo
    }
    return payload.data;
  } catch {
    // Backend apagado o error de red: no se simula ninguna compra.
    toast("No se pudo conectar con el servidor. Tu carrito se conserva.");
    return null;
  } finally {
    pagoEnProceso = false;
    if (btn) { btn.disabled = false; btn.textContent = btnTexto || "Pagar ahora"; }
  }
}

async function payNow() {
  if (pagoEnProceso) return; // ignora clics repetidos mientras se procesa
  const qty = cartTotalQty();
  if (!qty) { toast("No hay productos en el carrito."); return; }
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
  // 1) Registra la compra en el backend ANTES de tocar el carrito.
  //    Si falla (red/400/404/500) se conserva tal cual. En demo se simula local.
  const itemsSnapshot = JSON.parse(JSON.stringify(cart));
  const compra = await registrarCompra(cart);
  if (!compra) return;
  // 2) El total confiable es el que confirmó el servidor (o el simulado en demo).
  const totalConfirmado = Number(compra.total);
  const total = Number.isFinite(totalConfirmado) ? totalConfirmado : t.total;
  const subtotal = total / (1 + IGV_RATE);
  const paySecs = payT0 ? ((performance.now() - payT0) / 1000) : 0;
  const ticketId = compra.ticketId || ("TSG-" + Date.now().toString(36).toUpperCase());
  order = {
    ticketId, method,
    compraId: compra.compraId,
    total, subtotal, igv: total - subtotal, saving: t.saving, qty,
    items: itemsSnapshot,
    status: "PAGADO_PENDIENTE_CAJA",
    caja: null, salida: null, paySecs: Math.round(paySecs),
  };
  // 3) Solo con la compra confirmada se limpia el carrito en la clave del
  //    contexto activo (demo o cliente real), mediante saveState().
  cart = {}; saveState(); renderAll();
  issueCajaQR();
  saveOrder();
  $("payStep1").hidden = true;
  $("payStep2").hidden = false;
  $("payStep3").hidden = true;
  $("payStep4").hidden = true;
  setCheckoutStep(2);
  payT0 = 0;
  if (compra.demo) {
    toast("Compra de demostración completada. No se registraron datos reales.");
  } else {
    toast(`Compra registrada correctamente. N.° de compra: ${compra.compraId} · Total: ${money(total)}`);
  }
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
  // Identidad activa: en demo nunca se consulta ni se pinta el perfil real.
  const user = identidadActiva() || { name: "Cliente" };
  const dniTxt = !demoMode && user.dni ? ` | DNI: ${String(user.dni).replace(/</g, "&lt;")}` : "";
  const rucTxt = demoMode ? "RUC demo: 20100123456" : "RUC 20100123456";
  const tituloSalida = demoMode
    ? "TOTTUS SCAN & GO ✅ SALIDA AUTORIZADA (DEMO)"
    : "TOTTUS SCAN & GO ✅ SALIDA AUTORIZADA";
  $("payStep3").hidden = true;
  $("payStep4").hidden = false;
  setCheckoutStep(4);
  $("finalTicketBody").innerHTML =
    `<pre>${tituloSalida}\n${rucTxt} | ${order.ticketId}\nCliente: ${user.name.replace(/</g, "&lt;")}${dniTxt}\nPagado: ${money(order.total)} (${order.method}) en ${order.paySecs || 0}s\nSubtotal: ${money(order.subtotal)} | IGV: ${money(order.igv)}\nCaja: validada · Seguridad: validada\nItems: ${order.qty}\nPresenta esta pantalla al salir.</pre>`;
  $("payStep4").scrollIntoView({ behavior: "smooth" });
  // Demo: la orden simulada ya está en "tottus_demo_history"; no se escribe
  // en el historial real ("tottus_history").
  if (!demoMode) {
    saveHistoryEntry({ ticketId: order.ticketId, date: new Date().toLocaleString("es-PE"), total: order.total, qty: order.qty, method: order.method });
  }
  cargarHistorialRemoto();
  clearOrder(); // compra cerrada; QRs quedan invalidados (también en storage)
  confettiBurst();
  botSay(`🎉 <b>¡FELICIDADES POR TU COMPRA, ${firstName()}!</b> 🥳 Seguridad ya validó tu salida: puedes retirarte. Cada compra con Scan &amp; Go te ahorra la cola... ¡te espero en tu próxima visita! 💚`, 16000);
  toast("🛡️ Salida autorizada");
}

// ---------- INIT ----------
async function init() {
  limpiarDatosFalsosGoogle();
  limpiarPerfilLocalInventado();
  loadState();
  loadOrder();
  // Catálogo: intenta la API y espera el resultado antes de renderizar.
  await cargarProductosDesdeAPI();
  renderCodesHelp();
  renderAll();
  updateAuthUI();
  cargarHistorialRemoto();
  // Estado inicial del escáner según el CDN (no bloquea el resto de la app).
  updateScannerAvailability();
  const cdnScript = document.getElementById("quagga2-cdn");
  if (cdnScript && !cdnScript._scanGoErrorBound) {
    cdnScript._scanGoErrorBound = true;
    cdnScript.addEventListener("error", () => {
      window.__quaggaCdnFailed = true;
      updateScannerAvailability();
    });
  }
  if (order && !demoMode && identidadActiva()) {
    restoreOrderUI();
    toast("🔄 Retomaste tu pago pendiente");
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline opcional */ });
  }

  if (!window._registerBound) {
    window._registerBound = true;
    $("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      // Validaciones locales existentes (campos y mensajes ya usados).
      const { ok, firstBad } = validateRegisterAll();
      if (!ok) {
        if (firstBad && $(firstBad)) $(firstBad).focus({ preventScroll: false });
        return;
      }
      const form = $("loginForm");
      const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
      const btnTexto = submitBtn ? submitBtn.textContent : "";
      const nombre = ($("loginName").value || "").trim();
      const correo = ($("loginEmail").value || "").trim().toLowerCase();
      const password = $("loginPass").value || "";
      const passwordConfirm = $("loginPassConfirm").value || "";
      const dni = ($("loginDNI").value || "").trim();
      const fechaNacimiento = $("loginBirth").value || "";
      const errBox = $("registerError");
      const okBox = $("registerSuccess");
      setFormStatus(errBox, "");
      if (okBox) { okBox.hidden = true; okBox.textContent = ""; }
      // Evita envíos duplicados y muestra el estado de carga.
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Creando cuenta…"; }
      try {
        const response = await fetch(`${API_BASE_URL}/api/clientes/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Contrato exacto del backend: sin edad, esAdulto, id ni datos demo.
          body: JSON.stringify({ nombre, dni, correo, password, passwordConfirm, fechaNacimiento }),
        });
        // Un solo parseo: cuerpo no JSON se trata como respuesta inesperada.
        let payload = null;
        try { payload = await response.json(); } catch { payload = null; }
        if (response.status === 409) {
          // Cuenta ya existente: se conserva el formulario para corregir datos.
          setFormStatus(errBox, (payload && payload.message) || "Ya existe una cuenta con esos datos.", "error");
          return;
        }
        if (!response.ok || !payload || payload.success !== true) {
          const msg = (payload && typeof payload.message === "string" && payload.message)
            ? payload.message
            : "No se pudo crear la cuenta. Inténtalo nuevamente.";
          setFormStatus(errBox, msg, "error");
          return;
        }
        // Registro correcto: la respuesta segura ya trae el cliente creado.
        const profile = guardarSesionCliente(payload.data);
        if (!profile) {
          setFormStatus(errBox, "Respuesta inesperada del servidor. Inténtalo de nuevo.", "error");
          return;
        }
        ["loginName", "loginEmail", "loginPass", "loginPassConfirm", "loginDNI", "loginBirth"]
          .forEach((id) => { const el = $(id); if (el) el.value = ""; });
        clearRegisterErrors();
        const firstName = String(profile.name).split(" ")[0];
        setFormStatus(okBox, "Cuenta creada correctamente. ¡Bienvenido/a!", "success");
        loadState();
        loadOrder();
        limpiarHistorialRemoto();
        limpiarBoletaVisible();
        updateAuthUI();
        renderAll();
        cargarHistorialRemoto();
        toast(`✅ Cuenta creada. ¡Bienvenido/a, ${firstName}!`);
      } catch (error) {
        // Error de red: mensaje controlado, sin sesión falsa ni modo demo.
        setFormStatus(errBox, "No se pudo conectar con el servidor. Inténtalo nuevamente.", "error");
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = btnTexto || "Crear cuenta"; }
      }
    });
    // DNI: solo números, máximo 8 caracteres.
    const dniInput = $("loginDNI");
    if (dniInput) dniInput.addEventListener("input", () => {
      const clean = dniInput.value.replace(/\D/g, "").slice(0, 8);
      if (dniInput.value !== clean) dniInput.value = clean;
      if (dniInput.value) validateRegisterField("dni");
      else setRegError("loginDNI", "loginDNIError", "");
    });
    // Limpieza/actualización de errores al corregir + re-chequeo de confirmación.
    const liveMap = [["loginName", "name"], ["loginEmail", "email"], ["loginPass", "pass"], ["loginPassConfirm", "confirm"], ["loginBirth", "birth"]];
    liveMap.forEach(([id, field]) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", () => {
        validateRegisterField(field);
        if (field === "pass" && $("loginPassConfirm") && $("loginPassConfirm").value) validateRegisterField("confirm");
      });
      el.addEventListener("change", () => validateRegisterField(field));
    });
  }

  // Ver demostración: reutiliza enterDemo (misma vía que abre la tienda). Sin formularios ni credenciales.
  if (!window._demoBound) {
    window._demoBound = true;
    $("btnDemo").addEventListener("click", enterDemo);
  }

  // Acceso con Google: función PRÓXIMAMENTE (Etapa 3).
  // No se llama a POST /api/auth/google, no se carga Google Identity Services,
  // no se abre ningún formulario y no se simula sesión ni cuenta. Solo se
  // muestra un modal PROPIO de Scan & Go (no imita el selector oficial de
  // Google, no pide correo, contraseña ni nombre) con la función próximamente.
  function openGoogleModal() {
    const modal = $("googleModal");
    if (!modal) {
      toast("Acceso con Google próximamente. Por ahora, inicia sesión con tu correo y contraseña.");
      return;
    }
    googleModalTrigger = document.activeElement;
    modal.hidden = false;
    const ok = $("btnGoogleModalOk");
    if (ok) setTimeout(() => ok.focus({ preventScroll: true }), 30);
  }
  function closeGoogleModal() {
    const modal = $("googleModal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    const trigger = googleModalTrigger || $("btnGoogleAccess");
    googleModalTrigger = null;
    if (trigger && typeof trigger.focus === "function") trigger.focus({ preventScroll: true });
  }
  if (!window._googleAccessBound) {
    window._googleAccessBound = true;
    const btnGoogleAccess = $("btnGoogleAccess");
    if (btnGoogleAccess) btnGoogleAccess.addEventListener("click", openGoogleModal);
    const btnGoogleModalOk = $("btnGoogleModalOk");
    if (btnGoogleModalOk) btnGoogleModalOk.addEventListener("click", closeGoogleModal);
    const btnCloseGoogleModal = $("btnCloseGoogleModal");
    if (btnCloseGoogleModal) btnCloseGoogleModal.addEventListener("click", closeGoogleModal);
    const googleModal = $("googleModal");
    if (googleModal) googleModal.addEventListener("click", (e) => {
      if (e.target === googleModal) closeGoogleModal();
    });
    document.addEventListener("keydown", (e) => {
      const modal = $("googleModal");
      if (e.key === "Escape" && modal && !modal.hidden) closeGoogleModal();
    });
  }

  // Compatibilidad: POST /api/clientes/dni se conserva en el backend, pero ya
  // no existe ningún mecanismo de inicio de sesión por DNI en la interfaz.

  // Login mejorado: ver/ocultar contraseña
  $("btnTogglePass").addEventListener("click", () => {
    const i = $("loginPass");
    i.type = i.type === "password" ? "text" : "password";
    $("btnTogglePass").textContent = i.type === "password" ? "👁️" : "🙈";
  });
  if (!window._registerToggleBound) {
    window._registerToggleBound = true;
    const btnToggleConfirm = $("btnTogglePassConfirm");
    if (btnToggleConfirm) btnToggleConfirm.addEventListener("click", () => {
      const i = $("loginPassConfirm");
      if (!i) return;
      i.type = i.type === "password" ? "text" : "password";
      btnToggleConfirm.textContent = i.type === "password" ? "👁️" : "🙈";
    });
  }

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
      const hero = $("loginHero");
      if (hero) {
        hero.hidden = hidden;
        hero.setAttribute("aria-hidden", String(hidden));
      }
    }
    function showEmailLogin(opener) {
      lastOpener = opener || null;
      setIntroHidden(true);
      const reg = $("loginForm");
      if (reg) { reg.hidden = true; reg.setAttribute("aria-hidden", "true"); }
      const card = $("loginCard");
      if (card) { card.hidden = false; card.setAttribute("aria-hidden", "false"); }
      if ($("btnGoLogin")) $("btnGoLogin").setAttribute("aria-expanded", "true");
      if ($("btnGoRegister")) $("btnGoRegister").setAttribute("aria-expanded", "false");
      setFormStatus($("authStatus"), "");
      const firstField = $("authEmail");
      if (firstField) setTimeout(() => firstField.focus({ preventScroll: false }), 50);
    }
    function showRegister(opener) {
      lastOpener = opener || null;
      setIntroHidden(true);
      const card = $("loginCard");
      if (card) { card.hidden = true; card.setAttribute("aria-hidden", "true"); }
      const reg = $("loginForm");
      if (reg) { reg.hidden = false; reg.setAttribute("aria-hidden", "false"); }
      if ($("btnGoLogin")) $("btnGoLogin").setAttribute("aria-expanded", "false");
      if ($("btnGoRegister")) $("btnGoRegister").setAttribute("aria-expanded", "true");
      clearRegisterErrors();
      const name = $("loginName");
      if (name) setTimeout(() => name.focus({ preventScroll: false }), 50);
    }
    function showWelcome() {
      const card = $("loginCard");
      if (card) { card.hidden = true; card.setAttribute("aria-hidden", "true"); }
      const reg = $("loginForm");
      if (reg) { reg.hidden = true; reg.setAttribute("aria-hidden", "true"); }
      setIntroHidden(false);
      if ($("btnGoLogin")) $("btnGoLogin").setAttribute("aria-expanded", "false");
      if ($("btnGoRegister")) $("btnGoRegister").setAttribute("aria-expanded", "false");
      if (/^#(loginForm|registerForm|loginCard)$/.test(location.hash || "")) {
        history.replaceState(null, "", location.pathname + location.search);
      }
      ["authEmailError", "authPassError"].forEach((id) => {
        const p = $(id);
        if (p) { p.hidden = true; p.textContent = ""; }
      });
      ["authEmail", "authPass"].forEach((id) => {
        const i = $(id);
        if (i) i.removeAttribute("aria-invalid");
      });
      setFormStatus($("authStatus"), "");
      // Limpieza del registro al volver a la bienvenida: sin recarga ni cambio de URL.
      clearRegisterErrors();
      if ($("loginPass")) $("loginPass").value = "";
      if ($("loginPassConfirm")) $("loginPassConfirm").value = "";
      const hero = document.querySelector("#view-login .login-hero");
      if (hero) hero.scrollIntoView({ block: "start" });
      if (lastOpener) lastOpener.focus({ preventScroll: true });
      lastOpener = null;
    }
    window._scanGoShowWelcome = showWelcome;
    const btnGoLogin = $("btnGoLogin");
    if (btnGoLogin) btnGoLogin.addEventListener("click", () => showEmailLogin(btnGoLogin));
    const btnGoRegister = $("btnGoRegister");
    if (btnGoRegister) btnGoRegister.addEventListener("click", () => showRegister(btnGoRegister));
    const btnBack = $("btnBackToWelcome");
    if (btnBack) btnBack.addEventListener("click", showWelcome);
    const btnBackReg = $("btnBackToWelcomeReg");
    if (btnBackReg) btnBackReg.addEventListener("click", () => {
      showWelcome();
      const opener = $("btnGoRegister");
      if (opener) opener.focus({ preventScroll: true });
    });
    const btnSwitchToLogin = $("btnGoLoginFromRegister");
    if (btnSwitchToLogin) btnSwitchToLogin.addEventListener("click", () => showEmailLogin(btnSwitchToLogin));
    const btnSwitchToRegister = $("btnGoRegisterFromLogin");
    if (btnSwitchToRegister) btnSwitchToRegister.addEventListener("click", () => showRegister(btnSwitchToRegister));
    const btnForgot = $("btnForgotPass");
    if (btnForgot) btnForgot.addEventListener("click", () => toast("Recuperación de contraseña próximamente"));
    const btnToggleAuth = $("btnToggleAuthPass");
    if (btnToggleAuth) btnToggleAuth.addEventListener("click", () => {
      const i = $("authPass");
      if (!i) return;
      i.type = i.type === "password" ? "text" : "password";
      btnToggleAuth.textContent = i.type === "password" ? "👁️" : "🙈";
    });
    const emailForm = $("emailLoginForm");
    if (emailForm) emailForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = ($("authEmail").value || "").trim().toLowerCase();
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
      const statusBox = $("authStatus");
      const submitBtn = emailForm.querySelector('button[type="submit"]');
      const btnTexto = submitBtn ? submitBtn.textContent : "";
      setFormStatus(statusBox, "Iniciando sesión…");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Iniciando sesión…"; }
      try {
        // Autenticación real contra el backend (sin cookies, tokens ni demo).
        const response = await fetch(`${API_BASE_URL}/api/clientes/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo: email, password: pass }),
        });
        let payload = null;
        try { payload = await response.json(); } catch { payload = null; }
        if (!response.ok || !payload || payload.success !== true) {
          const msg = (payload && typeof payload.message === "string" && payload.message)
            ? payload.message
            : (response.status === 400 || response.status === 401
              ? "Correo o contraseña incorrectos."
              : "No se pudo iniciar sesión. Inténtalo nuevamente.");
          // 400/401/500: mensaje controlado, sin perfil ni modo demo.
          setFormStatus(statusBox, msg, "error");
          return;
        }
        // Solo se acepta la sesión si el backend devuelve un id entero > 0.
        const profile = guardarSesionCliente(payload.data);
        if (!profile) {
          setFormStatus(statusBox, "Respuesta inesperada del servidor. Inténtalo de nuevo.", "error");
          return;
        }
        $("authEmail").value = "";
        $("authPass").value = "";
        setFormStatus(statusBox, "");
        loadState();
        loadOrder();
        limpiarHistorialRemoto();
        limpiarBoletaVisible();
        updateAuthUI();
        renderAll();
        cargarHistorialRemoto();
        toast(`👋 Bienvenido/a, ${String(profile.name).split(" ")[0]}`);
      } catch (error) {
        // Error de red: no se crea sesión falsa ni se activa el modo demo.
        setFormStatus(statusBox, "No se pudo conectar con el servidor. Inténtalo nuevamente.", "error");
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = btnTexto || "Ingresar"; }
      }
    });
  }

  // TOBI: apertura/cierre solo desde el cuerpo con la "T"
  document.querySelector('.bot-body').addEventListener('click', (event) => {
    event.stopPropagation();
    window._tobiPressedOnce = true;
    const av0 = $("botAvatar");
    if (av0) { av0.classList.remove("tobi-nudge"); clearTimeout(av0._nudgeTimer); }
    $("botWidget").classList.toggle('active');
    const b = $("botBubble");
    if (b) {
      const isOpen = $("botWidget").classList.contains('active');
      b.hidden = !isOpen;
      b.classList.toggle('active', isOpen);
      if (isOpen) tobiGreetOnOpen();
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
  tobiNudgeStart();
  tobiNudgePrimer();

  document.querySelectorAll(".bottom-nav button").forEach(b => {
    b.addEventListener("click", () => {
      if (b.dataset.nav === "logout") {
        // Distingue salir de demo de cerrar sesión real:
        // - demo: NO elimina tottus_user; si hay sesión real pausada, vuelve a ella.
        // - real: elimina tottus_user y vuelve al acceso.
        const saliendoDeDemo = demoMode;
        saveState();
        saveOrder();
        if (saliendoDeDemo) {
          demoMode = false;
        } else {
          localStorage.removeItem("tottus_user");
        }
        stopCamera();
        stopQrTimer();
        botClose();
        loadState();
        loadOrder();
        limpiarHistorialRemoto();
        limpiarBoletaVisible();
        if (window._scanGoShowWelcome) window._scanGoShowWelcome();
        updateAuthUI();
        renderAll();
        cargarHistorialRemoto();
        if (saliendoDeDemo) {
          toast(identidadActiva()
            ? "Saliste del modo demo. Tu sesión real sigue activa."
            : "Saliste del modo demo");
        } else {
          toast("Sesión cerrada");
        }
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
    // Solo demo: el historial real vive en el backend y no debe simularse
    // su eliminación (reaparecería al recargar).
    if (!demoMode) return;
    try { localStorage.removeItem(DEMO_HISTORY_KEY); } catch { /* noop */ }
    renderHistory();
    toast("Historial demo borrado");
  });
  const btnFast = $("btnCloseFastModal");
  if (btnFast) btnFast.addEventListener("click", hideFastLimitModal);
  const fastModal = $("fastLimitModal");
  if (fastModal) fastModal.addEventListener("click", (e) => {
    if (e.target === fastModal) hideFastLimitModal();
  });
}

document.addEventListener("DOMContentLoaded", init);
