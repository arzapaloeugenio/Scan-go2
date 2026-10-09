/* TOBI ALÉRGENOS DEL CATÁLOGO (paso 8.2) — solo aditivo.
 * Tabla local deducida del nombre/marca de los 14 productos + alerta al agregar
 * al carrito + etiqueta discreta en tarjetas. app.js NO se toca: se envuelve
 * addToCart y se observan las tarjetas con MutationObserver.
 *
 * DEMOSTRACIÓN: esta tabla debe validarse con datos reales de los fabricantes.
 * NUNCA se presenta un producto como "seguro": solo coincidencias detectadas,
 * y siempre se pide verificar la etiqueta. Sin red. Sin consola.
 */

"use strict";

// Etiquetas: lacteos, gluten, huevo, mani, frutos secos, pescado, mariscos,
// soya, sesamo. verified:false = "composición no verificada" (no se asegura).
const TOBI_PRODUCT_ALLERGENS = [
  { code: "7750123450013", labels: ["lacteos"], verified: true },   // Leche Gloria
  { code: "7750123450020", labels: ["gluten"], verified: true },    // Pan de Molde
  { code: "7750123450037", labels: [], verified: true },            // Arroz
  { code: "7750123450044", labels: [], verified: false },           // Aceite Vegetal (puede ser de soya)
  { code: "7750123450051", labels: [], verified: true },            // Pollo Entero
  { code: "7750123450068", labels: [], verified: false },           // Gaseosa (procesada)
  { code: "7750123450075", labels: ["gluten"], verified: true },    // Fideos
  { code: "7750123450082", labels: [], verified: true },            // Detergente (no alimentario)
  { code: "7750123450099", labels: [], verified: true },            // Manzana
  { code: "7750123450105", labels: [], verified: false },           // Chocolate (procesado)
  { code: "7750123450112", labels: [], verified: false },           // Café instantáneo (procesado)
  { code: "7750123450129", labels: [], verified: true },            // Papel Higiénico (no alimentario)
  { code: "7750123450136", labels: ["gluten"], verified: true },    // Cerveza (cebada)
  { code: "7750123450143", labels: [], verified: false },           // Vino (sulfitos fuera de etiquetas)
];

function tobiNormSimple(s) {
  try { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }
  catch { return String(s || "").toLowerCase().trim(); }
}

// Etiquetas del producto + si su composición está verificada.
function tobiProductAllergens(code) {
  try {
    const row = TOBI_PRODUCT_ALLERGENS.find((r) => r.code === String(code));
    if (!row) return { labels: [], verified: false };
    return { labels: (row.labels || []).slice(), verified: !!row.verified };
  } catch {
    return { labels: [], verified: false };
  }
}

// ¿Este producto coincide con alguna alergia registrada? Devuelve {labels, names}
// o null. Cruza por etiquetas (vía grupos de recetas si existen) y por texto.
function tobiProductClash(product) {
  try {
    if (!product) return null;
    if (typeof tobiProfileGetAllergies !== "function") return null;
    if (typeof tobiProfileHasNone === "function" && tobiProfileHasNone()) return null;
    const allergies = tobiProfileGetAllergies();
    if (!allergies.length) return null; // sin alergias: no se muestra nada
    const info = tobiProductAllergens(product.code);
    const labels = [], names = [];
    allergies.forEach((a) => {
      const raw = String(a.name || "");
      const n = tobiNormSimple(raw);
      if (!n) return;
      let hit = false;
      // 1) Por etiqueta: la alergia mapea a etiquetas del producto.
      try {
        if (typeof tobiRecipeAllergyLabels === "function") {
          const map = tobiRecipeAllergyLabels(raw);
          (map.labels || []).forEach((lb) => {
            if (info.labels.indexOf(lb) !== -1 && labels.indexOf(lb) === -1) { labels.push(lb); hit = true; }
          });
        }
      } catch { /* noop */ }
      // 2) Por texto: la alergia aparece en nombre/marca del producto.
      try {
        const hay = tobiNormSimple((product.name || "") + " " + (product.brand || ""));
        if (n.length >= 3 && (hay.indexOf(n) !== -1 || n.split(/\s+/).some((w) => w.length >= 4 && hay.indexOf(w) !== -1))) hit = true;
      } catch { /* noop */ }
      if (hit && names.indexOf(raw) === -1) names.push(raw);
    });
    if (!labels.length && !names.length) return null;
    return { labels, names, verified: info.verified };
  } catch {
    return null;
  }
}

