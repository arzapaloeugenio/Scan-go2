# Tottus Scan & Go — Documentación Técnica

> App web móvil para la cadena de supermercados **Tottus**: el cliente escanea productos con su celular, paga desde el navegador, valida su compra en **Caja** y su salida con **Seguridad** mediante **QR temporales anti-captura**, guiado en todo momento por **TOBI 🤖**, el robot asistente de la marca.

- **Stack:** HTML + CSS + JavaScript puros (archivos independientes, sin framework ni backend). Todo el código fue generado con **Opencode** (sin Google Studio).
- **Persistencia:** `localStorage` del navegador (demo académica). Simula las colecciones Firebase `Cliente/Producto/Carrito/Sesion` exigidas en el informe (alcance 1.5: un sector + pasarela de prueba).
- **Paleta:** verde + blanco (`--green: #00a651`, `--green-deep: #044d29`, fondo `#f2fbf5`). `index.html` + `styles.css` se mantienen como base, solo se extiende.
- **Extras UX:** TOBI (robot guía con burbuja parlante), confeti al finalizar la compra, login con ver/ocultar contraseña + DNI/edad (RN02).

---

## 1. Objetivos

| ID | Objetivo | Estado |
|----|----------|--------|
| O1 | Lector de código de barras desde el celular | ✅ `BarcodeDetector` + ingreso manual |
| O2 | Carrito virtual (máx. 40 productos, compra rápida) | ✅ `MAX_ITEMS=40` con barra de progreso, bloqueo y modal a caja tradicional |
| O15 | RN-CAJA-RÁPIDA: tope 40 + modal bloqueante | ✅ `isFastLimitReached/showFastLimitModal` + `#fastLimitModal` responsive; validación+render+total <2s |
| O3 | IGV 18 % desglosado (precios incluyen IGV) | ✅ `Subtotal = Total / 1.18` |
| O4 | Inicio de sesión + acceso demo + RN02 edad | ✅ nombre/email/clave + DNI 8 dígitos + fecha nacimiento; `calcAge/isAdultUser` |
| O5 | Catálogo con descuentos visibles | ✅ 14 productos, etiquetas `-%`, badge `+18`, filtro Ofertas, buscador |
| O6 | Pago desde el celular (meta ≤60s) | ✅ simulado (Yape / Plin / Tarjeta con form demo) + cronómetro `payT0` |
| O11 | RN02 bloqueo licores <18 | ✅ `restricted:true` + toast 🔞 + `(menor 🔞)` en header |
| O12 | RNF02 scan <3s visible + order persistente | ✅ `scanT0` en `scanResult` + `tottus_order` con `restoreOrderUI()` |
| O13 | Ticket imprimible + historial + beep | ✅ `window.print()` + `tottus_history` (20) + WebAudio 880/220Hz |
| O14 | PWA mínima offline | ✅ `manifest.json` + `sw.js` (cache html/css/js) |
| O7 | Confirmación en Caja + confirmación de salida con Seguridad | ✅ doble validación |
| O8 | QR con tiempo límite anti-hackeo | ✅ 5:00 caja + 3:00 salida, un solo uso |
| O9 | Robot guía TOBI (saludo por nombre + ayuda contextual) | ✅ `botSay()` por vista/evento |
| O10 | Celebración con confeti “¡Felicidades por tu compra!” | ✅ canvas propio, sin CDN |

## 2. Arquitectura

```
┌─────────────┐     eventos DOM      ┌──────────┐    localStorage   ┌──────────────┐
│ index.html  │ ◄──────────────────► │ app.js   │ ◄───────────────► │ tottus_user  │
│ (5 vistas)  │                      │ (lógica) │                   │ tottus_cart  │
└──────┬──────┘                      └──────────┘                   │ tottus_order │
       │ CSS verde/blanco + animaciones        ▲ cámara + QR        │ tottus_history│
       ▼                                       │                   └──────────────┘
┌─────────────┐   BarcodeDetector   ┌───────────────────┐   qrcode@1.5.3 (CDN)
│ styles.css  │   getUserMedia  ───►│ video + canvas QR │ ◄── con fallback offline
└─────────────┘                     └───────────────────┘   manifest.json + sw.js (PWA)
```

