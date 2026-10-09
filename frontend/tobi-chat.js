/* TOBI CHAT (paso 2, solo aditivo): apartado propio de conversación con Tobi.
 * Sin backend ni IA: respuestas simuladas por reglas. Sin librerías.
 * No toca app.js: se engancha a sus vistas/globales solo si existen. */

"use strict";

// ---------- LÓGICA DE RESPUESTA (una sola función) ----------
/* NOTA DE CONEXIÓN FUTURA (backend con IA):
 * Cuando exista backend, reemplazar el cuerpo de getTobiReply por una llamada
 * a TU endpoint propio, por ejemplo:
 *   const r = await fetch("/api/tobi", { method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ message: text }) });
 *   const data = await r.json();
 *   return data.reply;
 * NUNCA pongas API keys en este archivo: las claves viven en el servidor.
 * El resto del chat (burbujas, typing, scroll) sigue igual sin cambios.
 */
function getTobiReply(text) {
  const t = String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const has = (...words) => words.some((w) => t.includes(w));

  if (!t.trim()) return "Escríbeme tu duda y te ayudo con gusto. 💚";
  if (has("hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey"))
    return "¡Hola! Soy Tobi. 🤖 Pregúntame cómo escanear, usar el carrito, pagar o salir de tienda. ¿En qué te ayudo?";
  if (has("gracias")) return "¡De nada! 💚 Estoy aquí para lo que necesites en tu compra.";
  if (has("chau", "adios", "nos vemos", "hasta luego")) return "¡Nos vemos! Que tengas una buena compra sin colas. 🛒💨";
  if (has("ayuda", "ayudar", "como usar", "como funciona", "tutorial", "empezar"))
    return "Con gusto: 1) 📷 Escanea tus productos, 2) 🛒 revisa tu carrito (máx. 40), 3) 💳 paga desde tu celular, 4) muestra el QR en caja y el pase en seguridad. ¿Qué paso quieres en detalle?";
  if (has("escanear", "escaneo", "camara", "codigo", "barras", "qr del producto"))
    return "Ve a 📷 Escanear, pulsa Activar cámara y encuadra el código de barras en el marco verde. Si la cámara falla, escribe el código a mano: tengo códigos de prueba en la misma pantalla.";
  if (has("carrito", "agregar", "anadir", "quitar", "vaciar", "cantidad"))
    return "Tu carrito acepta hasta 40 productos por compra rápida. Suma o resta con + y −, y cuando termines pulsa Finalizar compra. Si pasas de 40, te derivo a caja tradicional.";
  if (has("pagar", "pago", "yape", "plin", "tarjeta", "pago con"))
    return "Puedes pagar con Yape, Plin o Tarjeta desde tu celular. Tras pagar se genera tu QR de caja (vigente 5 min, un solo uso). ¿Te explico el paso de caja?";
  if (has("caja", "qr", "codigo de caja", "validar"))
    return "En caja muestra tu QR (caduca en 5 min y es de un solo uso, no lo compartas). El personal lo valida y se genera tu pase de salida. Si expiró, genera uno nuevo: el anterior queda anulado.";
  if (has("salida", "seguridad", "pase", "puerta"))
    return "Muestra tu pase de salida solo al personal de seguridad (caduca en 3 min, un solo uso). Al validarlo verás tu boleta y ¡felicidades por tu compra! 🎉";
  if (has("boleta", "ticket", "comprobante", "historial", "factura"))
    return "Tu boleta queda en 🛒 Carrito → Historial de compras, y puedes imprimirla en PDF. En esta demo es una boleta de prueba.";
  if (has("oferta", "descuento", "promocion", "barato"))
    return "En la Tienda pulsa Ver ofertas o el filtro Ofertas para ver los descuentos con etiqueta amarilla. Los precios ya incluyen IGV.";
  if (has("edad", "dni", "18", "licor", "cerveza", "alcohol"))
    return "Los licores son solo para mayores de 18: se validan con tu fecha de nacimiento al registrarte. 🔞";
  if (has("demo", "cuenta", "registro", "sesion", "google"))
    return "Puedes Probar demo sin registrarte, o crear tu cuenta con nombre, correo, DNI y nacimiento. El acceso con Google estará disponible próximamente.";
  if (has("quien eres", "tobi", "robot"))
    return "Soy Tobi 🤖, el robot guía de Tottus Scan & Go. Te acompaño a comprar sin colas: escaneo, carrito, pago y salida.";
  return "Mmm, no te entendí del todo. 🤔 Pregúntame por: escanear, carrito, pagar, caja, salida, ofertas o tu cuenta, y te oriento paso a paso.";
}

/* Personalización con el nombre (paso 3B, solo aditivo): envuelve a getTobiReply
 * SIN modificarla. Usa el nombre de forma ocasional: en la primera respuesta de
 * la conversación, en agradecimientos y despedidas; y cierra con una pregunta
 * breve solo si la respuesta no terminaba ya en pregunta. Tono cálido y cortés. */
function getTobiReplyNamed(text, ctx) {
  let out = getTobiReply(text);
  try {
    const who = (ctx && ctx.name) || "";
    const first = !!(ctx && ctx.first);
    if (who && out.indexOf("¡De nada!") === 0) out = out.replace("¡De nada!", "¡De nada, " + who + "!");
    if (who && out.indexOf("¡Nos vemos!") === 0) out = out.replace("¡Nos vemos!", "¡Nos vemos, " + who + "!");
    if (first && who && out.indexOf("¡Hola! Soy Tobi") === 0) out = out.replace("¡Hola! Soy Tobi", "¡Hola, " + who + "! Soy Tobi");
    if (first && !/[?¿]\s*$/.test(out)) out = out + " ¿Te ayudo con algo más" + (who ? ", " + who : "") + "?";
  } catch { /* ante cualquier fallo, vale la respuesta base */ }
  return out;
}

