/* TOBI RECETAS SALUDABLES (paso 6A/6B) — solo aditivo.
 * Base local de recetas sencillas y comunes en Perú + filtro de seguridad.
 * REGLA DE SEGURIDAD: una receta NO se muestra si alguno de sus ingredientes
 * coincide con una alergia registrada. Sin excepciones.
 * Sin librerías. Sin red. Sin consola. Todo con textContent en la UI.
 */

"use strict";

// Etiquetas de alérgenos usadas: lacteos, gluten, huevo, mani, frutos secos,
// pescado, mariscos, soya, sesamo.
const TOBI_RECIPES = [
  { id: "r01", name: "Avena con manzana y canela", desc: "Desayuno caliente, económico y con fibra.", time: "10 min", servings: 2, tag: "desayuno",
    ingredients: [{ name: "avena", allergens: ["gluten"] }, { name: "manzana", allergens: [] }, { name: "canela", allergens: [] }, { name: "agua", allergens: [] }],
    steps: ["Hierve 2 tazas de agua.", "Agrega 1 taza de avena y cocina 5 min.", "Sirve con manzana picada y canela."] },
  { id: "r02", name: "Quinua con leche y manzana", desc: "Quinua cremosa de desayuno, con proteína completa.", time: "20 min", servings: 2, tag: "desayuno",
    ingredients: [{ name: "quinua", allergens: [] }, { name: "leche", allergens: ["lacteos"] }, { name: "manzana", allergens: [] }, { name: "canela", allergens: [] }],
    steps: ["Lava bien la quinua.", "Cocínala en leche 15 min a fuego bajo.", "Sirve con manzana y canela."] },
  { id: "r03", name: "Pan con palta y huevo", desc: "Desayuno rápido con grasas buenas y proteína.", time: "10 min", servings: 1, tag: "desayuno",
    ingredients: [{ name: "pan", allergens: ["gluten"] }, { name: "palta", allergens: [] }, { name: "huevo", allergens: ["huevo"] }, { name: "limón", allergens: [] }],
    steps: ["Tuesta el pan.", "Aplasta la palta con limón y sal.", "Corona con huevo cocido en rodajas."] },
  { id: "r04", name: "Yogur con fruta y granola", desc: "Fresco y rápido, ideal para media mañana.", time: "5 min", servings: 1, tag: "desayuno",
    ingredients: [{ name: "yogur natural", allergens: ["lacteos"] }, { name: "plátano", allergens: [] }, { name: "fresa", allergens: [] }, { name: "granola", allergens: ["gluten", "frutos secos"] }],
    steps: ["Sirve el yogur en un vaso.", "Agrega fruta picada.", "Corona con granola."] },
  { id: "r05", name: "Ensalada de atún con choclo", desc: "Fresca, con proteína y sin cocción larga.", time: "15 min", servings: 2, tag: "almuerzo",
    ingredients: [{ name: "atún", allergens: ["pescado"] }, { name: "choclo desgranado", allergens: [] }, { name: "papa cocida", allergens: [] }, { name: "cebolla", allergens: [] }, { name: "limón", allergens: [] }, { name: "ajonjolí", allergens: ["sesamo"] }],
    steps: ["Mezcla el atún escurrido con el choclo y la papa en cubos.", "Aliña con limón, sal y cebolla picada.", "Espolvorea ajonjolí y sirve."] },
  { id: "r06", name: "Pescado al horno con camote", desc: "Cena ligera al horno, casi sin grasa añadida.", time: "35 min", servings: 4, tag: "almuerzo",
    ingredients: [{ name: "pescado blanco", allergens: ["pescado"] }, { name: "camote", allergens: [] }, { name: "limón", allergens: [] }, { name: "ajo", allergens: [] }, { name: "aceite", allergens: [] }],
    steps: ["Sazona el pescado con ajo, limón y sal.", "Hornea 20 min a 180 °C con el camote en rodajas.", "Sirve caliente."] },
  { id: "r07", name: "Pollo a la plancha con ensalada", desc: "Clásico liviano alto en proteína.", time: "25 min", servings: 2, tag: "almuerzo",
    ingredients: [{ name: "pechuga de pollo", allergens: [] }, { name: "lechuga", allergens: [] }, { name: "tomate", allergens: [] }, { name: "pepino", allergens: [] }, { name: "limón", allergens: [] }, { name: "aceite", allergens: [] }],
    steps: ["Sazona y cocina el pollo a la plancha 6 min por lado.", "Pica la ensalada y aliña con limón.", "Sirve el pollo sobre la ensalada."] },
  { id: "r08", name: "Lomo saltado de pollo", desc: "Versión casera más liviana del favorito peruano.", time: "30 min", servings: 4, tag: "almuerzo",
    ingredients: [{ name: "pollo en tiras", allergens: [] }, { name: "papa", allergens: [] }, { name: "cebolla", allergens: [] }, { name: "tomate", allergens: [] }, { name: "sillao", allergens: ["soya"] }, { name: "arroz cocido", allergens: [] }],
    steps: ["Saltea el pollo a fuego fuerte 5 min.", "Agrega cebolla, tomate y un chorro de sillao.", "Sirve con papas doradas al horno y arroz."] },
  { id: "r09", name: "Arroz con pollo y verduras", desc: "Plato rendidor de olla familiar.", time: "40 min", servings: 4, tag: "almuerzo",
    ingredients: [{ name: "arroz", allergens: [] }, { name: "pollo", allergens: [] }, { name: "zanahoria", allergens: [] }, { name: "arveja", allergens: [] }, { name: "choclo", allergens: [] }, { name: "pimiento", allergens: [] }],
    steps: ["Dora las presas de pollo y reserva.", "Adereza las verduras picadas 5 min.", "Agrega arroz, agua y el pollo; cocina 20 min tapado."] },
  { id: "r10", name: "Quinua chaufa con verduras", desc: "Chaufa sin arroz, con más proteína.", time: "25 min", servings: 3, tag: "almuerzo",
    ingredients: [{ name: "quinua cocida", allergens: [] }, { name: "zanahoria", allergens: [] }, { name: "vainita", allergens: [] }, { name: "huevo", allergens: ["huevo"] }, { name: "sillao", allergens: ["soya"] }, { name: "cebolla china", allergens: [] }],
    steps: ["Saltea las verduras picadas 5 min.", "Agrega la quinua cocida y el sillao.", "Mezcla con tortilla de huevo en tiras y cebolla china."] },
  { id: "r11", name: "Sopa de quinua con verduras", desc: "Sopa abrigadora y muy nutritiva.", time: "30 min", servings: 4, tag: "cena",
    ingredients: [{ name: "quinua", allergens: [] }, { name: "papa", allergens: [] }, { name: "zanahoria", allergens: [] }, { name: "zapallo", allergens: [] }, { name: "apio", allergens: [] }, { name: "cebolla", allergens: [] }],
    steps: ["Hierve la quinua lavada 10 min.", "Agrega las verduras picadas.", "Cocina 15 min más y sazona."] },
  { id: "r12", name: "Caldo de pollo con fideos", desc: "El levanta-ánimos de siempre.", time: "40 min", servings: 4, tag: "cena",
    ingredients: [{ name: "pollo", allergens: [] }, { name: "fideos", allergens: ["gluten"] }, { name: "papa", allergens: [] }, { name: "zanahoria", allergens: [] }, { name: "apio", allergens: [] }],
    steps: ["Hierve el pollo 20 min y espuma el caldo.", "Agrega verduras y fideos.", "Cocina 12 min y sirve caliente."] },
  { id: "r13", name: "Crema de zapallo", desc: "Cremosa sin mucha grasa.", time: "25 min", servings: 3, tag: "cena",
    ingredients: [{ name: "zapallo", allergens: [] }, { name: "papa", allergens: [] }, { name: "cebolla", allergens: [] }, { name: "leche", allergens: ["lacteos"] }],
    steps: ["Sancocha zapallo, papa y cebolla.", "Licúa con un poco de su agua.", "Agrega un chorro de leche, calienta y sirve."] },
  { id: "r14", name: "Tortilla de verduras al horno", desc: "Con queso gratinado y casi sin aceite.", time: "25 min", servings: 2, tag: "cena",
    ingredients: [{ name: "huevo", allergens: ["huevo"] }, { name: "zapallito", allergens: [] }, { name: "zanahoria rallada", allergens: [] }, { name: "cebolla", allergens: [] }, { name: "queso fresco", allergens: ["lacteos"] }],
    steps: ["Mezcla verduras ralladas con huevo batido.", "Vierte en molde y hornea 15 min a 180 °C.", "Agrega queso encima y gratina 5 min."] },
  { id: "r15", name: "Ensalada César de pollo", desc: "Fresca y contundente, con aderezo de yogur.", time: "20 min", servings: 2, tag: "almuerzo",
    ingredients: [{ name: "pollo a la plancha", allergens: [] }, { name: "lechuga", allergens: [] }, { name: "pan tostado", allergens: ["gluten"] }, { name: "queso parmesano", allergens: ["lacteos"] }, { name: "yogur natural", allergens: ["lacteos"] }, { name: "limón", allergens: [] }],
    steps: ["Mezcla yogur, limón y sal como aderezo.", "Arma la lechuga con pollo en tiras.", "Agrega crutones, queso y aderezo."] },
  { id: "r16", name: "Ceviche de pescado", desc: "Fresco y sin cocción, con camote y choclo.", time: "20 min", servings: 4, tag: "almuerzo",
    ingredients: [{ name: "pescado fresco", allergens: ["pescado"] }, { name: "limón", allergens: [] }, { name: "cebolla", allergens: [] }, { name: "ají", allergens: [] }, { name: "choclo", allergens: [] }, { name: "camote cocido", allergens: [] }],
    steps: ["Corta el pescado en cubos y cúbrelo con limón 10 min.", "Agrega cebolla, ají y sal.", "Sirve con choclo y camote."] },
  { id: "r17", name: "Sudado de pescado", desc: "Jugoso y rendidor con arroz blanco.", time: "30 min", servings: 4, tag: "almuerzo",
    ingredients: [{ name: "pescado", allergens: ["pescado"] }, { name: "tomate", allergens: [] }, { name: "cebolla", allergens: [] }, { name: "ají amarillo", allergens: [] }, { name: "choclo", allergens: [] }, { name: "arroz", allergens: [] }],
    steps: ["Adereza tomate, cebolla y ají 8 min.", "Agrega el pescado y un poco de agua.", "Tapa y cocina 12 min. Sirve con arroz."] },
  { id: "r18", name: "Tofu salteado con verduras", desc: "Opción vegetal con buena proteína.", time: "20 min", servings: 2, tag: "cena",
    ingredients: [{ name: "tofu", allergens: ["soya"] }, { name: "brócoli", allergens: [] }, { name: "zanahoria", allergens: [] }, { name: "sillao", allergens: ["soya"] }, { name: "ajo", allergens: [] }],
    steps: ["Dora el tofu en cubos 5 min.", "Agrega brócoli, zanahoria y ajo.", "Sazona con sillao y sirve."] },
  { id: "r19", name: "Ensalada de lentejas", desc: "Fresca, barata y llena de hierro.", time: "30 min", servings: 3, tag: "almuerzo",
    ingredients: [{ name: "lenteja cocida", allergens: [] }, { name: "tomate", allergens: [] }, { name: "cebolla", allergens: [] }, { name: "limón", allergens: [] }, { name: "aceite", allergens: [] }, { name: "perejil", allergens: [] }],
    steps: ["Mezcla las lentejas cocidas y frías con el tomate y la cebolla.", "Aliña con limón, aceite y sal.", "Decora con perejil."] },
  { id: "r20", name: "Guiso de lentejas con arroz", desc: "Contundente y rendidor para la semana.", time: "40 min", servings: 4, tag: "almuerzo",
    ingredients: [{ name: "lenteja", allergens: [] }, { name: "arroz", allergens: [] }, { name: "papa", allergens: [] }, { name: "zanahoria", allergens: [] }, { name: "cebolla", allergens: [] }],
    steps: ["Remoja las lentejas 2 horas (o usa precocidas).", "Guísalas con aderezo de cebolla, papa y zanahoria.", "Sirve sobre arroz."] },
  { id: "r21", name: "Puré de camote con pollo", desc: "Suave y dulce, gusta a grandes y chicos.", time: "30 min", servings: 3, tag: "cena",
    ingredients: [{ name: "camote", allergens: [] }, { name: "leche", allergens: ["lacteos"] }, { name: "mantequilla", allergens: ["lacteos"] }, { name: "pollo a la plancha", allergens: [] }],
    steps: ["Sancocha y prensa el camote.", "Mezcla con leche tibia y mantequilla.", "Acompaña con pollo a la plancha."] },
  { id: "r22", name: "Humita dulce", desc: "Dulce de choclo al vapor, porción justa.", time: "40 min", servings: 6, tag: "snack",
    ingredients: [{ name: "choclo", allergens: [] }, { name: "queso fresco", allergens: ["lacteos"] }, { name: "mantequilla", allergens: ["lacteos"] }, { name: "azúcar", allergens: [] }, { name: "anís", allergens: [] }],
    steps: ["Licúa el choclo con un poco de leche de su cocción.", "Mezcla con queso, mantequilla, azúcar y anís.", "Envuelve en pancas y cocina al vapor 30 min."] },
  { id: "r23", name: "Mazamorra de quinua con fruta", desc: "Postre andino sin lácteos.", time: "25 min", servings: 4, tag: "snack",
    ingredients: [{ name: "quinua", allergens: [] }, { name: "manzana", allergens: [] }, { name: "piña", allergens: [] }, { name: "canela", allergens: [] }, { name: "azúcar", allergens: [] }],
    steps: ["Cocina la quinua 15 min.", "Agrega fruta picada, canela y azúcar.", "Hierve 5 min más y sirve tibia."] },
  { id: "r24", name: "Smoothie de plátano y maní", desc: "Energía rápida para antes de entrenar.", time: "5 min", servings: 2, tag: "snack",
    ingredients: [{ name: "plátano", allergens: [] }, { name: "maní", allergens: ["mani"] }, { name: "leche", allergens: ["lacteos"] }, { name: "avena", allergens: ["gluten"] }],
    steps: ["Licúa todo con hielo.", "Sirve de inmediato."] },
  { id: "r25", name: "Ensalada de frutas con yogur", desc: "Fresca y colorida para la tarde.", time: "10 min", servings: 2, tag: "snack",
    ingredients: [{ name: "yogur natural", allergens: ["lacteos"] }, { name: "plátano", allergens: [] }, { name: "manzana", allergens: [] }, { name: "papaya", allergens: [] }, { name: "miel", allergens: [] }],
    steps: ["Pica las frutas en cubos.", "Mezcla con el yogur.", "Endulza con un hilo de miel."] },
  { id: "r26", name: "Wraps de pollo en lechuga", desc: "Tacos frescos sin tortilla.", time: "20 min", servings: 2, tag: "cena",
    ingredients: [{ name: "pollo deshilachado", allergens: [] }, { name: "lechuga grande", allergens: [] }, { name: "zanahoria rallada", allergens: [] }, { name: "palta", allergens: [] }, { name: "limón", allergens: [] }],
    steps: ["Mezcla el pollo con zanahoria, palta y limón.", "Rellena las hojas de lechuga.", "Enrolla y sirve."] },
  { id: "r27", name: "Parihuela ligera", desc: "Sopa marina con menos grasa, bien sustanciosa.", time: "45 min", servings: 4, tag: "almuerzo",
    ingredients: [{ name: "mariscos mixtos", allergens: ["mariscos"] }, { name: "pescado", allergens: ["pescado"] }, { name: "papa", allergens: [] }, { name: "choclo", allergens: [] }, { name: "ají amarillo", allergens: [] }, { name: "cebolla", allergens: [] }],
    steps: ["Adereza ají y cebolla 8 min.", "Agrega agua, papa y choclo; hierve 15 min.", "Suma pescado y mariscos 8 min más."] },
];