- **Sin servidor:** toda la lógica corre en el cliente. El “pago”, la “caja” y “seguridad” son simulaciones con botones demo + ingreso manual de 6 dígitos (en producción se reemplazarían por pasarela real y escáner del personal).
- **Vistas SPA:** `login · home · scanner · cart · checkout`, conmutadas con `showView(nombre)` (una visible a la vez).

## 3. Estructura de archivos

| Archivo | Rol | Contenido clave |
|---------|-----|-----------------|
| `index.html` | Estructura + 5 vistas + nav inferior | header, search-bar, `#view-login/home/scanner/cart/checkout`, `loginDNI/loginBirth`, `#cardForm`, `#historyCard`, `#payTimerHint`, `#fastLimitModal`, `#qrCajaCanvas`, `#qrSalidaCanvas`, inputs `cajaInput/segInput`, `manifest.json` + `qrcode@1.5.3` + `app.js` |
| `styles.css` | Diseño mobile-first verde/blanco | variables CSS, animaciones, `.restricted-tag`, `.perf-hint`, `.card-form`, `.hist-list`, `.modal-overlay/.modal-card` responsive, TOBI, confeti, `@media print` (solo ticket) |
| `app.js` | Lógica de negocio | catálogo 14, `calcAge/isAdultUser`, `MAX_ITEMS=40`, `isFastLimitReached/showFastLimitModal`, `scanT0/payT0`, `ORDER_KEY/HISTORY_KEY`, `saveOrder/restoreOrderUI`, `beep()`, validación tarjeta, checkout por pasos, TOBI, confeti |
| `manifest.json` + `sw.js` | PWA mínima | manifest instalable + SW cache-first html/css/js |

## 4. Funcionalidades detalladas

### 4.1 Autenticación (`getUser`, `updateAuthUI`, RN02)
- Formulario estricto: nombre (≥3), email válido, clave (≥4, 👁️), **DNI 8 dígitos** (`/^\d{8}$/`), **fecha nacimiento** obligatoria. `calcAge()` + `isAdult` → guarda `{name, email, dni, birth, age, isAdult}` en `tottus_user`.
- **Botón demo** `#btnDemo`: entra como adulto `Cliente Demo` (26 años) para exposición.
- Menor: header `(menor 🔞)` + bloqueo de licores; sesión persistente; “Salir” borra usuario, detiene cámara y timer QR.

### 4.2 Catálogo y ofertas (`renderProducts`, RN02)
- 14 productos demo (12 base + 2 licores `restricted:true`: Cristal `...0136`, Borgoña `...0143`).
- `discount = round((1 - price/oldPrice)*100)`; etiqueta `-%` + badge `+18` (`.restricted-tag`) y nota `🔞 Venta solo mayores de 18`.
- `addToCart()` bloquea licor si `!isAdultUser()` con toast RN02. Buscador + filtros `Todo / Ofertas`.

### 4.3 Lector de barras (`startCamera`, `loopDetect`, `onScannedCode`, RNF02 + RN-CAJA-RÁPIDA)
- `getUserMedia({facingMode: "environment"})` + `BarcodeDetector` (`ean_13, ean_8, code_128, qr_code`), sondeo cada ~400 ms con antirrebote 1.5 s.
- **Perf RNF02:** `scanT0 = performance.now()` antes de `detect()` / click manual; `onScannedCode()` muestra `⏱️ Xs (meta <3s ✅/⚠️)` discreto en verde (`.perf-hint`) + `beep()` (880Hz ok / 220Hz error).
- **Intercepción tope 40:** `onScannedCode()` valida `isFastLimitReached(1)` antes de `addToCart()`; si es el artículo 41 muestra `⛔ Límite de 40 alcanzado` + abre `#fastLimitModal` y no inserta.
- Fallback: ingreso manual + lista de códigos de prueba (`renderCodesHelp`). Código desconocido → toast `❌ Código no encontrado`.

