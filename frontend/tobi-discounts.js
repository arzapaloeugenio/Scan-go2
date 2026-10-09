/* TOBI DESCUENTOS DEL DÍA (paso 7A) — solo aditivo.
 * Config simple y comentada: descuentos por día de semana y/o fecha específica.
 *
 * DÓNDE CONECTAR DATOS REALES (API o backend): reemplaza el contenido de
 * TOBI_DISCOUNTS por un fetch() a TU endpoint (ej. GET /api/discounts) que
 * devuelva el mismo formato [{id,title,desc,percent,productIds,days,start,end}].
 * Mantén tobiDiscountsToday() igual: la conversación y la pantalla no cambian.
 * NUNCA pongas API keys en este archivo: las claves viven en el servidor.
 *
 * NOTA: los descuentos de ejemplo son de DEMOSTRACIÓN (no son precios reales).
 * Los % de productos se REUTILIZAN del catálogo (PRODUCTS[].discount, calculado
 * desde oldPrice) para no tener dos versiones del mismo precio. Solo las promos
 * por categoría traen su propio porcentaje.
 */

"use strict";

// days: 0=domingo, 1=lunes, ..., 6=sábado. start/end: "AAAA-MM-DD" opcionales.
const TOBI_DISCOUNTS = [
  { id: "d-lunes-limpieza", title: "Lunes de Limpieza", desc: "Descuento en limpieza para empezar la semana.", percent: null, productIds: [8], category: null, days: [1], start: null, end: "2026-12-31" },
  { id: "d-martes-cafe", title: "Martes de Café", desc: "Tu café de la semana con descuento.", percent: null, productIds: [11], category: null, days: [2], start: null, end: "2026-12-31" },
  { id: "d-miercoles-despensa", title: "Miércoles de Despensa", desc: "Básicos de despensa con rebaja.", percent: null, productIds: [1, 10], category: null, days: [3], start: null, end: "2026-12-31" },
  { id: "d-jueves-cafe", title: "Jueves de Café", desc: "Repite tu café favorito con descuento.", percent: null, productIds: [11], category: null, days: [4], start: null, end: "2026-12-31" },
  { id: "d-viernes-despensa", title: "Viernes de Despensa", desc: "Arroz y café para el fin de semana.", percent: null, productIds: [3, 11], category: null, days: [5], start: null, end: "2026-12-31" },
  { id: "d-finde-fresco", title: "Finde Fresco", desc: "Proteína y bebidas para sábado y domingo.", percent: null, productIds: [5, 6], category: null, days: [6, 0], start: null, end: "2026-12-31" },
  { id: "d-octubre-fiesta", title: "Fiesta de Octubre", desc: "Promo especial solo por este mes.", percent: null, productIds: [13], category: null, days: null, start: "2026-10-01", end: "2026-10-31" },
  { id: "d-finde-limpieza", title: "Finde Limpieza Extra", desc: "5% adicional en limpieza este fin de semana.", percent: 5, productIds: null, category: "limpieza", days: [6, 0], start: null, end: "2026-12-31" },
];

const TOBI_DAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Fecha de hoy en Lima (America/Lima): { ymd: "AAAA-MM-DD", weekday: 0-6 }.
// Acepta fecha opcional para probar otros días (ej. simular un lunes).
function tobiLimaToday(date) {
  try {
    const d = date instanceof Date ? date : new Date();
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    const m = parts.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return { ymd: "", weekday: new Date().getDay() };
    const ymd = m[1] + "-" + m[2] + "-" + m[3];
    const weekday = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)).getUTCDay();
    return { ymd, weekday };
  } catch {
    const d = date instanceof Date ? date : new Date();
    return { ymd: "", weekday: d.getDay() };
  }
}

function tobiDiscountValidUntil(entry) {
  try {
    const bits = [];
    if (Array.isArray(entry.days) && entry.days.length) {
      bits.push(entry.days.length >= 2
        ? entry.days.map((w) => TOBI_DAYS_ES[w]).join(" y ")
        : "Solo " + TOBI_DAYS_ES[entry.days[0]]);
    }
    if (entry.end) {
      const p = String(entry.end).split("-");
      bits.push("Hasta " + p[2] + "/" + p[1]);
    }
    return bits.join(" · ") || "Hoy";
  } catch {
    return "Hoy";
  }
}

// Devuelve los descuentos vigentes HOY [{id,title,desc,percent,products,validUntil}].
// - productIds: reutiliza el % del catálogo (una sola fuente de precio).
// - category + percent propio: promo adicional (no duplica precios).
// - Ignora vencidos o que aún no empiezan. Sin red. Sin consola.
function tobiDiscountsToday(date) {
  const out = [];
  try {
    if (!Array.isArray(TOBI_DISCOUNTS)) return out;
    const prods = (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)) ? PRODUCTS : [];
    const today = tobiLimaToday(date);
    TOBI_DISCOUNTS.forEach((e) => {
      if (!e || !e.id || !e.title) return;
      if (Array.isArray(e.days) && e.days.length && today.weekday !== undefined) {
        if (e.days.indexOf(today.weekday) === -1) return;
      }
      if (e.start && today.ymd && today.ymd < e.start) return; // aún no empieza
      if (e.end && today.ymd && today.ymd > e.end) return;     // ya venció
      const products = [];
      (e.productIds || []).forEach((pid) => {
        const p = prods.find((x) => x && x.id === pid);
        if (!p) return;
        const pct = (typeof e.percent === "number") ? e.percent : (p.discount || 0);
        if (!pct) return; // sin % no se muestra (evita duplicar sin descuento real)
        products.push({ id: p.id, name: p.name, code: p.code, percent: pct, image: p.image || "" });
      });
      if (e.category && typeof e.percent === "number") {
        prods.filter((p) => p && p.cat === e.category).forEach((p) => {
          products.push({ id: p.id, name: p.name, code: p.code, percent: e.percent, image: p.image || "" });
        });
      }
      if (!products.length) return;
      const top = Math.max.apply(null, products.map((p) => p.percent));
      out.push({ id: e.id, title: e.title, desc: e.desc || "", percent: (typeof e.percent === "number") ? e.percent : top, products, validUntil: tobiDiscountValidUntil(e) });
    });
    return out;
  } catch {
    return out;
  }
}