// Grupos de derivados: lo que el cliente escribe → etiqueta(s) a excluir.
// Ej. "lactosa", "leche" o "lácteos" excluyen queso, yogur, mantequilla, crema, etc.
const TOBI_ALLERGEN_GROUPS = [
  { label: "lacteos", triggers: ["lacteo", "lacteos", "lactosa", "leche", "queso", "yogur", "yogurt", "mantequilla", "crema", "manjar", "cuajada"] },
  { label: "gluten", triggers: ["gluten", "trigo", "harina", "pan", "fideo", "fideos", "pasta", "avena", "cebada", "centeno"] },
  { label: "huevo", triggers: ["huevo", "huevos"] },
  { label: "mani", triggers: ["mani", "maníes", "cacahuate", "cacahuete"] },
  { label: "frutos secos", triggers: ["frutos secos", "fruto seco", "nuez", "nueces", "almendra", "pecana", "castaña", "avellana", "pistacho"] },
  { label: "pescado", triggers: ["pescado", "atun", "bonito", "jurel", "trucha", "caballa"] },
  { label: "mariscos", triggers: ["marisco", "mariscos", "camaron", "camarones", "langostino", "calamar", "concha", "conchas", "mejillon", "cangrejo"] },
  { label: "soya", triggers: ["soya", "soja", "sillao", "tofu"] },
  { label: "sesamo", triggers: ["sesamo", "sésamo", "ajonjoli", "ajonjolí"] },
];

