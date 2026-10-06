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
| O1 | Lector de código de barras desde el celular | ✅ Quagga2 (CDN `@ericblade/quagga2`) + ingreso manual con degradación |
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
┌─────────────┐   Quagga2 (CDN)  ┌───────────────────┐   qrcode@1.5.3 (CDN)
│ styles.css  │   onDetected ──►│ #reader + #scanner │ ◄── con fallback offline
└─────────────┘   render/clear        │ status/manual     │   (QRs de pago) + manifest.json + sw.js (PWA)
```

- **Sin servidor:** toda la lógica corre en el cliente. El “pago”, la “caja” y “seguridad” son simulaciones con botones demo + ingreso manual de 6 dígitos (en producción se reemplazarían por pasarela real y escáner del personal).
- **Vistas SPA:** `login · home · scanner · cart · checkout`, conmutadas con `showView(nombre)` (una visible a la vez).

## 3. Estructura de archivos

| Archivo | Rol | Contenido clave |
|---------|-----|-----------------|
| `index.html` | Estructura + 5 vistas + nav inferior | header, search-bar, `#view-login/home/scanner/cart/checkout`, `#reader`, `#scannerStatus`, `#btnStartCamera/#btnStopCamera`, `#manualCode/#btnManualAdd`, `#codesList`, `#scanResult`, `loginDNI/loginBirth`, `#cardForm`, `#historyCard`, `#payTimerHint`, `#fastLimitModal`, `#qrCajaCanvas`, `#qrSalidaCanvas`, inputs `cajaInput/segInput`, `manifest.json` + `qrcode@1.5.3` + `#quagga2-cdn` (`https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.2/dist/quagga.min.js`) + `app.js` |
| `styles.css` | Diseño mobile-first verde/blanco | variables CSS, animaciones, `.restricted-tag`, `.perf-hint`, `.card-form`, `.hist-list`, `.modal-overlay/.modal-card` responsive, `.scanner-viewport/.scanner-status/.scanner-actions/.scan-result/.codes-list`, estado `:disabled` de botones del escáner, TOBI, confeti, `@media print` (solo ticket) |
| `app.js` | Lógica de negocio | catálogo 14, `calcAge/isAdultUser`, `MAX_ITEMS=40`, `isFastLimitReached/showFastLimitModal`, `scanT0/payT0`, `ORDER_KEY/HISTORY_KEY`, `saveOrder/restoreOrderUI`, `beep()`, escáner Quagga2 `isScannerLibAvailable/updateScannerAvailability/SCANNER_UNAVAILABLE_MSG/startCamera/stopCamera/onScanSuccess/handleQuaggaDetected/onScannedCode/renderCodesHelp` (`window._quaggaRunning`, `scannerRunning`, `window.__quaggaCdnFailed`, `window._quaggaDetectedBound`), validación tarjeta, checkout por pasos, TOBI, confeti |
| `manifest.json` + `sw.js` | PWA mínima | manifest instalable + SW cache-first html/css/js |

## 4. Funcionalidades detalladas

### 4.1 Autenticación (`getUser`, `updateAuthUI`, RN02)
- Bienvenida minimalista (`#view-login`): tarjeta verde con logotipo blanco (`img/Logo_Tottus-blanco.png`, texto blanco + puntos amarillos, transparente y recortada al contenido) y tres botones de ancho completo (`#btnGoLogin` amarillo, `#btnGoRegister` blanco, `#btnDemo` transparente con borde blanco; `min-height:52px`, `max-width:380px` internos). Estado inicial: solo bienvenida visible; ambos formularios con `hidden` + `display:none !important`.
- Apertura por JavaScript con botones `type="button"` (sin `href="#..."`): “Iniciar sesión” oculta el intro y muestra solo `#loginCard`; “Crear cuenta” muestra solo `#loginForm` (titulado “Crear cuenta”); “Volver” (`#btnBackToWelcome` / `#btnBackToWelcomeReg`) restaura la bienvenida, devuelve el foco al botón de origen y limpia el hash vía `history.replaceState` sin recargar. Guardia `window._emailLoginBound` evita listeners duplicados.
- Login por correo (`#emailLoginForm`): solo email + contraseña con etiquetas visibles, toggle 👁️ (`#btnToggleAuthPass`), enlace visual “¿Olvidaste tu contraseña?” (toast, sin recuperación real) y errores bajo cada campo (`.field-error`). Valida formato de email y contraseña no vacía con `preventDefault`; la contraseña nunca se guarda en `localStorage` ni se registra; reutiliza el perfil guardado si el correo coincide (demo local).
- Registro (`#loginForm`): nombre (≥3), email válido, clave (≥4, 👁️), **DNI 8 dígitos** (`/^\d{8}$/`), **fecha nacimiento** obligatoria. `calcAge()` + `isAdult` → guarda `{name, email, dni, birth, age, isAdult}` en `tottus_user`.
- **Botón demo** `#btnDemo` (en el hero): entra como adulto `Cliente Demo` (26 años) sin formularios ni credenciales.
- Menor: header `(menor 🔞)` + bloqueo de licores; sesión persistente; “Salir” borra usuario, detiene cámara y timer QR.

