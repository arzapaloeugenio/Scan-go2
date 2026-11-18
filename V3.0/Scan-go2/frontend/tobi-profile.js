/* TOBI PERFIL: ALERGIAS (paso 4A) + PRODUCTOS FRECUENTES (paso 5A) — solo aditivo.
 * Capa de datos SEPARADA de la interfaz: para migrar a backend (perfil real del
 * usuario), reemplaza el interior de estas funciones por fetch() a TU endpoint;
 * la conversación y las pantallas "Mis alergias" / "Mis productos" no cambian.
 *
 * PRIVACIDAD (datos personales; las alergias además son datos de salud sensibles):
 * - Se guardan SOLO en este navegador (localStorage). No salen a ningún servidor.
 * - Jamás se imprimen en consola ni se envían a servicios externos.
 * - En el historial de conversaciones queda solo lo que el cliente escribió
 *   (más la confirmación que él mismo aceptó); no se agrega nada más.
 * LIMITACIÓN: hoy es solo local; el perfil real del backend lo conectará aquí.
 */

"use strict";

const TOBI_PROFILE_KEYS = {
  allergies: "tobi_profile_allergies", // [{id, name, ts}] o { none: true } si declaró no tener
  asked: "tobi_profile_asked",         // "1" cuando ya se le preguntó (distinto de "sin alergias")
  reminded: "tobi_profile_reminded",   // sessionStorage: recordatorio discreto ya mostrado en la visita
  frequents: "tobi_profile_frequents", // [{id, name, ts}] productos que suele comprar
  frequentsAsked: "tobi_profile_frequents_asked", // "1" cuando ya se le preguntó por frecuentes
  frequentsReminded: "tobi_profile_frequents_reminded", // sessionStorage: recordatorio discreto de la visita
  frequentsLater: "tobi_profile_frequents_later", // sessionStorage: eligió "después" en esta visita
};
const TOBI_PROFILE_LIMITS = { items: 20, name: 40, frequents: 30 };

let _tobiProfileStoreOk = true;
function tobiProfileStoreWarn() {
  if (_tobiProfileStoreOk) return;
  _tobiProfileStoreOk = true; // se muestra una sola vez por carga
  try {
    const el = document.getElementById("tobiAllergyWarn");
    if (el) el.hidden = false;
  } catch { /* noop */ }
  try {
    const el3 = document.getElementById("tobiFrequentWarn");
    if (el3) el3.hidden = false;
  } catch { /* noop */ }
  try {
    const el2 = document.getElementById("tobiHistoryWarn");
    if (el2) el2.hidden = false;
  } catch { /* noop */ }
}

// Normaliza: minúsculas, sin espacios sobrantes, tope de 40 caracteres.
function tobiProfileNormalize(raw) {
  return String(raw || "").toLowerCase().trim().replace(/\s+/g, " ").replace(/[.\s]+$/, "").slice(0, TOBI_PROFILE_LIMITS.name);
}

// obtener alergias: lista [{id, name, ts}] (vacía si no hay o si declaró "sin alergias").
function tobiProfileGetAllergies() {
  try {
    const raw = localStorage.getItem(TOBI_PROFILE_KEYS.allergies);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data && data.none === true) return [];
    return Array.isArray(data) ? data.filter((a) => a && a.name) : [];
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return [];
  }
}

function tobiProfilePersist(list) {
  try {
    localStorage.setItem(TOBI_PROFILE_KEYS.allergies, JSON.stringify((list || []).slice(0, TOBI_PROFILE_LIMITS.items)));
    return true;
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return false;
  }
}

function tobiProfileNewId() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "alg-" + window.crypto.randomUUID();
    }
  } catch { /* cae al plan B */ }
  return "alg-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
}

// agregar: evita duplicados (por nombre normalizado) y respeta el tope de 20.
function tobiProfileAdd(name) {
  const clean = tobiProfileNormalize(name);
  if (!clean) return { ok: false, reason: "empty" };
  try {
    let list = tobiProfileGetAllergies();
    if (list.some((a) => a.name === clean)) return { ok: false, reason: "dup", name: clean };
    if (list.length >= TOBI_PROFILE_LIMITS.items) return { ok: false, reason: "full", name: clean };
    // Si había declarado "sin alergias", al agregar una se levanta ese estado.
    list.push({ id: tobiProfileNewId(), name: clean, ts: Date.now() });
    tobiProfilePersist(list);
    return { ok: true, name: clean };
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return { ok: false, reason: "store" };
  }
}

// editar el nombre de una existente (con normalizado + control de duplicados).
function tobiProfileUpdate(id, name) {
  const clean = tobiProfileNormalize(name);
  if (!clean) return { ok: false, reason: "empty" };
  try {
    const list = tobiProfileGetAllergies();
    const item = list.find((a) => a.id === id);
    if (!item) return { ok: false, reason: "missing" };
    if (list.some((a) => a.id !== id && a.name === clean)) return { ok: false, reason: "dup", name: clean };
    item.name = clean;
    tobiProfilePersist(list);
    return { ok: true, name: clean };
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return { ok: false, reason: "store" };
  }
}