function tobiRecipeNorm(s) {
  try { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }
  catch { return String(s || "").toLowerCase().trim(); }
}

// Relaciona lo que el cliente escribió con etiquetas (ignora mayúsculas y tildes).
// Devuelve { labels: [...], recognized: bool }.
function tobiRecipeAllergyLabels(allergyName) {
  const n = tobiRecipeNorm(allergyName);
  const labels = [];
  try {
    TOBI_ALLERGEN_GROUPS.forEach((g) => {
      if (g.triggers.some((tr) => n.indexOf(tr) !== -1 || tr.indexOf(n) !== -1)) {
        if (labels.indexOf(g.label) === -1) labels.push(g.label);
      }
    });
  } catch { /* noop */ }
  return { labels, recognized: labels.length > 0 };
}

function tobiRecipeTextMatch(needle, hay) {
  try {
    const n = tobiRecipeNorm(needle);
    const h = tobiRecipeNorm(hay);
    if (!n || n.length < 3) return false;
    if (h.indexOf(n) !== -1) return true;
    return n.split(/\s+/).some((w) => w.length >= 4 && h.indexOf(w) !== -1);
  } catch {
    return false;
  }
}

// FILTRO DE SEGURIDAD: devuelve { safe, excludedCount, excludedAllergies, unverified }.
// - safe: recetas permitidas ordenadas por productos frecuentes que usan.
// - Cada item: { recipe, matched: [ingredientes que ya tiene], missing: [...] }.
// - Alergia no reconocida = alerta: excluye por texto y se avisa al cliente.
function tobiRecipesFor(allergies, frequents) {
  const out = { safe: [], excludedCount: 0, excludedAllergies: [], unverified: [] };
  try {
    const allergyNames = (allergies || []).map((a) => (a && a.name ? String(a.name) : "")).filter(Boolean);
    const freqNames = (frequents || []).map((p) => (p && p.name ? String(p.name) : "")).filter(Boolean);
    const mapped = allergyNames.map((n) => ({ raw: n, info: tobiRecipeAllergyLabels(n) }));
    out.excludedAllergies = allergyNames.slice();
    out.unverified = mapped.filter((m) => !m.info.recognized).map((m) => m.raw);

    TOBI_RECIPES.forEach((r) => {
      let blocked = false;
      // 1) Exclusión estricta por etiquetas.
      for (const ing of r.ingredients) {
        for (const m of mapped) {
          if ((ing.allergens || []).some((t) => m.info.labels.indexOf(t) !== -1)) { blocked = true; break; }
        }
        if (blocked) break;
      }
      // 2) Alerta: alergia no reconocida → excluye por coincidencia de texto.
      if (!blocked) {
        for (const m of mapped) {
          if (m.info.recognized) continue;
          const hitIng = r.ingredients.some((ing) => tobiRecipeTextMatch(m.raw, ing.name));
          if (hitIng || tobiRecipeTextMatch(m.raw, r.name)) { blocked = true; break; }
        }
      }
      if (blocked) { out.excludedCount += 1; return; }
      // 3) Cruce con frecuentes: cuáles tiene y cuáles le faltan.
      const matched = [], missing = [];
      r.ingredients.forEach((ing) => {
        const has = freqNames.some((f) => tobiRecipeTextMatch(f, ing.name) || tobiRecipeTextMatch(ing.name, f));
        (has ? matched : missing).push(ing.name);
      });
      out.safe.push({ recipe: r, matched, missing, score: matched.length });
    });
    // Orden: más productos frecuentes primero; empate → orden alfabético.
    out.safe.sort((a, b) => (b.score - a.score) || a.recipe.name.localeCompare(b.recipe.name, "es"));
    return out;
  } catch {
    return out;
  }
}