### 4.2 Catálogo y ofertas (`renderProducts`, RN02)
- 14 productos demo (12 base + 2 licores `restricted:true`: Cristal `...0136`, Borgoña `...0143`).
- `discount = round((1 - price/oldPrice)*100)`; etiqueta `-%` + badge `+18` (`.restricted-tag`) y nota `🔞 Venta solo mayores de 18`.
- `addToCart()` bloquea licor si `!isAdultUser()` con toast RN02. Buscador + filtros `Todo / Ofertas`.

### 4.3 Lector de barras (`Html5QrcodeScanner` por CDN + ingreso manual, RNF02 + RN-CAJA-RÁPIDA)
- **Carga externa (sin copia local, sin npm):** `index.html` carga `<script id="html5qrcode-cdn" src="https://unpkg.com/html5-qrcode" onerror="window.__html5QrcodeCdnFailed=true">` antes de `app.js`. **No existe copia local** de `html5-qrcode` ni instalación por npm; si el CDN no responde, el escáner queda fuera de servicio y la app sigue funcionando con ingreso manual.
- **Disponibilidad antes de usar:** `isScannerLibAvailable()` retorna `false` si `window.__html5QrcodeCdnFailed` está marcado o si `typeof window.Html5QrcodeScanner === "undefined"`. `updateScannerAvailability()` (llamada en `init()` sin bloquear el resto) deshabilita solo `#btnStartCamera` / `#btnStopCamera` (`disabled = !available`), muestra en `#scannerStatus` el mensaje `SCANNER_UNAVAILABLE_MSG` (“El escáner no está disponible. Puedes ingresar el código manualmente.”) y, si el fallo llega con el escáner activo (`scannerRunning`), invoca `stopCamera()` para liberar la cámara y limpiar `#reader`. Con la librería disponible y sin lectura en curso, restaura `#scannerStatus` a “Cámara detenida”. El script también suscribe una sola vez el evento `error` de `#html5qrcode-cdn` (guarda `_scanGoErrorBound`) para degradar en caliente.
- **Inicialización (`startCamera`, vía `#btnStartCamera`):** con guarda `if (scannerRunning) return` (sin inicializaciones múltiples ni listeners duplicados: `init()` suscribe cada botón una sola vez); verifica `isScannerLibAvailable()` y, si no está disponible, llama `updateScannerAvailability()` + `toast("⚠️ Cámara no disponible, usa código manual")` sin crear el objeto (evita `Html5QrcodeScanner is not defined`). Si está disponible, crea `new window.Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false)`, guarda en `window._html5QrcodeScanner`, marca `scannerRunning = true`, fija `scanT0 = performance.now()` y muestra “📷 Apunta al código de barras...”. Luego invoca `render(onScanSuccess, onScanFailure)` sobre el contenedor `#reader` (`#view-scanner`).
- **Lectura exitosa (`onScanSuccess(decodedText)` → `onScannedCode`):** hace `clear()` del lector, pone `scannerRunning = false`, limpia `window._html5QrcodeScanner`, muestra “✅ Código leído” en `#scannerStatus` y delega en `onScannedCode(decodedText)` (misma vía que el ingreso manual: valida tope 40, `addToCart()`, `beep()`, pinta `#scanResult`). El `catch()` del `clear()` también restablece el estado y procesa el código.
- **Errores:**
  1. *Fallo de carga del CDN:* `onerror` marca `window.__html5QrcodeCdnFailed` (+ listener `error` en `init()`); `updateScannerAvailability()` deshabilita escaneo y avisa en `#scannerStatus`.
  2. *Librería ausente en el global:* `isScannerLibAvailable() === false`; `startCamera()` retorna temprano con toast, sin `new`.
  3. *Permiso de cámara rechazado / cámara no disponible:* caen al `catch` de `startCamera()`; si la librería sí cargó, `#scannerStatus` muestra “⚠️ No se pudo abrir la cámara. Usa ingreso manual.” + toast; siempre se limpia `#reader`.
  4. *Error durante la inicialización:* mismo `catch`: `scannerRunning = false`, `window._html5QrcodeScanner = null`, `#reader` vaciado, `updateScannerAvailability()` refleja el estado real; sin reintentos automáticos.
  5. *Errores por frame:* `onScanFailure(error)` los ignora a propósito para no saturar la UI.
  6. *Lectura inválida o no reconocida:* `onScannedCode()` → `addToCart()` con `toast("❌ Código no encontrado: " + code)`; con tope 40 muestra `⛔ Límite de 40 alcanzado` + `#fastLimitModal` + `beep(false)` sin insertar.
  7. *Cierre y limpieza (`stopCamera`, vía `#btnStopCamera`):* `await active.clear()` si existe `window._html5QrcodeScanner`, `scannerRunning = false`, `#reader` vaciado y, solo si `#view-scanner` está visible, `#scannerStatus` vuelve a “Cámara detenida”. `showView(name)` lo invoca al salir del scanner; el cierre de sesión también lo invoca.
  8. *Alternativa manual (siempre operativa):* `#manualCode` + `#btnManualAdd` → `onScannedCode(code)` con `scanT0` para el cronómetro; `#codesList` (vía `renderCodesHelp()`) ofrece los códigos de prueba del catálogo; el resultado se pinta en `#scanResult`. El ingreso manual nunca se deshabilita por el estado del CDN.