// eliminar una (con confirmación en la UI, no aquí).
function tobiProfileDelete(id) {
  try {
    tobiProfilePersist(tobiProfileGetAllergies().filter((a) => a.id !== id));
    return true;
  } catch {
    return false;
  }
}

// borrar todas (con confirmación en la UI, no aquí).
function tobiProfileClearAll() {
  try {
    localStorage.removeItem(TOBI_PROFILE_KEYS.allergies);
    return true;
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return false;
  }
}

// "No tengo alergias": estado guardado, distinto de "aún no se le preguntó".
function tobiProfileSetNone() {
  try {
    localStorage.setItem(TOBI_PROFILE_KEYS.allergies, JSON.stringify({ none: true, ts: Date.now() }));
    tobiProfileMarkAsked();
    return true;
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return false;
  }
}

function tobiProfileHasNone() {
  try {
    const raw = localStorage.getItem(TOBI_PROFILE_KEYS.allergies);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!(data && data.none === true);
  } catch {
    return false;
  }
}

// saber si ya se le preguntó al cliente (para preguntar una sola vez).
function tobiProfileWasAsked() {
  try {
    return localStorage.getItem(TOBI_PROFILE_KEYS.asked) === "1";
  } catch {
    return false;
  }
}
function tobiProfileMarkAsked() {
  try {
    localStorage.setItem(TOBI_PROFILE_KEYS.asked, "1");
  } catch { /* sin storage, se reintentará en otra visita */ }
}

// Recordatorio discreto: como máximo una vez por visita (sessionStorage).
function tobiProfileRemindedThisVisit() {
  try {
    return sessionStorage.getItem(TOBI_PROFILE_KEYS.reminded) === "1";
  } catch {
    return false;
  }
}
function tobiProfileMarkReminded() {
  try {
    sessionStorage.setItem(TOBI_PROFILE_KEYS.reminded, "1");
  } catch { /* noop */ }
}

// "Responder después": bandera de visita (sessionStorage, máx. un recordatorio).
function tobiProfileLaterThisVisit() {
  try {
    return sessionStorage.getItem("tobi_profile_later") === "1";
  } catch {
    return false;
  }
}
function tobiProfileMarkLater() {
  try {
    sessionStorage.setItem("tobi_profile_later", "1");
  } catch { /* noop */ }
}
// Divide un mensaje en varias alergias: comas o "y"/"e" ("maní, lácteos y mariscos").
function tobiProfileSplitList(text) {
  try {
    return String(text || "")
      .split(/,|\by\b|\be\b/i)
      .map((p) => tobiProfileNormalize(p))
      .filter((p) => p.length > 0)
      .filter((p, i, arr) => arr.indexOf(p) === i);
  } catch {
    return [];
  }
}

// ---------- PRODUCTOS FRECUENTES (paso 5A, solo aditivo) ----------
// Mismo estilo de guardado que alergias: {id, nombre normalizado, fecha}.
// Sin duplicados; tope de 30 elementos y 40 caracteres por nombre.
// DÓNDE CONECTAR AL BACKEND: igual que alergias, aquí (perfil real del usuario).
function tobiFrequentGet() {
  try {
    const raw = localStorage.getItem(TOBI_PROFILE_KEYS.frequents);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((p) => p && p.name) : [];
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return [];
  }
}

function tobiFrequentPersist(list) {
  try {
    localStorage.setItem(TOBI_PROFILE_KEYS.frequents, JSON.stringify((list || []).slice(0, TOBI_PROFILE_LIMITS.frequents)));
    return true;
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return false;
  }
}

function tobiFrequentAdd(name) {
  const clean = tobiProfileNormalize(name);
  if (!clean) return { ok: false, reason: "empty" };
  try {
    const list = tobiFrequentGet();
    if (list.some((p) => p.name === clean)) return { ok: false, reason: "dup", name: clean };
    if (list.length >= TOBI_PROFILE_LIMITS.frequents) return { ok: false, reason: "full", name: clean };
    list.push({ id: tobiProfileNewId(), name: clean, ts: Date.now() });
    tobiFrequentPersist(list);
    return { ok: true, name: clean };
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return { ok: false, reason: "store" };
  }
}

function tobiFrequentUpdate(id, name) {
  const clean = tobiProfileNormalize(name);
  if (!clean) return { ok: false, reason: "empty" };
  try {
    const list = tobiFrequentGet();
    const item = list.find((p) => p.id === id);
    if (!item) return { ok: false, reason: "missing" };
    if (list.some((p) => p.id !== id && p.name === clean)) return { ok: false, reason: "dup", name: clean };
    item.name = clean;
    tobiFrequentPersist(list);
    return { ok: true, name: clean };
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return { ok: false, reason: "store" };
  }
}