### 4.4 Carrito (`addToCart`, `changeQty`, `renderCart`, RN-CAJA-RÁPIDA 40)
- Mapa `cart = {code: qty}` persistido en `tottus_cart` vía `saveState()` (retorna `false` y no guarda si `qty > 40`).
- **Regla 40 (compra rápida):** `MAX_ITEMS = 40`; `cartTotalQty() + qty > 40` bloquea con toast + `beep(false)` + modal `#fastLimitModal` (“Límite de compras rápidas alcanzado (40 artículos). Dirígete a una caja tradicional para procesar esta compra.”) y aviso de TOBI al llegar al tope; progreso `qty/40` + badge `pop`. `btnCheckout` deshabilitado con texto `Agrega productos para continuar` si vacío.
- **Modal:** `#fastLimitModal` (overlay `z-index:70` + `.modal-card` max 420px, responsive móvil, cierre con botón `Entendido` / clic fuera). Funciones modulares `isFastLimitReached()/showFastLimitModal()/hideFastLimitModal()`.
- **Perf <2s:** validación O(1) + `renderAll()` + `calcTotals()` con n≤40 medido en `0.36ms` (test `qty:40, blocked41:true, under2s:true`).
- Controles `− / +` por ítem (`changeQty` también valida tope); `Vaciar carrito` con `confirm()`.

### 4.4d Fase 2-3: order persistente, pago medido, ticket, historial, tarjeta, PWA
- **Order persistente:** `tottus_order` (`saveOrder/loadOrder/clearOrder`); `init()` retoma con `restoreOrderUI()` + toast `🔄 Retomaste tu pago pendiente`. `issueCajaQR/issueSalidaQR` guardan; `validateSalida` guarda historial y limpia.
- **Pago ≤60s:** `payT0` inicia en `checkout()/openCheckout()` (`#payTimerHint`); `payNow()` muestra `aprobado en Xs (meta ≤60s)` y guarda `paySecs` en `order`/boleta.
- **Ticket imprimible:** boleta demo SUNAT (RUC demo + DNI) en `#ticketBody/#finalTicketBody` + `window.print()` (`#btnPrintTicket/#btnPrintFinal`) con `@media print` solo ticket.
- **Historial:** `tottus_history` (máx. 20) con `ticketId/fecha/total/qty/método`; `renderHistory()` en `#historyCard` + `Borrar historial`.
- **Tarjeta demo:** `#cardForm` visible solo si método Tarjeta; valida 16 dígitos + `MM/AA` + CVV3 (solo formato, sin cobro real).
- **PWA mínima:** `manifest.json` + `sw.js` cache-first (`./, index.html, styles.css, app.js`); registro en `init()` con `catch` silencioso.

### 4.4b TOBI 🤖 robot guía (`botSay`, `botGuideView`, `firstName`)
- Widget flotante abajo-derecha: avatar robot CSS (antena pulsante, ojos que parpadean, cuerpo con “T” Tottus) + burbuja con efecto de escritura.
- Saluda al cliente **con su nombre registrado** tras login/demo, y da guía contextual por vista (scanner, carrito, checkout) y por eventos (primer producto, tope del carrito, QR de caja, pase de salida, compra autorizada).
- Clic en el robot reabre el último mensaje; la ✕ lo cierra. Mensajes clave incluyen la explicación de seguridad del QR.

### 4.4c Confeti (`confettiBurst`)
- Canvas overlay propio (`#confettiCanvas`, sin CDN): ~160 partículas verde/blanco/dorado con gravedad y rotación, 4.5 s, respeta `prefers-reduced-motion`. Se dispara en `validateSalida()` junto al mensaje “🎊 ¡Felicidades por tu compra!” de TOBI.

### 4.5 Totales con IGV (`calcTotals`)
```js
total    = Σ(price × qty)            // precios de góndola YA incluyen IGV
subtotal = total / 1.18
igv      = total - subtotal          // 18 %
saving   = Σ((oldPrice - price) × qty)
```

### 4.6 Pago y retiro en 4 pasos (`checkout`, `payNow`, validaciones)
| Paso | UI | Lógica |
|------|----|--------|
| 1 💳 Pago | `#payStep1`: Yape/Plin/Tarjeta + `#cardForm`, `#payTimerHint`, `#btnPayNow` | `payNow()`: valida tarjeta si aplica, crea `order {ticketId, method, totals, items, paySecs}`, vacía carrito, `issueCajaQR()+saveOrder()` |
| 2 🏪 Caja | `#payStep2` (`qr-caja`): canvas + código 6 dígitos + timer 05:00 | `issueCajaQR()` genera `{code, token, exp}`; `validateCaja()` verifica vigencia + código y marca `used` |
| 3 🛡️ Salida | `#payStep3` (`qr-seg`): canvas + código + timer 03:00 | `issueSalidaQR()`; `validateSalida()` autoriza, guarda historial, `clearOrder()` |
| 4 ✅ Listo | `#payStep4`: ticket final + `#btnPrintFinal` | compra cerrada, QRs invalidados (memoria + storage) |