- **Perf RNF02:** `scanT0 = performance.now()` al iniciar cámara o al pulsar manual; `onScannedCode()` muestra `⏱️ Xs (meta <3s ✅/⚠️)` discreto en verde (`.perf-hint`) + `beep()` (880Hz ok / 220Hz error).
- **Intercepción tope 40:** `onScannedCode()` valida `isFastLimitReached(1)` antes de `addToCart()`; si es el artículo 41 muestra `⛔ Límite de 40 alcanzado` + abre `#fastLimitModal` y no inserta.
- Nota histórica: la implementación anterior basada en `BarcodeDetector` + `getUserMedia()` directo (sondeo ~400 ms) fue reemplazada por `Html5QrcodeScanner`; ya no es la vía vigente.

### 4.3b Lector Quagga2 horizontal (vigente desde 2026-10-06; reemplaza 4.3)
- **Motivo:** `Html5QrcodeScanner` generaba su propia interfaz (`Select Camera`, `Stop Scanning`, marco cuadrado QR, visor vertical). Se eliminó `html5-qrcode` (CDN `https://unpkg.com/html5-qrcode`, `Html5QrcodeScanner`, `Html5Qrcode`, `Html5QrcodeSupportedFormats`) y se migró a **Quagga2** (`window.Quagga`), especializado en barras 1D y sin interfaz automática.
- **Carga (sin copia local, sin npm):** `index.html` carga `<script id="quagga2-cdn" src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.2/dist/quagga.min.js" onerror="window.__quaggaCdnFailed=true">` antes de `app.js`. `isScannerLibAvailable()` retorna `false` si `window.__quaggaCdnFailed` o si `typeof window.Quagga === "undefined"`.
- **Diagnóstico HTTPS (Fase 1, intacto):** `getScannerDiagnosis()` solo lee `window.isSecureContext`, `navigator.mediaDevices`, `getUserMedia`, `window.Quagga`, `window.__quaggaCdnFailed`. Con `isSecureContext === false` no se abre la cámara y `#scannerStatus` muestra el mensaje HTTPS; el ingreso manual sigue activo. `classifyScannerError()` distingue permiso rechazado, cámara en uso (`NotReadableError/TrackStartError`), sin cámara y fallo CDN.
- **Configuración (`buildQuaggaConfig()`):** `inputStream { type: "LiveStream", target: #reader, constraints: { facingMode: "environment", width ≥320, height ≥240 }, area: { top: "35%", right: "8%", bottom: "35%", left: "8%" } }`, `locator { patchSize: "medium", halfSample: true }`, `decoder { readers: [ean_reader, ean_8_reader, upc_reader, upc_e_reader, code_128_reader], multiple: false }` (sin QR), `locate: true`, `frequency: 10`.
- **Botones:** `#btnStartCamera` → `Quagga.init()` + `Quagga.start()` (permiso solo aquí, sin auto-apertura, botón deshabilitado durante la inicialización); `#btnStopCamera` → `Quagga.stop()` + `offDetected()` + vaciado de `#reader` + botones restablecidos. `showView()` y cierre de sesión invocan `stopCamera()`.
- **Un solo listener:** `ensureQuaggaDetectedListener()` registra `handleQuaggaDetected` una sola vez (`window._quaggaDetectedBound`); `detachQuaggaDetectedListener()` lo retira con `offDetected()` al detener o confirmar.
- **Estabilidad (dos lecturas):** `handleQuaggaDetected` extrae `result.codeResult.code` (+ `format`) y delega en `onScanSuccess()`, que normaliza a string (conserva ceros, sin `Number`, sin autocorrección), exige numérico 6–14 dígitos, valida EAN-13 de 13 dígitos (los códigos registrados del catálogo se aceptan tras doble lectura) y requiere **dos detecciones idénticas** en `1800 ms` (`scanCandidate/scanCandidateCount`); si cambia un dígito reinicia. Sin aviso de “no encontrado” antes de confirmar; el confirmado se procesa una sola vez (`scanProcessing` + `lastConfirmedCode` 3000 ms).
- **Resultado:** registrado exacto → `onScannedCode()` → `addToCart(code, 1)` una vez + `Producto agregado: [nombre]` + detención; desconocido confirmado → `Código leído correctamente, pero no registrado: [código]`, sin agregar. `scanT0` inicia tras `start()` y el tiempo real se muestra con meta `<3s`.
- **Visor horizontal (`styles.css`):** `#reader` 100% × 260px (`max-height: 300px`, `aspect-ratio: 4/3`, `radius: 16px`, `#111`); video/canvas Quagga2 al 100% con `object-fit: cover` absoluto; guía propia `::before` (85% × 90px ≈3:1, borde blanco 3px) + línea central `::after` (verdes, `pointer-events: none`); texto externo `Alinea todas las barras dentro del rectángulo`; ingreso manual debajo; sin scroll horizontal.
- **Zoom:** `applyModerateZoom()` solo si el track expone `zoom` (objetivo 1.4), sin fallar ni forzar enfoque.

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
- **Posición (solo CSS, sin JS):** `.bot-widget` en `bottom:120px !important; right:30px !important` para quedar sobre la barra inferior; en `@media (min-width:700px)` pasa a `bottom:120px !important; right:max(30px, calc(50% - 310px)) !important` para no recortarse en escritorio. `.bot-bubble` con `margin-right:10px` y tope `min(260px, calc(100vw - 70px))`; cola `.bot-bubble::after` en `right:25px` para apuntar al centro de la cabeza.
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
- TOBI posicionado sobre la barra inferior (`bottom:120px`, `right:30px`; escritorio `max(30px, calc(50% - 310px))`), burbuja con `margin-right:10px` y cola en `right:25px` sin desborde móvil.
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
- Escáner Quagga2 exclusivamente por CDN (`https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.2/dist/quagga.min.js`, sin copia local ni npm): requiere internet y permiso de cámara; si el CDN falla, el escaneo se deshabilita con el aviso en `#scannerStatus` y se continúa por ingreso manual (`#manualCode/#btnManualAdd`) + `beep()`. El SW cachea el app shell, no el CDN.
- QR de pago por CDN (`qrcode@1.5.3`) requiere internet; sin él solo placeholder (`fallbackQR()`). SW cachea app shell, no los CDN.

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
7. Fallback del lector: con CDN disponible `#btnStartCamera/#btnStopCamera` habilitados y `#manualCode/#btnManualAdd` operativo; simulando CDN caído (`window.__quaggaCdnFailed = true` o bloqueo de `https://cdn.jsdelivr.net/npm/@ericblade/quagga2`), `#scannerStatus` muestra “El escáner no está disponible. Puedes ingresar el código manualmente.”, los botones de cámara quedan `disabled`, el ingreso manual sigue agregando y el catálogo/carrito/TOBI no se afectan.