// Aviso ANTES de agregar: modal con "Agregar igual" / "No agregar".
// Si el aviso falla por cualquier motivo, el producto se agrega igual.
function tobiConfirmAdd(code, qty, clash, productName) {
  try {
    const orig = window._tobiOrigAddToCart;
    if (typeof orig !== "function") return false;
    const old = document.getElementById("tobiAllergyModal");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    const overlay = document.createElement("div");
    overlay.id = "tobiAllergyModal";
    overlay.className = "modal-overlay";
    const card = document.createElement("div");
    card.className = "modal-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    const h = document.createElement("h3");
    h.textContent = "⚠️ Revisa este producto";
    const p = document.createElement("p");
    if (clash && clash.verified) {
      p.textContent = "«" + productName + "» coincide con tu alergia (" + clash.names.join(", ") +
        "). Verifica siempre la etiqueta del producto. ¿Qué hacemos?";
    } else {
      p.textContent = "No pude verificar los ingredientes de «" + productName + "»; revisa la etiqueta. ¿Qué hacemos?";
    }
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-primary";
    addBtn.textContent = "Agregar igual";
    addBtn.addEventListener("click", () => {
      try { overlay.parentNode.removeChild(overlay); } catch { /* noop */ }
      try { orig(code, qty); } catch { /* noop */ }
    });
    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "btn-ghost";
    noBtn.textContent = "No agregar";
    const close = () => { try { overlay.parentNode.removeChild(overlay); } catch { /* noop */ } };
    noBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(addBtn);
    card.appendChild(noBtn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    if (addBtn.focus) addBtn.focus({ preventScroll: true });
    return true;
  } catch {
    return false;
  }
}

// Envoltorio de addToCart (app.js intacto): intercepta, avisa o deja pasar.
function tobiWrapAddToCart() {
  try {
    if (window._tobiOrigAddToCart || typeof addToCart !== "function") return;
    window._tobiOrigAddToCart = addToCart;
    // eslint-disable-next-line no-global-assign, no-func-assign
    addToCart = function (code, qty) {
      try {
        qty = qty === undefined ? 1 : qty;
        const prod = (typeof PRODUCTS !== "undefined")
          ? PRODUCTS.find((p) => p && p.code === code) : null;
        const clash = prod ? tobiProductClash(prod) : null;
        const needsWarn = clash || (prod && !tobiProductAllergens(code).verified &&
          typeof tobiProfileGetAllergies === "function" && tobiProfileGetAllergies().length > 0);
        if (prod && needsWarn) {
          const shown = tobiConfirmAdd(code, qty, clash, prod.name);
          if (shown) return false; // el modal decide; "Agregar igual" reintenta
        }
      } catch { /* ante cualquier fallo, se agrega igual abajo */ }
      return window._tobiOrigAddToCart(code, qty);
    };
  } catch { /* si el envoltorio falla, todo sigue igual */ }
}

// Etiqueta discreta "⚠️ Contiene X" en tarjetas (solo con alergias registradas).
function tobiPaintCatalogBadges() {
  try {
    // Sin alergias registradas (o "sin alergias"): no se muestra nada.
    let allergies = [];
    try {
      if (typeof tobiProfileHasNone === "function" && tobiProfileHasNone()) allergies = [];
      else if (typeof tobiProfileGetAllergies === "function") allergies = tobiProfileGetAllergies();
    } catch { allergies = []; }
    if (!allergies.length) {
      document.querySelectorAll(".tobi-allergen-badge").forEach((b) => b.remove());
      return;
    }
    const grid = document.getElementById("productGrid");
    if (!grid || typeof PRODUCTS === "undefined") return;
    grid.querySelectorAll(".product").forEach((card) => {
      try {
        if (card.querySelector(".tobi-allergen-badge")) return;
        const btn = card.querySelector("[data-add]");
        if (!btn) return;
        const prod = PRODUCTS.find((p) => p && p.code === btn.getAttribute("data-add"));
        if (!prod) return;
        const clash = tobiProductClash(prod);
        if (!clash || !clash.verified) return; // solo coincidencias verificadas
        const badge = document.createElement("span");
        badge.className = "tobi-allergen-badge";
        badge.textContent = "⚠️ Contiene " + clash.names.join(", ");
        badge.title = "Coincide con tu alergia. Verifica siempre la etiqueta del producto.";
        const body = card.querySelector(".product-body") || card;
        body.insertBefore(badge, body.firstChild);
      } catch { /* noop */ }
    });
  } catch { /* noop */ }
}

function tobiWatchCatalog() {
  try {
    tobiWrapAddToCart();
    tobiPaintCatalogBadges();
    const grid = document.getElementById("productGrid");
    if (!grid || typeof MutationObserver === "undefined" || grid._tobiWatched) return;
    grid._tobiWatched = true;
    new MutationObserver(() => {
      try { tobiPaintCatalogBadges(); } catch { /* noop */ }
    }).observe(grid, { childList: true, subtree: true });
  } catch { /* noop */ }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", tobiWatchCatalog);
} else {
  tobiWatchCatalog();
}