- `openCheckout()`: si hay flujo vigente lo retoma; si no, prepara paso 1. Nav `💳 Pagar` y botón `Pagar desde el celular →` lo invocan.
- `setCheckoutStep(n)`: ilumina `#cp1..cp4`.
- Pre-boleta (`buildPreTicket`) no vacía el carrito; solo el pago exitoso lo vacía.

### 4.7 QR temporal anti-hackeo (ruta de seguridad elegida)
- **Tiempos elegidos:** Caja **5:00** (llegar sin prisa) · Salida **3:00** (tramo corto). Equilibrio entre usabilidad y riesgo de capturas reutilizadas.
- **Doble QR encadenado:** el QR de caja y el pase de salida son **credenciales distintas** (token + código de 6 dígitos nuevos en cada paso). Robar la captura del QR de caja no sirve para salir de la tienda.
- Payload: `TOTTUS|ticketId|CAJA|total|code|token|exp|firma`, firma = `simpleHash(base + QR_SECRET)` (djb2, demo).
- `genToken()` con `crypto.getRandomValues`; `genCode6()` de 6 dígitos.
- Garantías: **expiración** (`tickQr` cada 1 s, canvas en gris + “expirado”), **un solo uso** (`used=true` al validar), **regeneración invalida el anterior**, temporizador `MM:SS` visible.
- **Transparencia con el cliente:** notas 🔒 visibles junto a cada QR + TOBI explica verbalmente por qué caduca, por qué es de un solo uso y a quién debe mostrarse (caja ≠ seguridad).
- Render: `QRCode.toCanvas` (CDN); sin internet → `fallbackQR()` (patrón + token, solo visual demo).

## 5. Modelo de datos (cliente)

```js
PRODUCTS[i] = { id, name, brand, price, oldPrice|null, code, emoji, cat, discount, restricted? }
cart        = { "7750123…": qty }
tottus_user = { name, email, dni, birth, age, isAdult }
order = {
  ticketId, method, total, subtotal, igv, saving, qty, paySecs,
  items: {...cart},
  status: "PAGADO_PENDIENTE_CAJA" | "VALIDADO_CAJA" | "AUTORIZADO",
  caja:   { code, token, exp, used },
  salida: { code, token, exp, used }
}
tottus_order   = order persistido (retomar flujo)
tottus_history = [{ ticketId, date, total, qty, method }] (máx. 20)
```

## 5b. Proceso con Opencode (Sec.5 del informe — reemplaza Google Studio/Firebase)

> Todo el código fue generado solo con **Opencode**, sin Google Studio. Firebase se simula con `localStorage` por alcance 1.5 (un sector + pasarela de prueba).

**Fase 1 — RN02 + tope inicial 205:** prompt `agrega DNI 8 + nacimiento, calcAge/isAdultUser, 2 licores restricted:true, badge +18, MAX_ITEMS 205`. Verificación `node --check app.js`.
**Cambio posterior RN-CAJA-RÁPIDA (tope 40 + modal):** `MAX_ITEMS 205→40`, `saveState()` bloquea guardado del artículo 41, `onScannedCode()` intercepta lectura con `isFastLimitReached(1)`, `#fastLimitModal` con texto exacto + `.modal-overlay/.modal-card` responsive, medido `0.36ms <2s`.
**Fase 2 — Validaciones:** `tottus_order` + `restoreOrderUI()`, `scanT0/payT0` discretos, `btnCheckout` deshabilitado, boleta SUNAT demo + `window.print()`.
**Fase 3 — Experiencia:** `tottus_history`, `beep()` WebAudio, `#cardForm` con validación de formato, `manifest.json + sw.js`.
**Fase 4 — Docs:** actualización de este archivo + texto listo para pegar en el Word del informe.
**Regla de trabajo:** un cambio por vez, diff pequeño, `node --check`, prueba en `http://localhost:8000` (cámara requiere localhost/https).