## Historial de cambios técnicos

### Actualización del lector y fallback manual (2026-10-03)
- Se reemplazó la implementación basada en `BarcodeDetector` y `getUserMedia()` directo por `Html5QrcodeScanner` (`new window.Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false)` + `render(onScanSuccess, onScanFailure)`).
- La librería `html5-qrcode` se carga exclusivamente mediante CDN (`<script id="html5qrcode-cdn" src="https://unpkg.com/html5-qrcode">` en `index.html`).
- No se añadió copia local ni dependencia instalada mediante npm.
- Flujo actualizado: la página intenta cargar el CDN → `isScannerLibAvailable()` comprueba `window.__html5QrcodeCdnFailed` y `window.Html5QrcodeScanner` → si está disponible, `updateScannerAvailability()` habilita `#btnStartCamera/#btnStopCamera` y `startCamera()` inicializa el lector en `#reader`; el código detectado se procesa con `onScannedCode()` → `addToCart()`; `stopCamera()` hace `clear()`, vacía `#reader` y restaura “Cámara detenida”.
- Se añadió validación previa antes de inicializar el escáner y manejo de `onerror` del script (`window.__html5QrcodeCdnFailed`) más suscripción única al evento `error` en `init()`.
- Si el CDN falla, la app no crea `Html5QrcodeScanner` (evita `Html5QrcodeScanner is not defined`), deshabilita solo la función de escaneo, muestra “El escáner no está disponible. Puedes ingresar el código manualmente.” en `#scannerStatus` y mantiene habilitado el ingreso manual (`#manualCode`, `#btnManualAdd`, `#codesList`, `#scanResult`).
- Un fallo del lector no bloquea catálogo, carrito, TOBI ni checkout: `init()` evalúa la disponibilidad sin condicionar `renderAll()`/`updateAuthUI()`.