function tobiFrequentDelete(id) {
  try {
    tobiFrequentPersist(tobiFrequentGet().filter((p) => p.id !== id));
    return true;
  } catch {
    return false;
  }
}

function tobiFrequentClearAll() {
  try {
    localStorage.removeItem(TOBI_PROFILE_KEYS.frequents);
    return true;
  } catch {
    _tobiProfileStoreOk = false;
    tobiProfileStoreWarn();
    return false;
  }
}

// saber si ya se le preguntó por frecuentes (para preguntar una sola vez).
function tobiFrequentWasAsked() {
  try {
    return localStorage.getItem(TOBI_PROFILE_KEYS.frequentsAsked) === "1";
  } catch {
    return false;
  }
}
function tobiFrequentMarkAsked() {
  try {
    localStorage.setItem(TOBI_PROFILE_KEYS.frequentsAsked, "1");
  } catch { /* sin storage, se reintentará en otra visita */ }
}

// "Responder después" + recordatorio discreto (máx. 1 por visita, sessionStorage).
function tobiFrequentLaterThisVisit() {
  try {
    return sessionStorage.getItem(TOBI_PROFILE_KEYS.frequentsLater) === "1";
  } catch {
    return false;
  }
}
function tobiFrequentMarkLater() {
  try {
    sessionStorage.setItem(TOBI_PROFILE_KEYS.frequentsLater, "1");
  } catch { /* noop */ }
}
function tobiFrequentRemindedThisVisit() {
  try {
    return sessionStorage.getItem(TOBI_PROFILE_KEYS.frequentsReminded) === "1";
  } catch {
    return false;
  }
}
function tobiFrequentMarkReminded() {
  try {
    sessionStorage.setItem(TOBI_PROFILE_KEYS.frequentsReminded, "1");
  } catch { /* noop */ }
}

// ¿Está este producto en el catálogo de la app? (solo lectura, sin tocar el carrito).
// Compara sin tildes contra nombre + marca (ej. "leche" → Leche Gloria Entera 1L).
function tobiFrequentInCatalog(name) {
  try {
    if (typeof PRODUCTS === "undefined" || !Array.isArray(PRODUCTS)) return null;
    const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const needle = norm(name).trim();
    if (needle.length < 3) return null;
    const hit = PRODUCTS.find((p) => {
      const hay = norm(p.name + " " + (p.brand || ""));
      return hay.indexOf(needle) !== -1 || needle.split(/\s+/).some((w) => w.length >= 4 && hay.indexOf(w) !== -1);
    });
    return hit || null;
  } catch {
    return null;
  }
}

// ---------- LISTA DE COMPRAS (paso 8.3, solo aditivo) ----------
// [{name, code|null, bought}] con prefijo tobi_profile_, try/catch y tope 50.
// NUNCA agrega al carrito: solo enlaza al producto del catálogo.
const TOBI_SHOPPING_KEY = "tobi_profile_shopping";
const TOBI_SHOPPING_LIMIT = 50;
function tobiShoppingLoad() {
  try {
    const raw = localStorage.getItem(TOBI_SHOPPING_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => x && x.name).slice(0, TOBI_SHOPPING_LIMIT) : [];
  } catch {
    return [];
  }
}
function tobiShoppingPersist(list) {
  try {
    localStorage.setItem(TOBI_SHOPPING_KEY, JSON.stringify((list || []).slice(0, TOBI_SHOPPING_LIMIT)));
    return true;
  } catch {
    return false;
  }
}
// Agrega lo que falta (evita duplicados por nombre). Devuelve cuántos sumó.
function tobiShoppingAddMissing(items) {
  try {
    const list = tobiShoppingLoad();
    let added = 0;
    (items || []).forEach((it) => {
      if (list.length >= TOBI_SHOPPING_LIMIT) return;
      const nm = String((it && it.name) || "").trim().slice(0, 40);
      if (!nm || list.some((x) => x.name === nm)) return;
      list.push({ name: nm, code: (it && it.code) || null, bought: false });
      added += 1;
    });
    tobiShoppingPersist(list);
    return added;
  } catch {
    return 0;
  }
}
function tobiShoppingToggle(idx) {
  try {
    const list = tobiShoppingLoad();
    if (list[idx]) { list[idx].bought = !list[idx].bought; tobiShoppingPersist(list); }
    return list;
  } catch {
    return tobiShoppingLoad();
  }
}
function tobiShoppingRemove(idx) {
  try {
    const list = tobiShoppingLoad().filter((_, i) => i !== idx);
    tobiShoppingPersist(list);
    return list;
  } catch {
    return tobiShoppingLoad();
  }
}
function tobiShoppingClear() {
  try {
    localStorage.removeItem(TOBI_SHOPPING_KEY);
  } catch { /* noop */ }
}