// ---------- CONTROLADOR DEL CHAT (solo aditivo) ----------
(function () {
  const $id = (id) => document.getElementById(id);
  const calmMotion = () =>
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  let prevView = "home";
  let greeted = false;

  function currentView() {
    const vis = document.querySelector("main .view:not([hidden])");
    return vis ? vis.id.replace("view-", "") : "home";
  }

  function openTobiChat() {
    try {
      prevView = currentView();
      // Oculta todas las vistas y muestra solo el chat (sin tocar showView de app.js).
      document.querySelectorAll("main .view").forEach((s) => { s.hidden = true; });
      const v = $id("view-tobi");
      if (v) v.hidden = false;
      // Si venía del escáner, apaga la cámara con la función existente (si existe).
      if (prevView === "scanner" && typeof stopCamera === "function") {
        try { stopCamera(); } catch { /* noop */ }
      }
      document.querySelectorAll(".bottom-nav button").forEach((b) => b.classList.remove("active"));
      // Cierra el panel flotante con su función existente (si existe).
      if (typeof botClose === "function") {
        try { botClose(); } catch { /* noop */ }
      } else {
        const w = $id("botWidget"), bb = $id("botBubble");
        if (w) w.classList.remove("active");
        if (bb) { bb.classList.remove("active"); bb.hidden = true; }
      }
      window.scrollTo({ top: 0, behavior: calmMotion() ? "auto" : "smooth" });
      resumeTobiConversation();
      const input = $id("tobiChatInput");
      if (input) input.focus({ preventScroll: true });
    } catch (e) {
      addMsg("tobi", "Uy, no pude abrir el chat. 😅 Inténtalo de nuevo presionando Chatear con Tobi.");
    }
  }

  function backFromTobiChat() {
    try {
      const v = $id("view-tobi");
      if (v) v.hidden = true;
      // Vuelve con la navegación existente (si existe) para no duplicar lógica.
      if (typeof showView === "function") {
        try { showView(prevView === "tobi" ? "home" : prevView); return; }
        catch { /* cae al plan B */ }
      }
      const back = $id("view-" + (prevView === "tobi" ? "home" : prevView)) || $id("view-home");
      if (back) back.hidden = false;
      window.scrollTo({ top: 0 });
    } catch (e) { /* noop */ }
  }

  function addMsg(who, text, ts) {
    const log = $id("tobiChatLog");
    if (!log) return;
    const div = document.createElement("div");
    div.className = "chat-msg " + (who === "user" ? "user" : "tobi");
    div.textContent = text; // texto seguro: sin HTML inyectado
    const time = document.createElement("small");
    time.textContent = new Date(ts || Date.now()).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    div.appendChild(time);
    log.appendChild(div);
    scrollLog();
  }

  function scrollLog() {
    const log = $id("tobiChatLog");
    if (!log) return;
    try {
      log.scrollTo({ top: log.scrollHeight, behavior: calmMotion() ? "auto" : "smooth" });
    } catch {
      log.scrollTop = log.scrollHeight;
    }
  }

  function setTyping(on) {
    const ty = $id("tobiTyping");
    if (!ty) return;
    ty.hidden = !on;
    if (on) scrollLog();
  }

  // ---------- ALERGIAS (paso 4B/4C, solo aditivo) ----------
  // Tobi SOLO registra lo que el cliente declara. Sin preguntas ni consejos médicos.
  function tobiHasProfile() { return typeof tobiProfileGetAllergies === "function"; }
  // Estado del flujo en memoria (se pierde al recargar; lo guardado no).
  const tobiAllergyFlowState = { step: "idle", pending: [] };
  function tobiAllergyReset() { tobiAllergyFlowState.step = "idle"; tobiAllergyFlowState.pending = []; }
  function tobiNorm(s) {
    try { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    catch { return String(s || "").toLowerCase(); }
  }
  // Botones de respuesta rápida: se pintan con textContent (sin HTML inyectado).
  function tobiChips(labels) {
    try {
      const log = $id("tobiChatLog");
      if (!log || !labels || !labels.length) return;
      const wrap = document.createElement("div");
      wrap.className = "tobi-chips";
      labels.forEach((label) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tobi-chip";
        b.textContent = label;
        b.addEventListener("click", () => {
          try { wrap.querySelectorAll("button").forEach((x) => { x.disabled = true; }); } catch { /* noop */ }
          sendMsg(label);
        });
        wrap.appendChild(b);
      });
      log.appendChild(wrap);
      scrollLog();
    } catch { /* chips opcionales */ }
  }
  // Mensaje de Tobi del flujo de alergias: lo pinta y lo guarda en la conversación.
  function tobiSay(text, chips) {
    try {
      addMsg("tobi", text);
      try { tobiStore(tobiActiveId(), "tobi", text); } catch { /* noop */ }
      if (chips && chips.length) {
        setTimeout(() => tobiChips(chips), calmMotion() ? 150 : 400);
      }
    } catch { /* noop */ }
  }
  // Pregunta inicial (primera vez) o recordatorio discreto (máx. 1 por visita).
  function tobiAllergyAskOnOpen() {
    try {
      if (!tobiHasProfile() || tobiProfileWasAsked()) return;
      const later = tobiProfileLaterThisVisit();
      const reminded = tobiProfileRemindedThisVisit();
      let text;
      if (!later) {
        text = "Para cuidarte mejor, ¿tienes alguna alergia o intolerancia alimentaria que deba conocer?";
      } else if (!reminded) {
        text = "Cuando quieras, puedes contarme si tienes alguna alergia alimentaria.";
      } else {
        return;
      }
      const chips = ["Sí, tengo alergias", "No tengo alergias", "Prefiero responder después"];
      setTyping(true);
      setTimeout(() => {
        try {
          setTyping(false);
          tobiSay(text, chips);
          if (later) tobiProfileMarkReminded();
        } catch { /* noop */ }
      }, calmMotion() ? 400 : 1400);
    } catch { /* noop */ }
  }
  // Procesa el mensaje dentro/fuera del flujo de alergias. Devuelve la respuesta
  // o null para seguir con la respuesta normal. Lógica simulada (sin reescribirla).
  function tobiAllergyFlow(rawMsg, ctx) {
    try {
      if (!tobiHasProfile()) return null;
      const name = (ctx && ctx.name) || "";
      const hello = name ? ", " + name : "";
      const t = tobiNorm(rawMsg);
      const st = tobiAllergyFlowState;
      const ASK_CHIPS = ["Sí, tengo alergias", "No tengo alergias", "Prefiero responder después"];

      const isNone = /no tengo (ninguna )?alergia|sin alergias|ninguna alergia/.test(t);
      const isLater = /prefiero responder despues|responder despues|despues|luego|mas tarde/.test(t);
      const decl = t.match(/(?:tengo alergias? a|tengo alergia a|soy alergico[a]? a|soy intolerante a|intolerancia a|alergia a(?:l)?|mis alergias son)\s+(.+)/);
      const isYes = /s[ií],?\s*tengo alergias|^s[ií]\b.*alergia|tengo alergias$/.test(t);
      const isConfirmYes = /^(s[ií](,?\s*guardar)?|guardar|guardalas|guardarlas|dale|ok|de acuerdo|confirmo|sí, guardar)\.?$/.test(t.trim());
      const isConfirmNo = /^(no|cancelar|mejor no|olvidalo|no quiero|no, gracias)\.?$/.test(t.trim());

      // --- Paso confirmación: ¿Las guardo? ---
      if (st.step === "confirm") {
        if (isNone) {
          tobiProfileSetNone();
          tobiAllergyReset();
          return "Anotado" + hello + ": no tienes alergias. ¡Gracias por avisarme! 💚";
        }
        if (isConfirmYes) {
          const saved = [], dups = [];
          st.pending.forEach((n) => {
            const r = tobiProfileAdd(n);
            if (r.ok) saved.push(r.name);
            else if (r.reason === "dup") dups.push(n);
          });
          tobiProfileMarkAsked();
          tobiAllergyReset();
          renderTobiAllergies();
          if (!saved.length && dups.length) return "Esas ya las tenía registradas" + hello + ": " + dups.join(", ") + ". 💚";
          let out = "Listo" + hello + ": guardé " + saved.join(", ") + ". Gracias por contármelo, así te cuido mejor. 💚";
          if (dups.length) out += " (" + dups.join(", ") + " ya estaba).";
          return out;
        }
        if (isConfirmNo || isLater) {
          if (isLater) tobiProfileMarkLater();
          tobiAllergyReset();
          return "Sin problema" + hello + ". Cuando quieras me cuentas. 👍";
        }
        return "Respóndeme «Sí, guardar» para guardarlas o «Cancelar» para dejarlo así.";
      }

      // --- Paso lista: el cliente dicta sus alergias ---
      if (st.step === "awaiting-list") {
        if (isNone) {
          tobiProfileSetNone();
          tobiAllergyReset();
          return "Anotado" + hello + ": no tienes alergias. ¡Gracias por avisarme! 💚";
        }
        if (isLater || isConfirmNo) {
          if (isLater) tobiProfileMarkLater();
          tobiAllergyReset();
          return "Sin problema" + hello + ". Cuando quieras me cuentas. 👍";
        }
        const names = tobiProfileSplitList(rawMsg);
        if (!names.length) return "No te entendí bien. Escríbelas en un mensaje, por ejemplo: «maní, lácteos y mariscos».";
        st.pending = names;
        st.step = "confirm";
        setTimeout(() => tobiChips(["Sí, guardar", "Cancelar"]), calmMotion() ? 150 : 400);
        return "Para confirmar, estas son: " + names.join(", ") + ". ¿Las guardo?";
      }

      // --- Fuera del flujo ---
      if (isNone) {
        tobiProfileSetNone();
        tobiAllergyReset();
        renderTobiAllergies();
        return "Anotado" + hello + ": no tienes alergias. ¡Gracias por avisarme! 💚";
      }
      if (isLater) {
        tobiProfileMarkLater();
        tobiAllergyReset();
        return "Sin problema" + hello + ". Cuando quieras me cuentas. 👍";
      }
      if (decl && decl[1]) {
        const names = tobiProfileSplitList(decl[1]);
        if (!names.length) {
          st.step = "awaiting-list"; st.pending = [];
          return "Cuéntame cuáles son, en un solo mensaje si quieres (por ejemplo: «maní, lácteos y mariscos»).";
        }
        st.pending = names;
        st.step = "confirm";
        setTimeout(() => tobiChips(["Sí, guardar", "Cancelar"]), calmMotion() ? 150 : 400);
        return "Para confirmar, estas son: " + names.join(", ") + ". ¿Las guardo?";
      }
      if (isYes) {
        st.step = "awaiting-list"; st.pending = [];
        return "Cuéntame cuáles son, en un solo mensaje si quieres (por ejemplo: «maní, lácteos y mariscos»).";
      }
      if (/(mis alergias|ver alergias|que alergias|alergias registradas|mostrar alergias)/.test(t)) {
        const list = tobiProfileGetAllergies();
        if (tobiProfileHasNone()) return "Tienes registrado que no tienes alergias" + hello + ". Si eso cambia, avísame y lo actualizo. 💚";
        if (!list.length) return "Aún no registraste alergias" + hello + ". Escríbelas cuando quieras y las guardo. 🙂";
        return "Tus alergias registradas son: " + list.map((a) => a.name).join(", ") + ".";
      }
      const addM = t.match(/(agrega[r]?|añad[eir]+|anade|suma[r]?|incluye?)\s+(?:una\s+)?alergia\s*(?:a\s*)?(.+)?/);
      if (addM) {
        const names = addM[2] ? tobiProfileSplitList(addM[2]) : [];
        if (!names.length) {
          st.step = "awaiting-list"; st.pending = [];
          return "Dime cuál agrego y la guardo. 🙂";
        }
        const saved = [];
        names.forEach((n) => { const r = tobiProfileAdd(n); if (r.ok) saved.push(r.name); });
        tobiProfileMarkAsked();
        renderTobiAllergies();
        return saved.length
          ? "Agregué " + saved.join(", ") + " a tu lista" + hello + ". 💚"
          : "Esas ya estaban en tu lista" + hello + ". 💚";
      }
      const delM = t.match(/(quita[r]?|elimina[r]?|borra[r]?|saca[r]?)\s+(?:la\s+)?alergia\s*(?:a\s*)?(.+)?/);
      if (delM && delM[2]) {
        const list = tobiProfileGetAllergies();
        const targets = tobiProfileSplitList(delM[2]);
        const gone = [];
        targets.forEach((n) => {
          const hit = list.find((a) => a.name === n || a.name.indexOf(n) !== -1 || n.indexOf(a.name) !== -1);
          if (hit && tobiProfileDelete(hit.id)) gone.push(hit.name);
        });
        renderTobiAllergies();
        if (gone.length) return "Quité " + gone.join(", ") + " de tu lista" + hello + ". 👍";
        const cur = tobiProfileGetAllergies().map((a) => a.name).join(", ");
        return "No encontré eso en tu lista" + hello + "." + (cur ? " Registradas: " + cur + "." : " Aún no tienes alergias registradas.");
      }
      return null; // sigue con la respuesta normal
    } catch {
      return null;
    }
  }

  // ---------- PRODUCTOS FRECUENTES (paso 5B/5C, solo aditivo) ----------
  // Mismo patrón que alergias. Tobi SOLO registra lo declarado. Sin tocar el carrito.
  function tobiHasFrequent() { return typeof tobiFrequentGet === "function"; }
  // Estado del flujo en memoria (se pierde al recargar; lo guardado no).
  const tobiFrequentFlowState = { step: "idle", pending: [] };
  function tobiFrequentReset() { tobiFrequentFlowState.step = "idle"; tobiFrequentFlowState.pending = []; }
  function tobiFrequentStep() { return tobiFrequentFlowState.step; }
  function tobiFrequentCatalogNote(names) {
    try {
      const hits = (names || []).filter((n) => tobiFrequentInCatalog(n));
      if (!hits.length) return "";
      return " (" + hits.join(", ") + " lo tenemos en el catálogo 😉)";
    } catch {
      return "";
    }
  }
  // Pregunta inicial: solo si lo de alergias ya se resolvió o se pospuso.
  // No interrumpe: si el flujo de alergias sigue activo en memoria, espera.
  function tobiFrequentAskOnOpen() {
    try {
      if (!tobiHasFrequent() || tobiFrequentWasAsked()) return;
      if (typeof tobiProfileWasAsked !== "function") return;
      if (!tobiProfileWasAsked() && !tobiProfileLaterThisVisit()) return;
      if (tobiAllergyFlowState.step !== "idle" || tobiFrequentStep() !== "idle") return;
      const later = tobiFrequentLaterThisVisit();
      const reminded = tobiFrequentRemindedThisVisit();
      let text;
      if (!later) {
        text = "¿Y qué productos sueles comprar con frecuencia? Así te ayudo mejor.";
      } else if (!reminded) {
        text = "Cuando quieras, cuéntame qué productos compras con frecuencia.";
      } else {
        return;
      }
      const chips = ["Sí, te cuento", "Prefiero responder después"];
      setTyping(true);
      setTimeout(() => {
        try {
          setTyping(false);
          tobiSay(text, chips);
          if (later) tobiFrequentMarkReminded();
        } catch { /* noop */ }
      }, calmMotion() ? 600 : 2400);
    } catch { /* noop */ }
  }
  // Procesa el mensaje dentro/fuera del flujo de frecuentes. Devuelve la respuesta
  // o null para seguir con la respuesta normal. Lógica simulada.
  function tobiFrequentFlow(rawMsg, ctx) {
    try {
      if (!tobiHasFrequent()) return null;
      const name = (ctx && ctx.name) || "";
      const hello = name ? ", " + name : "";
      const t = tobiNorm(rawMsg);
      const st = tobiFrequentFlowState;

      const isLater = /prefiero responder despues|responder despues|despues|luego|mas tarde/.test(t);
      const isDecline = /no compro (nada|mucho|seguido|frecuente)|no suelo comprar|no compro seguido/.test(t);
      const decl = t.match(/(?:suelo comprar|compro con frecuencia|compro seguido|acostumbro comprar|mis productos son|productos que suelo comprar|compro)\s+(.+)/);
      const isYes = /s[ií],?\s*te cuento|s[ií] te cuento|suelo comprar$|compro (seguido|con frecuencia)$/.test(t);
      const isConfirmYes = /^(s[ií](,?\s*guardar)?|guardar|guardalos|guardarlos|dale|ok|de acuerdo|confirmo|sí, guardar)\.?$/.test(t.trim());
      const isConfirmNo = /^(no|cancelar|mejor no|olvidalo|no quiero|no, gracias)\.?$/.test(t.trim());

      // --- Paso confirmación: ¿Los guardo? ---
      if (st.step === "confirm") {
        if (isConfirmYes) {
          const saved = [], dups = [];
          st.pending.forEach((n) => {
            const r = tobiFrequentAdd(n);
            if (r.ok) saved.push(r.name);
            else if (r.reason === "dup") dups.push(n);
          });
          tobiFrequentMarkAsked();
          tobiFrequentReset();
          renderTobiFrequents();
          if (!saved.length && dups.length) return "Esos ya los tenía registrados" + hello + ": " + dups.join(", ") + ". 💚";
          let out = "Listo" + hello + ": guardé " + saved.join(", ") + tobiFrequentCatalogNote(saved) + ". ¡Gracias! 💚";
          if (dups.length) out += " (" + dups.join(", ") + " ya estaba).";
          return out;
        }
        if (isConfirmNo || isLater) {
          if (isLater) tobiFrequentMarkLater();
          tobiFrequentReset();
          return "Sin problema" + hello + ". Cuando quieras me cuentas. 👍";
        }
        return "Respóndeme «Sí, guardar» para guardarlos o «Cancelar» para dejarlo así.";
      }

      // --- Paso lista: el cliente dicta sus productos ---
      if (st.step === "awaiting-list") {
        if (isLater || isConfirmNo || isDecline) {
          if (isLater) tobiFrequentMarkLater();
          if (isDecline) tobiFrequentMarkAsked();
          tobiFrequentReset();
          return "Sin problema" + hello + ". Cuando quieras me cuentas. 👍";
        }
        const names = tobiProfileSplitList(rawMsg);
        if (!names.length) return "No te entendí bien. Escríbelos en un mensaje, por ejemplo: «leche, pan y arroz».";
        st.pending = names;
        st.step = "confirm";
        setTimeout(() => tobiChips(["Sí, guardar", "Cancelar"]), calmMotion() ? 150 : 400);
        return "Para confirmar, estos son: " + names.join(", ") + tobiFrequentCatalogNote(names) + ". ¿Los guardo?";
      }

      // --- Fuera del flujo ---
      if (isLater || isDecline) {
        if (isLater) tobiFrequentMarkLater();
        else tobiFrequentMarkAsked();
        tobiFrequentReset();
        return "Sin problema" + hello + ". Cuando quieras me cuentas. 👍";
      }
      if (decl && decl[1]) {
        let names = tobiProfileSplitList(decl[1]);
        // Evita guardar muletillas ("con frecuencia") como si fueran productos.
        names = names.filter((n) => !/^(con frecuencia|seguido|frecuente|frecuentemente|mucho|seguido)$/.test(n));
        if (!names.length) {
          st.step = "awaiting-list"; st.pending = [];
          return "Cuéntame cuáles son, en un solo mensaje si quieres (por ejemplo: «leche, pan y arroz»).";
        }
        st.pending = names;
        st.step = "confirm";
        setTimeout(() => tobiChips(["Sí, guardar", "Cancelar"]), calmMotion() ? 150 : 400);
        return "Para confirmar, estos son: " + names.join(", ") + tobiFrequentCatalogNote(names) + ". ¿Los guardo?";
      }
      if (isYes) {
        st.step = "awaiting-list"; st.pending = [];
        return "Cuéntame cuáles son, en un solo mensaje si quieres (por ejemplo: «leche, pan y arroz»).";
      }
      if (/(mis productos|productos frecuentes|productos que compro|que productos compro|ver productos|mostrar productos)/.test(t)) {
        const list = tobiFrequentGet();
        if (!list.length) return "Aún no registraste productos" + hello + ". Escríbelos cuando quieras y los guardo. 🙂";
        return "Tus productos frecuentes son: " + list.map((p) => p.name).join(", ") + ".";
      }
      const addM = t.match(/(agrega[r]?|añad[eir]+|anade|suma[r]?|incluye?)\s+(?:el\s+)?producto\s*(.+)?/) ||
        t.match(/^(.+?)\s+a mis (productos|frecuentes)$/);
      if (addM) {
        const names = addM[2] || addM[1] ? tobiProfileSplitList(addM[2] || addM[1]) : [];
        if (!names.length) {
          st.step = "awaiting-list"; st.pending = [];
          return "Dime cuál agrego y lo guardo. 🙂";
        }
        const saved = [];
        names.forEach((n) => { const r = tobiFrequentAdd(n); if (r.ok) saved.push(r.name); });
        tobiFrequentMarkAsked();
        renderTobiFrequents();
        return saved.length
          ? "Agregué " + saved.join(", ") + tobiFrequentCatalogNote(saved) + " a tus frecuentes" + hello + ". 💚"
          : "Esos ya estaban en tu lista" + hello + ". 💚";
      }
      const delM = t.match(/(quita[r]?|elimina[r]?|borra[r]?|saca[r]?)\s+(?:el\s+)?producto\s*(.+)?/) ||
        t.match(/^(.+?)\s+de mis (productos|frecuentes)$/);
      if (delM && (delM[2] || delM[1])) {
        const list = tobiFrequentGet();
        const targets = tobiProfileSplitList(delM[2] || delM[1]);
        const gone = [];
        targets.forEach((n) => {
          const hit = list.find((p) => p.name === n || p.name.indexOf(n) !== -1 || n.indexOf(p.name) !== -1);
          if (hit && tobiFrequentDelete(hit.id)) gone.push(hit.name);
        });
        renderTobiFrequents();
        if (gone.length) return "Quité " + gone.join(", ") + " de tus frecuentes" + hello + ". 👍";
        const cur = tobiFrequentGet().map((p) => p.name).join(", ");
        return "No encontré eso en tu lista" + hello + "." + (cur ? " Registrados: " + cur + "." : " Aún no tienes productos registrados.");
      }
      return null; // sigue con la respuesta normal
    } catch {
      return null;
    }
  }

  // ---------- RECETAS SALUDABLES (paso 6B/6C, solo aditivo) ----------
  // Intent + pantalla feed. La seguridad vive en tobi-recipes.js; aquí solo se
  // pide, se muestra y se navega. Sin tocar el carrito. Sin red. Sin consola.
  let tobiLastRecipeRes = null;
  function tobiHasRecipes() { return typeof tobiRecipesFor === "function"; }
  function tobiRecipeIntent(rawMsg, ctx) {
    try {
      if (!tobiHasRecipes()) return null;
      const t = tobiNorm(rawMsg);
      if (!/(receta|recetas|cocinar|cocino|cocina|preparar|comida|comidas|menu|que cocino|dame recetas|ver recetas)/.test(t)) return null;
      const name = (ctx && ctx.name) || "";
      const hello = name ? ", " + name : "";
      const allergyDone = (typeof tobiProfileWasAsked === "function") ? tobiProfileWasAsked() : true;
      const allergies = (typeof tobiProfileGetAllergies === "function") ? tobiProfileGetAllergies() : [];
      const freqs = (typeof tobiFrequentGet === "function") ? tobiFrequentGet() : [];
      // Guardarraíl 1: sin alergias respondidas, se preguntan antes de recomendar.
      if (!allergyDone) {
        setTimeout(() => { try { tobiAllergyAskOnOpen(); } catch { /* noop */ } }, calmMotion() ? 200 : 600);
        return "Para recomendarte sin riesgos, primero cuéntame si tienes alguna alergia alimentaria" + hello + ". Respóndeme aquí abajo. 🙂";
      }
      // Petición directa: abre el listado (filtrado por tus alergias).
      if (/ver recetas|recetas generales/.test(t)) {
        const res = tobiRecipesFor(allergies, freqs);
        openTobiRecipePanel(res);
        if (!res.safe.length) return "No encontré recetas seguras con tus datos" + hello + ".";
        return "Aquí las tienes" + hello + ": " + res.safe.length + " recetas seguras en el panel. 🍲";
      }
      // Guardarraíl 2: sin frecuentes, se preguntan primero o se ofrece lo general.
      if (!freqs.length) {
        setTimeout(() => { try { tobiFrequentAskOnOpen(); } catch { /* noop */ } }, calmMotion() ? 200 : 600);
        setTimeout(() => tobiChips(["Sí, te cuento", "Ver recetas generales"]), calmMotion() ? 300 : 900);
        return "Puedo mostrarte recetas generales ya filtradas por tus alergias, o preguntarte primero qué sueles comprar para afinar. ¿Qué prefieres" + hello + "?";
      }
      const res = tobiRecipesFor(allergies, freqs);
      openTobiRecipePanel(res);
      if (!res.safe.length) return "No encontré recetas seguras con tus datos" + hello + ". Si me cuentas más productos que sueles comprar, amplío la búsqueda. 💚";
      let out = "Encontré " + res.safe.length + " recetas seguras para ti" + hello + ", ordenadas por lo que ya tienes. Míralas en el panel. 🍲";
      if (res.unverified.length) out += " Ojo: no pude verificar del todo «" + res.unverified.join(", ") + "», así que excluí esas recetas por precaución.";
      setTimeout(() => tobiChips(["Ver recetas"]), calmMotion() ? 300 : 900);
      return out;
    } catch {
      return null;
    }
  }
  function openTobiRecipePanel(res) {
    try {
      ["tobiHistoryPanel", "tobiAllergyPanel", "tobiFrequentPanel", "tobiDiscountPanel", "tobiShoppingPanel"].forEach((id) => {
        const other = $id(id);
        if (other) other.hidden = true;
      });
      const panel = $id("tobiRecipePanel");
      if (!panel) return;
      panel.hidden = false;
      renderTobiRecipeList(res || tobiFreshRecipeRes());
    } catch { /* noop */ }
  }
  function tobiFreshRecipeRes() {
    try {
      const allergies = (typeof tobiProfileGetAllergies === "function") ? tobiProfileGetAllergies() : [];
      const freqs = (typeof tobiFrequentGet === "function") ? tobiFrequentGet() : [];
      return tobiRecipesFor(allergies, freqs);
    } catch {
      return { safe: [], excludedCount: 0, excludedAllergies: [], unverified: [] };
    }
  }
  function renderTobiRecipeList(res) {
    try {
      tobiLastRecipeRes = res;
      const list = $id("tobiRecipeList");
      const empty = $id("tobiRecipeEmpty");
      const excl = $id("tobiRecipeExcluded");
      const unwarn = $id("tobiRecipeUnverified");
      const detail = $id("tobiRecipeDetail");
      if (!list || !res) return;
      if (detail) detail.hidden = true;
      list.hidden = false;
      if (excl) {
        excl.textContent = res.excludedAllergies.length
          ? "Excluyendo por tus alergias: " + res.excludedAllergies.join(", ") + "."
          : "Aún no declaras alergias: cuéntamelas para filtrar mejor.";
      }
      if (unwarn) {
        unwarn.hidden = !res.unverified.length;
        if (res.unverified.length) unwarn.textContent = "No pude verificar del todo «" + res.unverified.join(", ") + "»: excluí esas recetas por precaución.";
      }
      list.innerHTML = "";
      if (empty) empty.hidden = res.safe.length > 0;
      res.safe.forEach((item) => {
        const r = item.recipe;
        const card = document.createElement("button");
        card.type = "button";
        card.className = "tobi-recipe-card";
        const nm = document.createElement("b");
        nm.textContent = r.name;
        const meta = document.createElement("small");
        meta.textContent = r.tag + " · " + r.time + " · " + r.servings + " porciones";
        const use = document.createElement("small");
        use.className = "tobi-recipe-have";
        use.textContent = item.matched.length
          ? "Usa " + item.matched.length + " de tus productos: " + item.matched.slice(0, 4).join(", ") + (item.matched.length > 4 ? "…" : "")
          : r.desc;
        card.appendChild(nm);
        card.appendChild(meta);
        card.appendChild(use);
        card.addEventListener("click", () => showTobiRecipeDetail(r.id));
        list.appendChild(card);
      });
    } catch { /* panel opcional */ }
  }
  function showTobiRecipeDetail(id) {
    try {
      const res = tobiLastRecipeRes;
      const detail = $id("tobiRecipeDetail");
      const list = $id("tobiRecipeList");
      if (!res || !detail) return;
      const item = res.safe.find((x) => x.recipe.id === id);
      if (!item) return;
      const r = item.recipe;
      detail.innerHTML = "";
      const back = document.createElement("button");
      back.type = "button";
      back.className = "btn-ghost tobi-history-clear";
      back.textContent = "← Volver al listado";
      back.addEventListener("click", () => renderTobiRecipeList(res));
      const h = document.createElement("h4");
      h.textContent = r.name;
      const meta = document.createElement("p");
      meta.className = "muted small";
      meta.textContent = r.tag + " · " + r.time + " · " + r.servings + " porciones";
      const d = document.createElement("p");
      d.className = "small";
      d.textContent = r.desc;
      const ingT = document.createElement("b");
      ingT.textContent = "Ingredientes:";
      const ul = document.createElement("ul");
      ul.className = "tobi-recipe-ings";
      const have = {};
      item.matched.forEach((m) => { have[m] = true; });
      r.ingredients.forEach((ing) => {
        const li = document.createElement("li");
        li.textContent = (have[ing.name] ? "✓ Tienes: " : "· Te falta: ") + ing.name;
        if (have[ing.name]) li.className = "have";
        ul.appendChild(li);
      });
      const stT = document.createElement("b");
      stT.textContent = "Preparación:";
      const ol = document.createElement("ol");
      ol.className = "tobi-recipe-steps";
      r.steps.forEach((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        ol.appendChild(li);
      });
      const shopBtn = document.createElement("button");
      shopBtn.type = "button";
      shopBtn.className = "btn-primary tobi-chat-open";
      shopBtn.textContent = "🧾 Agregar lo que me falta a mi lista";
      shopBtn.addEventListener("click", () => tobiBuildShoppingList(r.id));
      [back, h, meta, d, ingT, ul, stT, ol, shopBtn].forEach((el) => detail.appendChild(el));
      if (list) list.hidden = true;
      detail.hidden = false;
    } catch { /* noop */ }
  }
  function initTobiRecipesUI() {
    const toggle = $id("btnTobiRecipes");
    const panel = $id("tobiRecipePanel");
    if (toggle && panel && !toggle._tobiRecBound) {
      toggle._tobiRecBound = true;
      toggle.addEventListener("click", () => {
        ["tobiHistoryPanel", "tobiAllergyPanel", "tobiFrequentPanel", "tobiDiscountPanel", "tobiShoppingPanel"].forEach((id) => {
          const other = $id(id);
          if (other && panel.hidden) other.hidden = true;
        });
        panel.hidden = !panel.hidden;
        if (!panel.hidden) renderTobiRecipeList(tobiFreshRecipeRes());
      });
    }
    const back = $id("btnTobiRecipeBack");
    if (back && panel && !back._tobiRecBound) {
      back._tobiRecBound = true;
      back.addEventListener("click", () => { panel.hidden = true; });
    }
  }

  // ---------- DESCUENTOS DEL DÍA (paso 7B/7C, solo aditivo) ----------
  // Intent + mención 1×/visita + pantalla. Los datos viven en tobi-discounts.js;
  // aquí solo se informa y se navega. Sin tocar el carrito. Sin red. Sin consola.
  function tobiHasDiscounts() { return typeof tobiDiscountsToday === "function"; }
  function tobiDiscountNorm(s) { return tobiNorm(s); }
  // ¿Este producto choca con alguna alergia? (substring, sin recomendarlo).
  function tobiDiscountHitsAllergy(productName) {
    try {
      if (typeof tobiProfileGetAllergies !== "function") return null;
      const hay = tobiDiscountNorm(productName);
      const hit = tobiProfileGetAllergies().find((a) => {
        const n = tobiDiscountNorm(a.name);
        return n && n.length >= 3 && (hay.indexOf(n) !== -1 || n.indexOf(hay) !== -1);
      });
      return hit ? hit.name : null;
    } catch {
      return null;
    }
  }
  // Frecuentes del cliente con descuento hoy (sin los que chocan con alergias).
  function tobiDiscountFrequentMatches(deals) {
    const out = [];
    try {
      if (typeof tobiFrequentGet !== "function") return out;
      const freqs = tobiFrequentGet().map((p) => String(p.name || ""));
      (deals || []).forEach((d) => {
        (d.products || []).forEach((p) => {
          const mine = freqs.some((f) => {
            const a = tobiDiscountNorm(f), b = tobiDiscountNorm(p.name);
            return a.length >= 3 && (b.indexOf(a) !== -1 || a.indexOf(b) !== -1);
          });
          if (mine && !tobiDiscountHitsAllergy(p.name)) out.push({ deal: d, product: p });
        });
      });
    } catch { /* noop */ }
    return out;
  }
  function tobiDiscountIntent(rawMsg, ctx) {
    try {
      if (!tobiHasDiscounts()) return null;
      const t = tobiNorm(rawMsg);
      // "Ahora no" cierra la mención sin repreguntar en la visita.
      if (/^(ahora no|no gracias|mejor no)\.?$/.test(t.trim())) {
        try { sessionStorage.setItem("tobi_discounts_mentioned", "1"); } catch { /* noop */ }
        return "Entendido. Cuando quieras verlas, pulsa 🏷️ Ofertas. 👍";
      }
      if (!/(oferta|ofertas|descuento|descuentos|promocion|promociones|promo|barato|rebaja|que hay en oferta|ofertas de hoy|ver ofertas)/.test(t)) return null;
      const name = (ctx && ctx.name) || "";
      const hello = name ? ", " + name : "";
      const deals = tobiDiscountsToday();
      openTobiDiscountPanel(deals);
      if (!deals.length) return "Hoy no hay descuentos disponibles" + hello + ". Date una vuelta por el catálogo: siempre hay algo bueno. 🛒";
      const mine = tobiDiscountFrequentMatches(deals);
      let out = "";
      if (mine.length) {
        const m = mine[0];
        out = "Tu producto " + m.product.name + " está con -" + m.product.percent + "% hoy" + hello + ". 🎉";
        if (mine.length > 1) out += " También hay oferta en " + mine.slice(1, 3).map((x) => x.product.name).join(", ") + ".";
      } else {
        out = "Hoy hay " + deals.length + (deals.length === 1 ? " oferta" : " ofertas") + hello + ": " + deals.map((d) => d.title).join(", ") + ". Míralas en el panel. 🏷️";
      }
      setTimeout(() => tobiChips(["Ver ofertas"]), calmMotion() ? 300 : 900);
      return out;
    } catch {
      return null;
    }
  }
  // Mención corta 1×/visita tras el saludo, sin interrumpir flujos guiados.
  function tobiDiscountMention() {
    try {
      if (!tobiHasDiscounts()) return;
      try {
        if (sessionStorage.getItem("tobi_discounts_mentioned") === "1") return;
      } catch { /* noop */ }
      // Solo si lo de alergias y frecuentes ya se resolvió (si no, esos preguntan).
      if (typeof tobiProfileWasAsked === "function" && !tobiProfileWasAsked()) return;
      if (typeof tobiFrequentWasAsked === "function" && !tobiFrequentWasAsked()
        && !(typeof tobiFrequentLaterThisVisit === "function" && tobiFrequentLaterThisVisit())) return;
      if (tobiAllergyFlowState.step !== "idle" || tobiFrequentStep() !== "idle") return;
      const deals = tobiDiscountsToday();
      if (!deals.length) return;
      setTimeout(() => {
        try {
          if (tobiAllergyFlowState.step !== "idle" || tobiFrequentStep() !== "idle") return;
          tobiSay("Hoy hay " + deals.length + (deals.length === 1 ? " oferta" : " ofertas") + ", ¿quieres verlas?", ["Ver ofertas", "Ahora no"]);
          try { sessionStorage.setItem("tobi_discounts_mentioned", "1"); } catch { /* noop */ }
        } catch { /* noop */ }
      }, calmMotion() ? 800 : 3000);
    } catch { /* noop */ }
  }
  function openTobiDiscountPanel(deals) {
    try {
      ["tobiHistoryPanel", "tobiAllergyPanel", "tobiFrequentPanel", "tobiRecipePanel", "tobiDiscountPanel", "tobiShoppingPanel"].forEach((id) => {
        const other = $id(id);
        if (other) other.hidden = true;
      });
      const panel = $id("tobiDiscountPanel");
      if (!panel) return;
      panel.hidden = false;
      renderTobiDiscountList(deals);
    } catch { /* noop */ }
  }
  function renderTobiDiscountList(deals) {
    try {
      const list = $id("tobiDiscountList");
      const empty = $id("tobiDiscountEmpty");
      if (!list) return;
      const data = Array.isArray(deals) ? deals : (tobiHasDiscounts() ? tobiDiscountsToday() : []);
      list.innerHTML = "";
      if (empty) empty.hidden = data.length > 0;
      data.forEach((d) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "tobi-recipe-card";
        const nm = document.createElement("b");
        nm.textContent = d.title + " · -" + d.percent + "%";
        const meta = document.createElement("small");
        meta.textContent = d.desc + (d.validUntil ? " (" + d.validUntil + ")" : "");
        card.appendChild(nm);
        card.appendChild(meta);
        let goCode = "";
        (d.products || []).forEach((p) => {
          const line = document.createElement("small");
          const clash = tobiDiscountHitsAllergy(p.name);
          line.className = "tobi-recipe-have";
          line.textContent = (clash ? "⚠️ Puede contener " + clash + ": " : "· ") + p.name + " (-" + p.percent + "%)";
          card.appendChild(line);
          if (!clash && !goCode) goCode = p.code;
        });
        if (goCode) {
          card.addEventListener("click", () => openTobiCatalogProduct(goCode));
        }
        list.appendChild(card);
      });
    } catch { /* panel opcional */ }
  }
  // Lleva al producto en el catálogo (filtro Ofertas existente + resaltado).
  // Jamás agrega al carrito.
  function openTobiCatalogProduct(code) {
    try {
      if (typeof showView === "function") showView("home");
      else {
        document.querySelectorAll("main .view").forEach((s) => { s.hidden = true; });
        const h = $id("view-home");
        if (h) h.hidden = false;
      }
      const chip = document.querySelector('.chip-filter[data-filter="oferta"]');
      if (chip) chip.click();
      setTimeout(() => {
        try {
          const btn = code ? document.querySelector('[data-add="' + code + '"]') : null;
          const card = btn ? btn.closest(".product") : null;
          if (card) {
            card.scrollIntoView({ block: "center", behavior: calmMotion() ? "auto" : "smooth" });
            card.classList.add("tobi-product-flash");
            setTimeout(() => card.classList.remove("tobi-product-flash"), 2200);
          }
        } catch { /* noop */ }
      }, calmMotion() ? 100 : 450);
    } catch { /* noop */ }
  }
  function initTobiDiscountsUI() {
    const toggle = $id("btnTobiDiscounts");
    const panel = $id("tobiDiscountPanel");
    if (toggle && panel && !toggle._tobiDisBound) {
      toggle._tobiDisBound = true;
      toggle.addEventListener("click", () => {
        ["tobiHistoryPanel", "tobiAllergyPanel", "tobiFrequentPanel", "tobiRecipePanel", "tobiDiscountPanel", "tobiShoppingPanel"].forEach((id) => {
          const other = $id(id);
          if (other && panel.hidden) other.hidden = true;
        });
        panel.hidden = !panel.hidden;
        if (!panel.hidden) renderTobiDiscountList();
      });
    }
    const back = $id("btnTobiDiscountBack");
    if (back && panel && !back._tobiDisBound) {
      back._tobiDisBound = true;
      back.addEventListener("click", () => { panel.hidden = true; });
    }
  }

  // ---------- COMPRENSIÓN PREVIA (paso 8.1, solo aditivo) ----------
  // Capa antes de la respuesta de respaldo, SIN reescribir la lógica actual:
  // normaliza, corrige tipeos comunes y reescribe a frases que los flujos ya
  // entienden; además responde seguimientos con datos reales (sin inventar).
  const TOBI_TYPO_MAP = {
    lactoza: "lactosa", lactossa: "lactosa", ofetas: "ofertas", oferta: "ofertas",
    recetas: "recetas", cosinar: "cocinar", pagar: "pagar", alerjia: "alergia",
    alergia: "alergias", intoleracia: "intolerancia", carito: "carrito",
    escanear: "escanear", targeta: "tarjeta", yape: "yape, pagar",
  };
  function tobiCleanText(s) {
    try {
      return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9ñü\s]/g, " ").replace(/\s+/g, " ").trim();
    } catch {
      return String(s || "").toLowerCase();
    }
  }
  // Canonicaliza para que los flujos existentes entiendan sinónimos y tipeos.
  function tobiCanon(raw) {
    try {
      let t = " " + tobiCleanText(raw) + " ";
      Object.keys(TOBI_TYPO_MAP).forEach((k) => {
        t = t.split(" " + k + " ").join(" " + TOBI_TYPO_MAP[k] + " ");
      });
      t = t.replace(/\s+/g, " ").trim();
      // Sinónimos → frases que los flujos ya entienden (conserva el resto).
      const rules = [
        [/^(hola|buenas|buenos dias|hey|oye|disculpa)\b/, "hola"],
        [/\b(escaneo|escaner|camara|leer codigo|leer el codigo)\b/, "escanear"],
        [/\b(como pago|forma de pago|medios de pago|pagar con|metodos de pago)\b/, "como pagar"],
        [/\b(salir de tienda|salida de tienda|puerta de salida)\b/, "salida seguridad"],
        [/\b(caja|validar compra|confirmar compra)\b/, "caja qr"],
        [/\b(que cocino|que puedo cocinar|que preparo|ideas de comida|ideas para cocinar)\b/, "dame recetas"],
        [/\b(que ofertas hay|hay ofertas|hay descuentos|promociones de hoy)\b/, "ofertas de hoy"],
        [/\b(mi carrito|ver carrito|mi compra actual)\b/, "carrito"],
      ];
      rules.forEach(([re, rep]) => { t = t.replace(re, rep); });
      return t;
    } catch {
      return String(raw || "");
    }
  }
  // Seguimientos con datos reales: recetas mostradas y alergias registradas.
  // Si no tiene la información, lo dice sin inventar.
  function tobiFollowUp(rawMsg, ctx) {
    try {
      const t = tobiCleanText(rawMsg);
      const name = (ctx && ctx.name) || "";
      const hello = name ? ", " + name : "";
      const allergies = (typeof tobiProfileGetAllergies === "function") ? tobiProfileGetAllergies() : [];
      const hasRecipes = typeof tobiLastRecipeRes !== "undefined" && tobiLastRecipeRes && tobiLastRecipeRes.safe && tobiLastRecipeRes.safe.length;
      // ¿Qué alergias tengo / qué excluyes?
      if (/(que alergias tengo|cuales son mis alergias|mis alergias registradas|que estas excluyendo|que excluyes|por que excluyes)/.test(t)) {
        if (typeof tobiProfileHasNone === "function" && tobiProfileHasNone()) {
          return "Tienes registrado que no tienes alergias" + hello + ". Si eso cambia, avísame. 💚";
        }
        if (!allergies.length) return "Aún no registraste alergias" + hello + ". Cuéntamelas y las tomo en cuenta. 🙂";
        return "Tus alergias registradas son: " + allergies.map((a) => a.name).join(", ") + ". Las excluyo de todo lo que te sugiero" + hello + ". 💚";
      }
      // ¿Son seguras? (las recetas mostradas)
      if (/(son seguras|es seguro|puedo comer|sin riesgo|todo bien con)/.test(t)) {
        if (!hasRecipes) return "Aún no te mostré recetas en esta conversación" + hello + ". Pídeme «dame recetas» y las filtro por tus alergias. 🍲";
        const excl = tobiLastRecipeRes.excludedAllergies || [];
        return "Sí: las " + tobiLastRecipeRes.safe.length + " recetas que ves ya excluyen " +
          (excl.length ? excl.join(", ") : "tus alergias registradas") + hello + ". Igual verifica siempre las etiquetas. 🙂";
      }
      // ¿Alguna lleva X? / ¿Tienen gluten? → comprueba lo mostrado con certeza.
      const ingM = t.match(/(?:alguna|alguno|alguna receta|alguna de estas)(?:.+?)?lleva[n]?\s+([a-zñü\s]+)|tienen\s+([a-zñü\s]+)|contiene[n]?\s+([a-zñü\s]+)|con\s+([a-zñü\s]+)\?*$/);
      if (ingM) {
        if (!hasRecipes) return "Aún no te mostré recetas" + hello + ". Pídeme «dame recetas» y luego pregúntame por cualquier ingrediente. 🍲";
        const ing = tobiCleanText(ingM[1] || ingM[2] || ingM[3] || ingM[4] || "");
        if (!ing || ing.length < 3) return null;
        const withIng = tobiLastRecipeRes.safe.filter((x) =>
          x.recipe.ingredients.some((g) => {
            const n = tobiCleanText(g.name);
            return n.indexOf(ing) !== -1 || ing.split(" ").some((w) => w.length >= 4 && n.indexOf(w) !== -1);
          }));
        if (!withIng.length) return "Ninguna de las recetas que te muestro lleva " + ing + hello + ". ✅";
        return "Sí: " + withIng.slice(0, 3).map((x) => x.recipe.name).join(", ") +
          (withIng.length > 3 ? " y " + (withIng.length - 3) + " más" : "") + " llevan " + ing + hello + ".";
      }
      return null;
    } catch {
      return null;
    }
  }
  // Adivina las 3 opciones más probables por coincidencia de palabras.
  function tobiGuessChips(rawMsg) {
    try {
      const t = " " + tobiCleanText(rawMsg) + " ";
      const opts = [
        { label: "Ver ofertas", send: "ofertas de hoy", words: ["oferta", "ofertas", "descuento", "descuentos", "promo", "barato", "precio", "cierto", "verdad"] },
        { label: "¿Qué cocino hoy?", send: "que puedo cocinar", words: ["cocinar", "cocino", "comida", "receta", "recetas", "lleve", "llevan", "ingrediente", "leche", "segura", "seguras"] },
        { label: "¿Cómo pago?", send: "como pagar", words: ["pago", "pagar", "yape", "plin", "tarjeta", "caja", "qr"] },
        { label: "Mis alergias", send: "mis alergias", words: ["alergia", "alergias", "intolerancia", "excluyes", "excluyendo", "gluten", "lactosa"] },
        { label: "¿Cómo escaneo?", send: "como escanear", words: ["escanear", "camara", "codigo", "barras", "escaner"] },
        { label: "Mi carrito", send: "carrito", words: ["carrito", "agregar", "compra", "llevar"] },
      ];
      const scored = opts.map((o) => ({
        o, score: o.words.reduce((a, w) => a + (t.indexOf(" " + w) !== -1 || t.indexOf(w) !== -1 ? 1 : 0), 0),
      }));
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 3).map((x) => ({ label: x.o.label, send: x.o.send }));
    } catch {
      return [{ label: "Ver ofertas", send: "ofertas de hoy" }, { label: "¿Qué cocino hoy?", send: "que puedo cocinar" }, { label: "¿Cómo pago?", send: "como pagar" }];
    }
  }
  function tobiFallbackChips(chips) {
    try {
      setTimeout(() => {
        const log = document.getElementById("tobiChatLog");
        if (!log) return;
        const wrap = document.createElement("div");
        wrap.className = "tobi-chips";
        chips.forEach((c) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "tobi-chip";
          b.textContent = c.label;
          b.addEventListener("click", () => {
            try { wrap.querySelectorAll("button").forEach((x) => { x.disabled = true; }); } catch { /* noop */ }
            sendMsg(c.send);
          });
          wrap.appendChild(b);
        });
        log.appendChild(wrap);
        scrollLog();
      }, calmMotion() ? 150 : 400);
    } catch { /* chips opcionales */ }
  }

  // Fallback amable: en vez del genérico, aclara + 3 opciones probables.
  function tobiSmartFallback(raw, ctx) {
    try {
      const name = (ctx && ctx.name) || "";
      const hello = name ? ", " + name : "";
      return {
        text: "No te entendí del todo" + hello + ". Quizás quisiste decir una de estas opciones: 👇",
        chips: tobiGuessChips(raw),
      };
    } catch {
      return null;
    }
  }

  // ---------- LISTA DE COMPRAS (paso 8.3, solo aditivo) ----------
  // Desde una receta: compara con frecuentes, arma solo lo que falta y lo guarda.
  // Respeta alergias (tabla parte 2) y NUNCA toca el carrito.
  function tobiShoppingMatch(a, b) {
    try {
      if (typeof tobiRecipeTextMatch === "function") {
        return tobiRecipeTextMatch(a, b) || tobiRecipeTextMatch(b, a);
      }
    } catch { /* cae al plan B */ }
    try {
      const n = (s) => String(s || "").toLowerCase();
      return n(a).indexOf(n(b)) !== -1 || n(b).indexOf(n(a)) !== -1;
    } catch {
      return false;
    }
  }
  function tobiBuildShoppingList(recipeId) {
    try {
      let recipe = null;
      try {
        const res = tobiLastRecipeRes;
        const item = res && res.safe ? res.safe.find((x) => x.recipe.id === recipeId) : null;
        recipe = item ? item.recipe : null;
      } catch { recipe = null; }
      if (!recipe && typeof TOBI_RECIPES !== "undefined") {
        recipe = TOBI_RECIPES.find((r) => r.id === recipeId) || null;
      }
      if (!recipe) return;
      const freqs = (typeof tobiFrequentGet === "function") ? tobiFrequentGet().map((p) => String(p.name || "")) : [];
      const entries = [];
      recipe.ingredients.forEach((ing) => {
        const has = freqs.some((f) => tobiShoppingMatch(f, ing.name));
        if (has) return; // ya lo tiene: no va a la lista
        let code = null;
        try {
          if (typeof tobiFrequentInCatalog === "function") {
            const hit = tobiFrequentInCatalog(ing.name);
            if (hit && hit.code) {
              // Respeta alergias: si choca, no se sugiere el producto.
              let clash = null;
              try {
                if (typeof tobiProductClash === "function") clash = tobiProductClash(hit);
              } catch { clash = null; }
              if (!clash) code = hit.code;
            }
          }
        } catch { code = null; }
        entries.push({ name: ing.name, code });
      });
      const added = (typeof tobiShoppingAddMissing === "function") ? tobiShoppingAddMissing(entries) : 0;
      try {
        ["tobiHistoryPanel", "tobiAllergyPanel", "tobiFrequentPanel", "tobiRecipePanel", "tobiDiscountPanel"].forEach((id) => {
          const other = $id(id);
          if (other) other.hidden = true;
        });
        const panel = $id("tobiShoppingPanel");
        if (panel) panel.hidden = false;
        renderTobiShopping();
      } catch { /* noop */ }
      try {
        if (typeof toast === "function") toast(added ? "🧾 " + added + " ingredientes en tu lista" : "🧾 Ya tenías todo en tu lista");
      } catch { /* noop */ }
    } catch { /* noop */ }
  }
  function renderTobiShopping() {
    try {
      if (typeof tobiShoppingLoad !== "function") return;
      const list = $id("tobiShoppingList");
      const empty = $id("tobiShoppingEmpty");
      if (!list) return;
      const items = tobiShoppingLoad();
      list.innerHTML = "";
      if (empty) empty.hidden = items.length > 0;
      items.forEach((it, idx) => {
        const row = document.createElement("div");
        row.className = "tobi-shopping-item" + (it.bought ? " done" : "");
        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = !!it.bought;
        check.setAttribute("aria-label", "Marcar comprado: " + it.name);
        check.addEventListener("change", () => renderTobiShoppingRefresh(tobiShoppingToggle(idx)));
        const nm = document.createElement("b");
        nm.textContent = it.name;
        row.appendChild(check);
        row.appendChild(nm);
        if (it.code) {
          const go = document.createElement("button");
          go.type = "button";
          go.className = "tobi-shopping-go";
          go.textContent = "Ver en catálogo";
          go.addEventListener("click", () => {
            try {
              if (typeof openTobiCatalogProduct === "function") openTobiCatalogProduct(it.code);
            } catch { /* noop */ }
          });
          row.appendChild(go);
        } else {
          const na = document.createElement("small");
          na.className = "muted";
          na.textContent = "No disponible en el catálogo";
          row.appendChild(na);
        }
        const del = document.createElement("button");
        del.type = "button";
        del.className = "tobi-allergy-del";
        del.textContent = "🗑️";
        del.setAttribute("aria-label", "Quitar " + it.name);
        del.addEventListener("click", () => renderTobiShoppingRefresh(tobiShoppingRemove(idx)));
        row.appendChild(del);
        list.appendChild(row);
      });
    } catch { /* panel opcional */ }
  }
  function renderTobiShoppingRefresh() {
    try { renderTobiShopping(); } catch { /* noop */ }
  }
  function initTobiShoppingUI() {
    const toggle = $id("btnTobiShopping");
    const panel = $id("tobiShoppingPanel");
    if (toggle && panel && !toggle._tobiShopBound) {
      toggle._tobiShopBound = true;
      toggle.addEventListener("click", () => {
        ["tobiHistoryPanel", "tobiAllergyPanel", "tobiFrequentPanel", "tobiRecipePanel", "tobiDiscountPanel"].forEach((id) => {
          const other = $id(id);
          if (other && panel.hidden) other.hidden = true;
        });
        panel.hidden = !panel.hidden;
        if (!panel.hidden) renderTobiShopping();
      });
    }
    const back = $id("btnTobiShoppingBack");
    if (back && panel && !back._tobiShopBound) {
      back._tobiShopBound = true;
      back.addEventListener("click", () => { panel.hidden = true; });
    }
    const clear = $id("btnTobiShoppingClear");
    if (clear && !clear._tobiShopBound) {
      clear._tobiShopBound = true;
      clear.addEventListener("click", () => {
        if (!window.confirm("¿Vaciar tu lista de compras?")) return;
        try { if (typeof tobiShoppingClear === "function") tobiShoppingClear(); } catch { /* noop */ }
        renderTobiShopping();
      });
    }
  }

  // ---------- SUGERENCIAS RÁPIDAS (paso 8.4, solo aditivo) ----------
  // Fila discreta al abrir el chat y tras cada respuesta. Máx. 4, sin repetir
  // las recién mostradas y oculta durante flujos guiados (confirmaciones).
  let tobiLastSuggestLabels = [];
  function tobiSuggestPool() {
    const pool = [];
    try {
      const allergiesAsked = (typeof tobiProfileWasAsked === "function") ? tobiProfileWasAsked() : true;
      if (!allergiesAsked) pool.push({ label: "Registrar mis alergias", send: "Sí, tengo alergias" });
      let hasRecipes = false;
      try { hasRecipes = !!(tobiLastRecipeRes && tobiLastRecipeRes.safe && tobiLastRecipeRes.safe.length); } catch { hasRecipes = false; }
      pool.push(hasRecipes ? { label: "Ver recetas", ui: "recipes" } : { label: "¿Qué cocino hoy?", send: "que puedo cocinar" });
      let hasDeals = false;
      try { hasDeals = (typeof tobiDiscountsToday === "function") && tobiDiscountsToday().length > 0; } catch { hasDeals = false; }
      if (hasDeals) pool.push({ label: "Ofertas de hoy", send: "ofertas de hoy" });
      pool.push({ label: "¿Cómo pago?", send: "como pagar" });
      pool.push({ label: "Mis alergias", ui: "allergies" });
      pool.push({ label: "Mi lista", ui: "shopping" });
      pool.push({ label: "Mis productos", ui: "frequents" });
    } catch { /* noop */ }
    return pool;
  }
  function tobiSuggestOpenPanel(kind) {
    try {
      const ids = ["tobiHistoryPanel", "tobiAllergyPanel", "tobiFrequentPanel", "tobiRecipePanel", "tobiDiscountPanel", "tobiShoppingPanel"];
      const target = { recipes: "tobiRecipePanel", allergies: "tobiAllergyPanel", shopping: "tobiShoppingPanel", frequents: "tobiFrequentPanel" }[kind];
      if (!target) return;
      ids.forEach((id) => {
        const other = $id(id);
        if (other && id !== target) other.hidden = true;
      });
      const panel = $id(target);
      if (!panel) return;
      panel.hidden = false;
      // Mismas funciones de pintado de cada pantalla (mismo closure, sin eval).
      if (kind === "recipes") {
        try { renderTobiRecipeList(typeof tobiFreshRecipeRes === "function" ? tobiFreshRecipeRes() : tobiLastRecipeRes); } catch { /* noop */ }
      } else if (kind === "allergies") {
        try { renderTobiAllergies(); } catch { /* noop */ }
      } else if (kind === "shopping") {
        try { renderTobiShopping(); } catch { /* noop */ }
      } else if (kind === "frequents") {
        try { renderTobiFrequents(); } catch { /* noop */ }
      }
    } catch { /* noop */ }
  }
  function renderTobiSuggest() {
    try {
      const box = $id("tobiSuggest");
      if (!box) return;
      // Sin sugerencias durante un flujo guiado en curso.
      if (tobiAllergyFlowState.step !== "idle" || tobiFrequentStep() !== "idle") {
        box.hidden = true; box.innerHTML = "";
        return;
      }
      const pool = tobiSuggestPool();
      let picks = pool.filter((p) => tobiLastSuggestLabels.indexOf(p.label) === -1);
      if (!picks.length) picks = pool.slice();
      picks = picks.slice(0, 4);
      if (!picks.length) { box.hidden = true; return; }
      box.innerHTML = "";
      picks.forEach((p) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tobi-chip";
        b.textContent = p.label;
        b.addEventListener("click", () => {
          try {
            if (p.ui) tobiSuggestOpenPanel(p.ui);
            else sendMsg(p.send || p.label);
          } catch { /* noop */ }
        });
        box.appendChild(b);
      });
      tobiLastSuggestLabels = picks.map((p) => p.label);
      box.hidden = false;
    } catch { /* fila opcional */ }
  }

  function sendMsg(text) {
    const msg = String(text || "").trim();
    if (!msg) return;
    try {
      const activeId = tobiActiveId();
      addMsg("user", msg);
      tobiStore(activeId, "user", msg);
      setTyping(true);
      const wait = calmMotion() ? 350 : 900;
      setTimeout(() => {
        try {
          setTyping(false);
          // Prioridad sin interrumpir: si el flujo de frecuentes está activo y el
          // mensaje no habla de alergias, lo atiende él; si no, alergias primero.
          // Si lo de alergias ya se resolvió y lo pendiente es frecuentes, un
          // "después" va a frecuentes para no repreguntar en la visita.
          const fqActive = (typeof tobiFrequentStep === "function") ? tobiFrequentStep() !== "idle" : false;
          // Capa de comprensión (paso 8.1): canon para los flujos; el historial
          // guarda el texto original del cliente.
          const canon = (typeof tobiCanon === "function") ? tobiCanon(msg) : msg;
          const ctx8 = { name: tobiName(), first: tobiIsFirstReply(activeId) };
          const normMsg = tobiNorm(canon);
          const allergyWord = /alergia|intolerante|alergico/.test(normMsg);
          const laterWords = /prefiero responder despues|responder despues|^despues|^luego|mas tarde/.test(normMsg);
          const allergyDone = (typeof tobiProfileWasAsked === "function") ? tobiProfileWasAsked() : true;
          const fqPending = (typeof tobiFrequentWasAsked === "function") ? !tobiFrequentWasAsked() : false;
          let flowed = null;
          if (typeof tobiFollowUp === "function") flowed = tobiFollowUp(canon, ctx8);
          if (flowed === null && ((fqActive && !allergyWord) || (laterWords && allergyDone && fqPending))) {
            if (typeof tobiFrequentFlow === "function") flowed = tobiFrequentFlow(canon, ctx8);
          } else if (flowed === null) {
            flowed = tobiAllergyFlow(canon, ctx8);
          }
          if (flowed === null && typeof tobiFrequentFlow === "function") flowed = tobiFrequentFlow(canon, ctx8);
          if (flowed === null && typeof tobiRecipeIntent === "function") flowed = tobiRecipeIntent(canon, ctx8);
          if (flowed === null && typeof tobiDiscountIntent === "function") flowed = tobiDiscountIntent(canon, ctx8);
          let reply = flowed !== null ? flowed : getTobiReplyNamed(canon, ctx8);
          let fbChips = null;
          if (flowed === null && typeof tobiSmartFallback === "function" && /^Mmm, no te entend/.test(reply)) {
            const fb = tobiSmartFallback(canon, ctx8);
            if (fb) { reply = fb.text; fbChips = fb.chips; }
          }
          addMsg("tobi", reply);
          tobiStore(activeId, "tobi", reply);
          if (fbChips) tobiFallbackChips(fbChips);
          if (typeof renderTobiSuggest === "function") renderTobiSuggest();
        } catch (e) {
          setTyping(false);
          addMsg("tobi", "Uy, algo falló al responder. 😅 Inténtalo de nuevo con otra pregunta.");
        }
      }, wait);
    } catch (e) {
      setTyping(false);
      addMsg("tobi", "Uy, no pude enviar tu mensaje. 😅 Revisa tu conexión e inténtalo de nuevo.");
    }
  }

  // ---------- HISTORIAL UI (paso 3A, solo aditivo) ----------
  // Toda la persistencia vive en tobi-history.js; aquí solo se pinta la lista.
  function tobiHasHistory() { return typeof tobiHistoryList === "function"; }
  function tobiName() {
    try {
      if (typeof getUserName === "function") return getUserName();
    } catch { /* noop */ }
    return "";
  }
  function tobiActiveId() {
    try {
      if (tobiHasHistory()) return tobiHistoryGetActiveId() || "tobi-active";
    } catch { /* noop */ }
    return "tobi-active";
  }
  function tobiStore(id, who, text) {
    try {
      if (tobiHasHistory()) tobiHistorySaveMsg(id, who, text, Date.now());
    } catch { /* el chat sigue funcionando sin guardar */ }
  }
  function tobiIsFirstReply(id) {
    try {
      if (!tobiHasHistory()) return true;
      const convo = tobiHistoryLoad().find((c) => c.id === id);
      if (!convo) return true;
      return !convo.messages.some((m) => m.who === "tobi");
    } catch {
      return true;
    }
  }
  function clearChatLog() {
    const log = $id("tobiChatLog");
    if (log) log.innerHTML = "";
  }
  function paintConversation(convo) {
    clearChatLog();
    if (convo && convo.messages) {
      convo.messages.forEach((m) => addMsg(m.who === "user" ? "user" : "tobi", m.text, m.ts));
    }
  }
  // Retoma la última conversación activa; si no hay, empieza una limpia.
  // El saludo con nombre se agrega UNA vez por visita (aunque retome historial).
  function resumeTobiConversation() {
    try {
      if (!tobiHasHistory()) {
        if (!greeted) {
          greeted = true;
          addMsg("tobi", "¡Hola! Soy Tobi. 🤖 Conversemos sin prisa: pregúntame cómo escanear, pagar o salir de tienda.");
        }
        return;
      }
      let convo = null;
      const activeId = tobiHistoryGetActiveId();
      if (activeId) convo = tobiHistoryOpen(activeId);
      if (!convo) {
        let list = tobiHistoryList();
        if (list.length) {
          convo = list[0];
          tobiHistoryOpen(convo.id);
        }
      }
      if (!convo) {
        paintConversation(null);
        addMsg("tobi", "¡Hola! Soy Tobi. 🤖 Conversemos sin prisa: pregúntame cómo escanear, pagar o salir de tienda.");
        tobiStore(tobiActiveId(), "tobi", "¡Hola! Soy Tobi. 🤖 Conversemos sin prisa: pregúntame cómo escanear, pagar o salir de tienda.");
      } else {
        paintConversation(convo);
      }
      if (typeof tobiGreetedThisVisit === "function" && !tobiGreetedThisVisit()) {
        const hello = "Hola, " + tobiName() + ", qué gusto verte de nuevo. ¿En qué puedo ayudarte hoy?";
        addMsg("tobi", hello);
        tobiStore(tobiActiveId(), "tobi", hello);
        tobiMarkGreeted();
      }
      tobiAllergyAskOnOpen();
      if (typeof tobiFrequentAskOnOpen === "function") tobiFrequentAskOnOpen();
      if (typeof tobiDiscountMention === "function") tobiDiscountMention();
      renderTobiHistoryList();
      if (typeof renderTobiSuggest === "function") renderTobiSuggest();
    } catch (e) {
      addMsg("tobi", "Uy, no pude abrir el chat. 😅 Inténtalo de nuevo presionando Chatear con Tobi.");
    }
  }
  function fmtTobiDate(ts) {
    try {
      return new Date(ts || Date.now()).toLocaleString("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }
  function renderTobiHistoryList() {
    try {
      const list = $id("tobiHistoryList");
      const empty = $id("tobiHistoryEmpty");
      if (!list) return;
      list.innerHTML = "";
      const convos = tobiHasHistory() ? tobiHistoryList() : [];
      if (empty) empty.hidden = convos.length > 0;
      const activeId = tobiActiveId();
      convos.forEach((c) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "tobi-history-item" + (c.id === activeId ? " current" : "");
        const b = document.createElement("b");
        b.textContent = c.title || "Nueva conversación";
        const s = document.createElement("small");
        s.textContent = fmtTobiDate(c.updatedAt) + " · " + c.messages.length + " mensajes";
        const del = document.createElement("span");
        del.className = "tobi-history-del";
        del.textContent = "🗑️";
        del.setAttribute("role", "button");
        del.setAttribute("aria-label", "Borrar conversación");
        del.setAttribute("tabindex", "0");
        const doDel = (ev) => {
          if (ev) { ev.stopPropagation(); ev.preventDefault(); }
          if (!window.confirm("¿Borrar esta conversación?")) return;
          tobiHistoryDelete(c.id);
          if (c.id === tobiActiveId()) {
            const rest = tobiHistoryList();
            if (rest.length) {
              tobiHistoryOpen(rest[0].id);
              paintConversation(rest[0]);
            } else {
              try { localStorage.removeItem("tobi_chat_active"); } catch { /* noop */ }
              clearChatLog();
            }
          }
          renderTobiHistoryList();
        };
        del.addEventListener("click", doDel);
        del.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") doDel(ev);
        });
        item.appendChild(b);
        item.appendChild(s);
        item.appendChild(del);
        item.addEventListener("click", () => {
          const convo = tobiHistoryOpen(c.id);
          if (convo) paintConversation(convo);
          const panel = $id("tobiHistoryPanel");
          if (panel) panel.hidden = true;
          const input = $id("tobiChatInput");
          if (input) input.focus({ preventScroll: true });
          renderTobiHistoryList();
        });
        list.appendChild(item);
      });
    } catch { /* lista opcional: el chat sigue funcionando */ }
  }
  function initTobiHistoryUI() {
    const toggle = $id("btnTobiHistory");
    const panel = $id("tobiHistoryPanel");
    if (toggle && panel && !toggle._tobiHistBound) {
      toggle._tobiHistBound = true;
      toggle.addEventListener("click", () => {
        ["tobiAllergyPanel", "tobiFrequentPanel", "tobiRecipePanel", "tobiDiscountPanel", "tobiShoppingPanel"].forEach((id) => {
          const other = $id(id);
          if (other && panel.hidden) other.hidden = true;
        });
        panel.hidden = !panel.hidden;
        if (!panel.hidden) renderTobiHistoryList();
      });
    }
    const fresh = $id("btnTobiNew");
    if (fresh && !fresh._tobiHistBound) {
      fresh._tobiHistBound = true;
      fresh.addEventListener("click", () => {
        try {
          if (tobiHasHistory()) {
            const cur = tobiHistoryOpen(tobiActiveId());
            if (cur && cur.messages.length === 0) { paintConversation(cur); return; }
            const id = tobiHistoryNewId();
            try { localStorage.setItem("tobi_chat_active", id); } catch { /* noop */ }
          }
        } catch { /* noop */ }
        clearChatLog();
        const panel2 = $id("tobiHistoryPanel");
        if (panel2) panel2.hidden = true;
        const input = $id("tobiChatInput");
        if (input) input.focus({ preventScroll: true });
        renderTobiHistoryList();
      });
    }
    const clear = $id("btnTobiClearAll");
    if (clear && !clear._tobiHistBound) {
      clear._tobiHistBound = true;
      clear.addEventListener("click", () => {
        if (!window.confirm("¿Borrar todo el historial de conversaciones?")) return;
        try {
          if (tobiHasHistory()) tobiHistoryClearAll();
        } catch { /* noop */ }
        clearChatLog();
        renderTobiHistoryList();
      });
    }
  }

  function initTobiChat() {
    const open = $id("btnTobiChat");
    if (open && !open._tobiChatBound) {
      open._tobiChatBound = true;
      open.addEventListener("click", (e) => { e.stopPropagation(); openTobiChat(); });
    }
    const back = $id("btnTobiBack");
    if (back && !back._tobiChatBound) {
      back._tobiChatBound = true;
      back.addEventListener("click", backFromTobiChat);
    }
    const form = $id("tobiChatForm");
    const input = $id("tobiChatInput");
    if (form && input && !form._tobiChatBound) {
      form._tobiChatBound = true;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        sendMsg(input.value);
        input.value = "";
        input.focus({ preventScroll: true });
      });
    }
  }

  // ---------- PANTALLA MIS ALERGIAS (paso 4C, solo aditivo) ----------
  function renderTobiAllergies() {
    try {
      if (typeof tobiProfileGetAllergies !== "function") return;
      const list = $id("tobiAllergyList");
      const empty = $id("tobiAllergyEmpty");
      const none = $id("tobiAllergyNone");
      if (!list) return;
      list.innerHTML = "";
      const items = tobiProfileGetAllergies();
      const isNone = tobiProfileHasNone();
      if (empty) empty.hidden = items.length > 0 || isNone;
      if (none) none.hidden = !isNone;
      items.forEach((a) => {
        const row = document.createElement("div");
        row.className = "tobi-allergy-item";
        const name = document.createElement("b");
        name.textContent = a.name; // seguro: sin HTML inyectado
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "tobi-allergy-edit";
        editBtn.textContent = "✏️";
        editBtn.setAttribute("aria-label", "Editar " + a.name);
        editBtn.addEventListener("click", () => startTobiAllergyEdit(row, a));
        const del = document.createElement("button");
        del.type = "button";
        del.className = "tobi-allergy-del";
        del.textContent = "🗑️";
        del.setAttribute("aria-label", "Eliminar " + a.name);
        del.addEventListener("click", () => {
          if (!window.confirm("¿Eliminar «" + a.name + "» de tu lista?")) return;
          tobiProfileDelete(a.id);
          renderTobiAllergies();
        });
        row.appendChild(name);
        row.appendChild(editBtn);
        row.appendChild(del);
        list.appendChild(row);
      });
    } catch { /* panel opcional */ }
  }
  function startTobiAllergyEdit(row, a) {
    try {
      row.innerHTML = "";
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 40;
      input.value = a.name;
      input.setAttribute("aria-label", "Editar alergia");
      const ok = document.createElement("button");
      ok.type = "button";
      ok.className = "tobi-allergy-edit";
      ok.textContent = "✔️";
      ok.setAttribute("aria-label", "Guardar cambio");
      const no = document.createElement("button");
      no.type = "button";
      no.className = "tobi-allergy-edit";
      no.textContent = "✖️";
      no.setAttribute("aria-label", "Cancelar edición");
      const save = () => {
        const r = tobiProfileUpdate(a.id, input.value);
        if (!r.ok && r.reason === "dup") {
          try { alert("Esa alergia ya está en tu lista."); } catch { /* noop */ }
          return;
        }
        renderTobiAllergies();
      };
      ok.addEventListener("click", save);
      input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") save(); });
      no.addEventListener("click", renderTobiAllergies);
      row.appendChild(input);
      row.appendChild(ok);
      row.appendChild(no);
      input.focus();
    } catch { /* noop */ }
  }
  function initTobiAllergyUI() {
    const toggle = $id("btnTobiAllergies");
    const panel = $id("tobiAllergyPanel");
    if (toggle && panel && !toggle._tobiAlgBound) {
      toggle._tobiAlgBound = true;
      toggle.addEventListener("click", () => {
        const hist = $id("tobiHistoryPanel");
        if (hist && panel.hidden) hist.hidden = true;
        const frq = $id("tobiFrequentPanel");
        if (frq && panel.hidden) frq.hidden = true;
        const rec = $id("tobiRecipePanel");
        if (rec && panel.hidden) rec.hidden = true;
        const sho = $id("tobiShoppingPanel");
        if (sho && panel.hidden) sho.hidden = true;
        panel.hidden = !panel.hidden;
        if (!panel.hidden) renderTobiAllergies();
      });
    }
    const back = $id("btnTobiAllergyBack");
    if (back && panel && !back._tobiAlgBound) {
      back._tobiAlgBound = true;
      back.addEventListener("click", () => { panel.hidden = true; });
    }
    const addBtn = $id("btnTobiAllergyAdd");
    const addInput = $id("tobiAllergyInput");
    const doAdd = () => {
      try {
        if (!addInput || !addInput.value.trim()) return;
        const parts = tobiProfileSplitList(addInput.value);
        if (!parts.length) return;
        parts.forEach((n) => tobiProfileAdd(n));
        tobiProfileMarkAsked();
        addInput.value = "";
        renderTobiAllergies();
      } catch { /* noop */ }
    };
    if (addBtn && !addBtn._tobiAlgBound) {
      addBtn._tobiAlgBound = true;
      addBtn.addEventListener("click", doAdd);
    }
    if (addInput && !addInput._tobiAlgBound) {
      addInput._tobiAlgBound = true;
      addInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); doAdd(); } });
    }
    const clear = $id("btnTobiAllergyClear");
    if (clear && !clear._tobiAlgBound) {
      clear._tobiAlgBound = true;
      clear.addEventListener("click", () => {
        if (!window.confirm("¿Borrar todas tus alergias registradas?")) return;
        tobiProfileClearAll();
        renderTobiAllergies();
      });
    }
  }

  // ---------- PANTALLA MIS PRODUCTOS (paso 5C, solo aditivo) ----------
  // Reutiliza las clases del panel de alergias (cero CSS nuevo).
  function renderTobiFrequents() {
    try {
      if (typeof tobiFrequentGet !== "function") return;
      const list = $id("tobiFrequentList");
      const empty = $id("tobiFrequentEmpty");
      if (!list) return;
      list.innerHTML = "";
      const items = tobiFrequentGet();
      if (empty) empty.hidden = items.length > 0;
      items.forEach((p) => {
        const row = document.createElement("div");
        row.className = "tobi-allergy-item";
        const name = document.createElement("b");
        name.textContent = p.name; // seguro: sin HTML inyectado
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "tobi-allergy-edit";
        editBtn.textContent = "✏️";
        editBtn.setAttribute("aria-label", "Editar " + p.name);
        editBtn.addEventListener("click", () => startTobiFrequentEdit(row, p));
        const del = document.createElement("button");
        del.type = "button";
        del.className = "tobi-allergy-del";
        del.textContent = "🗑️";
        del.setAttribute("aria-label", "Eliminar " + p.name);
        del.addEventListener("click", () => {
          if (!window.confirm("¿Eliminar «" + p.name + "» de tu lista?")) return;
          tobiFrequentDelete(p.id);
          renderTobiFrequents();
        });
        row.appendChild(name);
        row.appendChild(editBtn);
        row.appendChild(del);
        list.appendChild(row);
      });
    } catch { /* panel opcional */ }
  }
  function startTobiFrequentEdit(row, p) {
    try {
      row.innerHTML = "";
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 40;
      input.value = p.name;
      input.setAttribute("aria-label", "Editar producto");
      const ok = document.createElement("button");
      ok.type = "button";
      ok.className = "tobi-allergy-edit";
      ok.textContent = "✔️";
      ok.setAttribute("aria-label", "Guardar cambio");
      const no = document.createElement("button");
      no.type = "button";
      no.className = "tobi-allergy-edit";
      no.textContent = "✖️";
      no.setAttribute("aria-label", "Cancelar edición");
      const save = () => {
        const r = tobiFrequentUpdate(p.id, input.value);
        if (!r.ok && r.reason === "dup") {
          try { alert("Ese producto ya está en tu lista."); } catch { /* noop */ }
          return;
        }
        renderTobiFrequents();
      };
      ok.addEventListener("click", save);
      input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") save(); });
      no.addEventListener("click", renderTobiFrequents);
      row.appendChild(input);
      row.appendChild(ok);
      row.appendChild(no);
      input.focus();
    } catch { /* noop */ }
  }
  function initTobiFrequentUI() {
    const toggle = $id("btnTobiFrequents");
    const panel = $id("tobiFrequentPanel");
    if (toggle && panel && !toggle._tobiFrqBound) {
      toggle._tobiFrqBound = true;
      toggle.addEventListener("click", () => {
        ["tobiHistoryPanel", "tobiAllergyPanel", "tobiRecipePanel", "tobiFrequentPanel", "tobiDiscountPanel", "tobiShoppingPanel"].forEach((id) => {
          const other = $id(id);
          if (other && panel.hidden) other.hidden = true;
        });
        panel.hidden = !panel.hidden;
        if (!panel.hidden) renderTobiFrequents();
      });
    }
    const back = $id("btnTobiFrequentBack");
    if (back && panel && !back._tobiFrqBound) {
      back._tobiFrqBound = true;
      back.addEventListener("click", () => { panel.hidden = true; });
    }
    const addBtn = $id("btnTobiFrequentAdd");
    const addInput = $id("tobiFrequentInput");
    const doAdd = () => {
      try {
        if (!addInput || !addInput.value.trim()) return;
        const parts = tobiProfileSplitList(addInput.value);
        if (!parts.length) return;
        parts.forEach((n) => tobiFrequentAdd(n));
        tobiFrequentMarkAsked();
        addInput.value = "";
        renderTobiFrequents();
      } catch { /* noop */ }
    };
    if (addBtn && !addBtn._tobiFrqBound) {
      addBtn._tobiFrqBound = true;
      addBtn.addEventListener("click", doAdd);
    }
    if (addInput && !addInput._tobiFrqBound) {
      addInput._tobiFrqBound = true;
      addInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); doAdd(); } });
    }
    const clear = $id("btnTobiFrequentClear");
    if (clear && !clear._tobiFrqBound) {
      clear._tobiFrqBound = true;
      clear.addEventListener("click", () => {
        if (!window.confirm("¿Borrar todos tus productos frecuentes?")) return;
        tobiFrequentClearAll();
        renderTobiFrequents();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { initTobiChat(); initTobiHistoryUI(); initTobiAllergyUI(); initTobiFrequentUI(); initTobiRecipesUI(); initTobiDiscountsUI(); initTobiShoppingUI(); });
  } else {
    initTobiChat();
    initTobiHistoryUI();
    initTobiAllergyUI();
    initTobiFrequentUI();
    initTobiRecipesUI();
    initTobiDiscountsUI();
  }
})();