### Bienvenida minimalista y acceso por pasos (2026-10-04)
- La vista inicial muestra solo la tarjeta verde (logo blanco `img/Logo_Tottus-blanco.png`, etiqueta, título, descripción, 3 beneficios) y los botones “Iniciar sesión” / “Crear cuenta” / “Probar demo” a ancho completo (`52px`, `gap:12px`, `max-width:380px`).
- Se eliminaron el botón “Comenzar compra” (`href="#loginForm"`) y la tarjeta blanca de beneficios; cada formulario se abre solo por JS en la misma pantalla (login `#loginCard`, registro `#loginForm`), sin redirigir ni recargar.
- Corrección de visibilidad inicial: `.auth-card { display:grid }` vencía al atributo `hidden`; se añadieron reglas `#loginCard[hidden]` / `#loginForm[hidden] { display:none !important }` y limpieza del hash (`#loginForm`/`#registerForm`) con `history.replaceState` al iniciar y al volver.
- Logotipos: `img/Logo_Tottus.png` (320×320 con 135 px transparentes arriba/abajo, 0 píxeles blancos; el blanco era solo CSS) → recorte `img/Logo_Tottus-cropped.png` (304×66) → variante blanca `img/Logo_Tottus-blanco.png` (verdes a blanco, amarillos conservados). Bienvenida usa la variante blanca sin fondos/cápsulas (`190px/65vw`, `170px` móvil, `200px` escritorio); cabecera conserva el original.

### Migración del lector a Quagga2 horizontal (2026-10-06)
- Diagnóstico HTTPS: `getScannerDiagnosis()` + `classifyScannerError()` (mensajes HTTPS/CDN/permiso/sin cámara/cámara en uso); en HTTP local no se abre la cámara y el ingreso manual sigue activo.
- Cámara trasera preferente (`facingMode: environment`, `fps: 10`), sin auto-apertura, una sola instancia, `scanT0` real con meta `<3s`.
- Estabilidad EAN: normalización a string, doble lectura idéntica (`1800 ms`), validación EAN-13, procesamiento único, mensajes `Producto agregado: [nombre]` / `Código leído correctamente, pero no registrado: [código]`.
- Reemplazo total de `html5-qrcode` por Quagga2 (`quagga2-cdn`, `Quagga.init/start/stop`, un `onDetected` + `offDetected`); visor `#reader` 100% × 260px con guía 85% × 90px y área central `35%/8%/35%/8%`.
- `node --check app.js` OK; cero referencias activas a `Html5Qrcode*` en `index.html`/`app.js`.