## 6. Diseño (verde + blanco, dinámico)
- Header degradado verde con brillo animado (`shine`); logo con flotación.
- Login hero verde con burbujas, píldora demo y pasos; formulario con borde superior verde.
- Promo con ticker, mini-pasos 1-4, botón Escanear con anillo pulsante.
- Productos con hover lift; `add-btn` degradado verde.
- QR Caja (borde verde) vs QR Seguridad (degradado + flag) claramente diferenciados.
- Nav inferior flotante redondeado; activo en degradado verde elevado.
- Modal `#fastLimitModal` bloqueante responsive (overlay + card max 420px, `z-index:70`).
- Respeta `prefers-reduced-motion`.

## 7. Cómo ejecutar (demo)

```bash
cd Tottus-Scan-Go
python3 -m http.server 8000
# abrir http://localhost:8000  (localhost/https requerido para la cámara)
```
1. Pulsa **⚡ Entrar sin registro (Demo)**.
2. Agrega productos o usa **📷 Escanear** (o pega un código de “códigos de prueba”).
3. Ve a **🛒 Carrito → Finalizar compra → Pagar desde el celular → Pagar ahora**.
4. Muestra el QR en **Caja → ✅ Validar en Caja**, luego el pase en **Seguridad → Validar salida**.

## 8. Limitaciones conocidas (demo)
- Sin backend: pago, caja y seguridad son simulados; cualquiera puede pulsar “validar”. `localStorage` (`tottus_cart/order/history/user`) es manipulable; en producción usar pasarela real + HMAC/JWT en servidor con nonces.
- Firma QR demo (`simpleHash` + secreto en cliente); tarjeta demo solo valida formato.
- `BarcodeDetector` no existe en todos los navegadores (se usa ingreso manual + beep).
- QR por CDN requiere internet; sin él solo placeholder. SW cachea app shell, no el CDN.

## 9. Trabajo futuro
- [ ] Backend (pasarela Yape/Plin/tarjeta real, API de tickets, validación HMAC en servidor).
- [ ] App de personal (caja/seguridad escanean QR real del cliente).
- [x] Boleta imprimible demo (hecho con `window.print()`); pendiente boleta electrónica SUNAT real en PDF.
- [ ] Catálogo real con imágenes, stock y precios por tienda.
- [x] PWA mínima (hecho `manifest.json + sw.js`); pendiente notificaciones + offline total (CDN QR).

## 10. Pruebas manuales sugeridas
1. Límite 40 (RN-CAJA-RÁPIDA): llena 40 → intenta el 41 por escáner/botón/+ → abre `#fastLimitModal` con texto exacto, no guarda (`saveState()=false`), toast + `beep(false)`. Carrito vacío → `btnCheckout` deshabilitado.
1b. RN02: login 2015 → cerveza `...0136` bloquea 🔞; demo sí deja; badge `+18` visible.
1c. Perf: scan muestra `⏱️ Xs (meta <3s)`; pago muestra `aprobado en Xs (meta ≤60s)`; tarjeta `4111111111111111 12/28 123` ok, `123` falla.
1d. Persistencia: paga → recarga → `🔄 Retomaste tu pago pendiente` con QR redibujado; termina → aparece en Historial; Imprimir abre PDF.
1b. TOBI: entrar con demo → saluda con "Cliente"; registrarse como "María" → saluda con "María".
1c. Confeti: completar flujo caja+salida → lluvia de confeti verde/blanco/dorado + "🎊 ¡Felicidades por tu compra!".
2. IGV: total S/ 118.00 → subtotal S/ 100.00, IGV S/ 18.00.
3. QR caja: esperar 5 min (o forzar `exp` pasado) → “expirado”, regenerar invalida anterior.
4. Reúso: validar caja dos veces → “QR ya usado”.
5. Código erróneo de cajero/seguridad → “incorrecto”.
6. Recargar a mitad del flujo: carrito persiste en `tottus_cart` y `order` persiste en `tottus_order` con QR redibujado (ya no se pierde).
