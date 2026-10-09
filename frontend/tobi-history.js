/* TOBI HISTORIAL (paso 3A) + NOMBRE DEL CLIENTE (paso 3B) — solo aditivo.
 * Capa de guardado SEPARADA de la interfaz: para migrar a backend, reemplaza
 * el interior de estas funciones por fetch() a TU endpoint; la UI no cambia.
 * LIMITACIÓN: los datos viven SOLO en este navegador (localStorage). No salen
 * a ningún servidor. El nombre del cliente es dato personal: jamás se imprime
 * en consola ni se envía a servicios externos.
 */

"use strict";

const TOBI_CHAT_KEYS = {
  convos: "tobi_chat_convos",   // lista de conversaciones
  active: "tobi_chat_active",   // id de la última conversación activa
  greeted: "tobi_chat_greeted", // saludo con nombre mostrado en esta visita (sessionStorage)
};
const TOBI_CHAT_LIMITS = { convos: 30, messages: 200, title: 40 };

// Aviso discreto (una vez) si el guardado falla; el chat sigue funcionando en memoria.
let _tobiChatStoreOk = true;
function tobiChatStoreWarn() {
  if (_tobiChatStoreOk) return;
  _tobiChatStoreOk = true; // se muestra una sola vez por carga
  try {
    const el = document.getElementById("tobiHistoryWarn");
    if (el) el.hidden = false;
  } catch { /* noop */ }
}

/* DÓNDE CONECTAR EL NOMBRE REAL: hoy se lee el perfil que la propia app guarda
 * en localStorage "tottus_user" (el mismo que pinta "Hola, ..." en el encabezado).
 * En modo demo no hay perfil y se devuelve "Cliente". Cuando exista sesión real
 * con backend, cambia SOLO esta función para leer el nombre de la sesión.
 * Ninguna otra parte del código escribe el nombre a mano: todas la llaman a ella. */
function getUserName() {
  try {
    const raw = localStorage.getItem("tottus_user");
    const u = raw ? JSON.parse(raw) : null;
    const first = u && u.name ? String(u.name).trim().split(/\s+/)[0] : "";
    if (first) return first;
  } catch { /* bloqueado o corrupto: cae al valor demo */ }
  return "Cliente"; // valor demo: aún no hay sesión real
}

// ---------- Guardado: una conversación = {id, title, createdAt, updatedAt, messages:[{who,text,ts}]} ----------
function tobiHistoryLoad() {
  try {
    const raw = localStorage.getItem(TOBI_CHAT_KEYS.convos);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((c) => c && c.id && Array.isArray(c.messages)) : [];
  } catch {
    _tobiChatStoreOk = false;
    return [];
  }
}

function tobiHistoryPersist(list) {
  try {
    const trimmed = (Array.isArray(list) ? list : [])
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, TOBI_CHAT_LIMITS.convos);
    localStorage.setItem(TOBI_CHAT_KEYS.convos, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    _tobiChatStoreOk = false;
    tobiChatStoreWarn();
    return Array.isArray(list) ? list : [];
  }
}

// guardar: crea la conversación si no existe y agrega el mensaje (con topes).
function tobiHistorySaveMsg(id, who, text, ts) {
  try {
    let list = tobiHistoryLoad();
    let convo = list.find((c) => c.id === id);
    if (!convo) {
      const now = Date.now();
      convo = { id, title: "Nueva conversación", createdAt: now, updatedAt: now, messages: [] };
      list.unshift(convo);
    }
    convo.messages.push({ who, text: String(text || ""), ts: ts || Date.now() });
    if (convo.messages.length > TOBI_CHAT_LIMITS.messages) {
      convo.messages = convo.messages.slice(-TOBI_CHAT_LIMITS.messages);
    }
    // Título con el primer mensaje del cliente (máx. 40 caracteres).
    if (who === "user" && (!convo.title || convo.title === "Nueva conversación")) {
      const first = convo.messages.find((m) => m.who === "user");
      if (first) convo.title = String(first.text || "").trim().slice(0, TOBI_CHAT_LIMITS.title) || "Nueva conversación";
    }
    convo.updatedAt = Date.now();
    tobiHistoryPersist(list);
    try { localStorage.setItem(TOBI_CHAT_KEYS.active, id); } catch { /* noop */ }
    return convo;
  } catch {
    _tobiChatStoreOk = false;
    tobiChatStoreWarn();
    return null;
  }
}

// listar: de la más reciente a la más antigua.
function tobiHistoryList() {
  try {
    return tobiHistoryLoad().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch {
    return [];
  }
}

// abrir: devuelve la conversación por id (o null) y la marca como activa.
function tobiHistoryOpen(id) {
  try {
    const convo = tobiHistoryLoad().find((c) => c.id === id) || null;
    if (convo) {
      try { localStorage.setItem(TOBI_CHAT_KEYS.active, id); } catch { /* noop */ }
    }
    return convo;
  } catch {
    return null;
  }
}

// borrar: una conversación (con confirmación en la UI, no aquí).
function tobiHistoryDelete(id) {
  try {
    const list = tobiHistoryLoad().filter((c) => c.id !== id);
    tobiHistoryPersist(list);
    try {
      if (localStorage.getItem(TOBI_CHAT_KEYS.active) === id) {
        localStorage.removeItem(TOBI_CHAT_KEYS.active);
      }
    } catch { /* noop */ }
    return list;
  } catch {
    return tobiHistoryLoad();
  }
}

// borrar todo el historial (con confirmación en la UI, no aquí).
function tobiHistoryClearAll() {
  try {
    localStorage.removeItem(TOBI_CHAT_KEYS.convos);
    localStorage.removeItem(TOBI_CHAT_KEYS.active);
  } catch {
    _tobiChatStoreOk = false;
    tobiChatStoreWarn();
  }
}

function tobiHistoryGetActiveId() {
  try {
    return localStorage.getItem(TOBI_CHAT_KEYS.active) || "";
  } catch {
    return "";
  }
}

function tobiHistoryNewId() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "tobi-" + window.crypto.randomUUID();
    }
  } catch { /* cae al plan B */ }
  return "tobi-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
}

// Saludo único por visita (sessionStorage + respaldo en memoria).
let _tobiGreetedMem = false;
function tobiGreetedThisVisit() {
  if (_tobiGreetedMem) return true;
  try {
    return sessionStorage.getItem(TOBI_CHAT_KEYS.greeted) === "1";
  } catch {
    return false;
  }
}
function tobiMarkGreeted() {
  _tobiGreetedMem = true;
  try {
    sessionStorage.setItem(TOBI_CHAT_KEYS.greeted, "1");
  } catch { /* sin sessionStorage, vale el respaldo en memoria */ }
}
