# Tottus Scan & Go — Documentación Técnica

> App web móvil para la cadena de supermercados **Tottus**: el cliente escanea productos con su celular, paga desde el navegador, valida su compra en **Caja** y su salida con **Seguridad** mediante **QR temporales anti-captura**, guiado en todo momento por **TOBI 🤖**, el robot asistente de la marca.

- **Stack:** HTML + CSS + JavaScript puros (archivos independientes, sin framework ni backend). Todo el código fue generado con **Opencode** (sin Google Studio).
- **Persistencia:** `localStorage` del navegador (demo académica). Simula las colecciones Firebase `Cliente/Producto/Carrito/Sesion` exigidas en el informe (alcance 1.5: un sector + pasarela de prueba).
- **Paleta:** verde + blanco + amarillo suave (`--green: #40a629`, `--green-deep: #01855d`, `--yellow: #feeb15`, fondo `#f5f7f4`). `index.html` + `styles.css` se mantienen como base, solo se extiende.
- **Extras UX:** TOBI (robot guía con burbuja parlante + saludo animado), chat propio con Tobi (respuestas por reglas, sin IA), confeti al finalizar la compra, login con ver/ocultar contraseña + DNI/edad (RN02).

> **Nota de vigencia (2026-10-22):** el carrito, la orden/boleta y el historial local ya **no** usan las claves globales `tottus_cart`, `tottus_order` ni `tottus_history`. Desde `e041871` se usan `tottus_cart_demo` / `tottus_cart_real_<id>`, `tottus_order_demo` / `tottus_order_real_<id>` y `tottus_demo_history`; las claves globales antiguas se conservan intactas sin migrar. Las referencias históricas de §2, §3, §4.4, §4.4d, §5 y §8 se mantienen como registro, pero el comportamiento vigente está en **§4.9**, **§4.3e** y en el historial de cambios «Aislamiento demo ↔ cliente real» (2026-10-21).

---

## 1. Objetivos

| ID | Objetivo | Estado |
|----|----------|--------|
| O1 | Lector de código de barras desde el celular | ✅ Quagga2 (CDN `@ericblade/quagga2`) + ingreso manual con degradación |
| O2 | Carrito virtual (máx. 40 productos, compra rápida) | ✅ `MAX_ITEMS=40` con barra de progreso, bloqueo y modal a caja tradicional |
| O15 | RN-CAJA-RÁPIDA: tope 40 + modal bloqueante | ✅ `isFastLimitReached/showFastLimitModal` + `#fastLimitModal` responsive; validación+render+total <2s |
| O3 | IGV 18 % desglosado (precios incluyen IGV) | ✅ `Subtotal = Total / 1.18` |
| O4 | Inicio de sesión real + acceso demo + RN02 edad | ✅ correo/contraseña contra `POST /api/clientes/login` + alta real; demo solo con `#btnDemo`; DNI 8 dígitos + fecha de nacimiento en el registro; `calcAge/isAdultUser` |
| O5 | Catálogo con descuentos visibles | ✅ 14 productos, etiquetas `-%`, badge `+18`, filtro Ofertas, buscador |
| O6 | Pago desde el celular (meta ≤60s) | ✅ simulado (Yape / Plin / Tarjeta con form demo) + cronómetro `payT0` |
| O11 | RN02 bloqueo licores <18 | ✅ `restricted:true` + toast 🔞 + `(menor 🔞)` en header |
| O12 | RNF02 scan <3s visible + order persistente | ✅ `scanT0` en `scanResult` + `tottus_order_demo` / `tottus_order_real_<id>` con `restoreOrderUI()` |
| O13 | Ticket imprimible + historial + beep | ✅ `window.print()` + historial remoto por cliente / `tottus_demo_history` (20) + WebAudio 880/220Hz |
| O14 | PWA mínima offline | ✅ `manifest.json` + `sw.js` (cache html/css/js) |
| O7 | Confirmación en Caja + confirmación de salida con Seguridad | ✅ doble validación |
| O8 | QR con tiempo límite anti-hackeo | ✅ 5:00 caja + 3:00 salida, un solo uso |
| O9 | Robot guía TOBI (saludo por nombre + ayuda contextual) | ✅ `botSay()` por vista/evento |
| O10 | Celebración con confeti “¡Felicidades por tu compra!” | ✅ canvas propio, sin CDN |
| O16 | Saludo animado de TOBI + saltito “ábreme” | ✅ `.tobi-greet` al abrir (2.6 s) + `.tobi-nudge` cada 7 s hasta el primer press; respeta `prefers-reduced-motion` |
| O17 | Chat propio con Tobi (vista aparte, sin límite) | ✅ `#view-tobi` + `tobi-chat.js` (`getTobiReply`), typing, scroll auto, Enter |
| O18 | Historial de conversaciones del chat | ✅ `tobi-history.js`, claves `tobi_chat_*`, tope 30 convos / 200 msgs |
| O19 | Saludo con nombre 1×/visita en el chat | ✅ `getUserName()` (`tottus_user` o “Cliente”) + `sessionStorage` |
| O20 | Registro de alergias en el perfil | ✅ `tobi-profile.js`, claves `tobi_profile_*`, pantalla “Mis alergias” |
| O21 | Productos frecuentes en el perfil | ✅ `tobiFrequent*`, pantalla “Mis productos”, cruce con catálogo |
| O22 | Recetas saludables con filtro estricto de alergias | ✅ `tobi-recipes.js` (27 recetas) + `tobiRecipesFor()` |
| O23 | Descuentos del día | ✅ `tobi-discounts.js` (8 promos demo) + `tobiDiscountsToday()` (Lima) |
| O24 | Comprensión de preguntas (sin IA) | ✅ `tobiCanon` (tipeos/sinónimos) + `tobiFollowUp` + fallback con 3 botones |
| O25 | Alerta de alergia en catálogo/carrito | ✅ `tobi-allergens.js` (tabla 14 productos) + modal Agregar igual/No agregar |
| O26 | Lista de compras desde receta + sugerencias rápidas | ✅ `tobi_profile_shopping` (tope 50) + fila contextual máx. 4 |

## 2. Arquitectura

```
┌─────────────┐     eventos DOM      ┌──────────┐    localStorage   ┌──────────────┐
│ index.html  │ ◄──────────────────► │ app.js   │ ◄───────────────► │ tottus_user  │
│ (6 vistas)  │                      │ (lógica) │                   │ tottus_cart_* │
└──────┬──────┘                      └──────────┘                   │ tottus_order_*│
       │ CSS verde/blanco + animaciones        ▲ cámara + QR        │ tottus_*history│
       ▼                                       │                   └──────────────┘
┌─────────────┐   Quagga2 (CDN)  ┌───────────────────┐   qrcode@1.5.3 (CDN)
│ styles.css  │   onDetected ──►│ #reader + #scanner │ ◄── con fallback offline
└─────────────┘   render/clear        │ status/manual     │   (QRs de pago) + manifest.json + sw.js (PWA)
```

**Módulos TOBI (carga en orden tras `app.js`, sin dependencias entre sí salvo `tobi-chat.js` que los usa si existen):**
```
app.js → tobi-allergens.js → tobi-discounts.js → tobi-recipes.js →
tobi-profile.js → tobi-history.js → tobi-chat.js
```
- `tobi-chat.js` nunca modifica `app.js`: reutiliza sus globales solo con guardas (`typeof showView/stopCamera/botClose/toast === "function"`).
- El SW (`tottus-scan-go-v11`, cache-first) precachea el app shell + los 6 `tobi-*.js`.

- **SPA con backend PERN:** el frontend concentra la interfaz y la lógica de cliente, pero catálogo, autenticación (registro/login por correo), historial y órdenes consumen la API Node/Express/PostgreSQL vía `API_BASE_URL`. El “pago”, la “caja” y “seguridad” siguen siendo simulaciones con botones demo + ingreso manual de 6 dígitos (en producción se reemplazarían por pasarela real y escáner del personal).
- **Vistas SPA:** `login · home · scanner · cart · checkout · tobi`, conmutadas con `showView(nombre)` (una visible a la vez; la vista `tobi` la conmuta `tobi-chat.js` reutilizando `showView` para volver).

## 3. Estructura de archivos

| Archivo | Rol | Contenido clave |
|---------|-----|-----------------|
| `index.html` | Estructura + 6 vistas + nav inferior | header, search-bar, `#view-login/home/scanner/cart/checkout/tobi`, `#reader`, `#scannerStatus`, `#btnStartCamera/#btnStopCamera`, `#manualCode/#btnManualAdd`, `#codesList`, `#scanResult`, `loginDNI/loginBirth`, `#cardForm`, `#historyCard`, `#payTimerHint`, `#fastLimitModal`, `#qrCajaCanvas`, `#qrSalidaCanvas`, inputs `cajaInput/segInput`, panel `#botWidget` (`#btnTobiChat`), paneles del chat (`#tobiHistoryPanel`, `#tobiAllergyPanel`, `#tobiFrequentPanel`, `#tobiRecipePanel`, `#tobiDiscountPanel`, `#tobiShoppingPanel`, `#tobiSuggest`), `manifest.json` + `qrcode@1.5.3` + `#quagga2-cdn` (`https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.2/dist/quagga.min.js`) + `app.js` + 6 `tobi-*.js` |
| `styles.css` | Diseño mobile-first verde/blanco | variables CSS, animaciones, `.restricted-tag`, `.perf-hint`, `.card-form`, `.hist-list`, `.modal-overlay/.modal-card` responsive, `.scanner-viewport/.scanner-status/.scanner-actions/.scan-result/.codes-list`, estado `:disabled` de botones del escáner, TOBI (`.tobi-greet`, `.tobi-nudge`, `.tobi-greet-arm`), burbujas del chat (`.chat-msg`), paneles (`.tobi-history-*`, `.tobi-recipe-*`), fila de sugerencias (`.tobi-suggest`), badge de alérgenos (`.tobi-allergen-badge`), confeti, `@media print` (solo ticket) |
| `app.js` | Lógica de negocio | catálogo 14, `calcAge/isAdultUser`, `MAX_ITEMS=40`, `isFastLimitReached/showFastLimitModal`, `scanT0/payT0`, `claveCarritoActual/claveOrdenActual`, `identidadActiva`, `limpiarHistorialRemoto/limpiarBoletaVisible`, instrumentación temporal `[scan-perf]`, `saveOrder/restoreOrderUI`, `beep()`, escáner Quagga2 `isScannerLibAvailable/updateScannerAvailability/SCANNER_UNAVAILABLE_MSG/startCamera/stopCamera/onScanSuccess/handleQuaggaDetected/onScannedCode/renderCodesHelp` (`window._quaggaRunning`, `scannerRunning`, `window.__quaggaCdnFailed`, `window._quaggaDetectedBound`), validación tarjeta, checkout por pasos, TOBI (`botSay/botClose`, saludo `tobiGreetOnOpen` 2.6 s, saltito `tobiNudgeStart` cada 7 s + primer aviso 3.5 s hasta `_tobiPressedOnce`), confeti |
| `tobi-chat.js` | Chat propio (controlador + respuestas por reglas) | `getTobiReply(text)` + `getTobiReplyNamed(text, ctx)`, comprensión `tobiCleanText/tobiCanon/TOBI_TYPO_MAP/tobiFollowUp/tobiGuessChips/tobiSmartFallback`, `sendMsg/addMsg` (typing, scroll auto, Enter), historial UI, flujos alergias/frecuentes, intents recetas/descuentos, lista de compras, sugerencias (`renderTobiSuggest`, máx. 4) |
| `tobi-history.js` | Historial del chat + nombre | `getUserName()` (`tottus_user` o “Cliente”), guardar/listar/abrir/borrar (`tobiHistory*`), saludo 1×/visita (`tobiGreetedThisVisit/tobiMarkGreeted`) |
| `tobi-profile.js` | Perfil: alergias, frecuentes y lista de compras | `tobiProfile*` (alergias), `tobiFrequent*` + `tobiFrequentInCatalog()`, `tobiShopping*` (tope 50) |
| `tobi-recipes.js` | 27 recetas + filtro de seguridad | `TOBI_RECIPES`, `TOBI_ALLERGEN_GROUPS`, `tobiRecipesFor()` (exclusión estricta + alerta por texto + ranking) |
| `tobi-discounts.js` | 8 descuentos demo + vigentes hoy | `TOBI_DISCOUNTS`, `tobiLimaToday()` (America/Lima), `tobiDiscountsToday()` |
| `tobi-allergens.js` | Tabla de alérgenos del catálogo + alerta | `TOBI_PRODUCT_ALLERGENS` (14 productos), `tobiProductClash()`, envoltura de `addToCart` con modal, badges vía `MutationObserver` |
| `manifest.json` + `sw.js` | PWA mínima | manifest instalable + SW cache-first (`tottus-scan-go-v12`: app shell + 6 `tobi-*.js`) |

## 4. Funcionalidades detalladas

### 4.1 Autenticación (`getUser`, `updateAuthUI`, RN02)
- Bienvenida minimalista (`#view-login`): tarjeta verde con logotipo blanco (`img/Logo_Tottus-blanco.png`, texto blanco + puntos amarillos, transparente y recortada al contenido) y tres accesos: el ícono circular «G» (`#btnGoogleAccess`, Google «próximamente»), `#btnGoLogin` amarillo («Iniciar sesión») y `#btnDemo` transparente con borde blanco («Ver demostración»); `min-height:52px`, `max-width:380px` internos. Estado inicial: solo bienvenida visible; los formularios de login (`#loginCard`) y registro (`#loginForm`) con `hidden` + `display:none !important`.
- Apertura por JavaScript con botones `type="button"` (sin `href="#..."`): “Iniciar sesión” oculta el intro y muestra solo `#loginCard`; “Crear cuenta” muestra solo `#loginForm` (titulado “Crear cuenta”); “Volver” (`#btnBackToWelcome` / `#btnBackToWelcomeReg`) restaura la bienvenida, devuelve el foco al botón de origen y limpia el hash vía `history.replaceState` sin recargar. Guardia `window._emailLoginBound` evita listeners duplicados.
- Login real (`#emailLoginForm`): correo + contraseña con etiquetas visibles, toggle 👁️ (`#btnToggleAuthPass`), enlace visual “¿Olvidaste tu contraseña?” (toast; recuperación aún no implementada) y errores bajo cada campo (`.field-error`). Normaliza el correo con trim + lowercase, valida formato y contraseña no vacía, deshabilita el submit y muestra “Iniciando sesión…” en `#authStatus`. Envía `POST ${API_BASE_URL}/api/clientes/login` y solo acepta la sesión con HTTP OK, `success:true` e `id` entero > 0. Un 400/401/500 o un error de red muestra un mensaje controlado y **no** entra a la demo.
- Registro real (`#loginForm`): nombre (≥3), correo, clave (≥4, 👁️), confirmación, **DNI 8 dígitos** (`/^\d{8}$/`) y **fecha de nacimiento** obligatoria. Envía `POST ${API_BASE_URL}/api/clientes/registro` con `{ nombre, dni, correo, password, passwordConfirm, fechaNacimiento }`; un 201 con `id` válido guarda la sesión real, limpia todos los campos (incluidas ambas contraseñas) e informa “Cuenta creada correctamente”. Un 400/409 o error de red conserva el formulario y muestra el mensaje controlado.
- **El DNI es solo un dato de registro:** el formulario visible de ingreso por DNI (`#dniLoginForm`, `#dniLogin`, `#btnDniLogin`, `ingresarConDni()`) fue retirado de la interfaz en la Fase 5. `POST /api/clientes/dni` permanece en el backend por compatibilidad, pero ya no se usa como autenticación.
- **Botón demo** `#btnDemo` («Ver demostración», en el hero): **única vía** para entrar al modo de prueba **solo en memoria** (`demoMode`), etiquetado con el distintivo permanente «Modo demostración» (`#demoBadge`), sin formularios, sin credenciales y sin crear perfil de cliente. El login por correo ya no invoca `enterDemo()`.
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
- **Resultado:** registrado exacto → `onScannedCode()` → `addToCart(code, 1)` una vez + `Producto agregado: [nombre]` + detención y retorno al estado inactivo; desconocido confirmado → `Código de barras no registrado: [código]` vía `textContent` (`SCANNER_UNKNOWN_MSG + " " + code`, inserción segura sin HTML dinámico, código como texto con ceros intactos), sin agregar. Cámara y manual comparten `onScannedCode()`. `scanT0` inicia tras `start()` y el tiempo real se muestra con meta `<3s` en el flujo exitoso.
- **Visor horizontal (`styles.css` + `index.html` + `app.js`):** `#reader` 100% × 260px (`max-height: 300px`, `aspect-ratio: 4/3`, `radius: 16px`, `#111`) con `hidden` inicial (sin bloque negro ni altura reservada en inactivo); video/canvas Quagga2 al 100% con `object-fit: cover` absoluto; guía propia `::before` (85% × 90px ≈3:1, borde blanco 3px) + línea verde `::after`, ambos con `opacity: 0` y visibles solo con `#reader.is-active` (`scannerIn` 0.32s opacidad + desplazamiento vertical; `scanLine` 2.2s contenida ±34px dentro del marco; respeta `prefers-reduced-motion` global); hint inactivo `#scannerIdleHint` (“La cámara está desactivada. Presiona Activar cámara para comenzar.”) visible solo con cámara apagada; `#scanAlignHint` (`hidden`) visible solo con cámara activa; ingreso manual debajo; sin scroll horizontal. Ver §4.3c–§4.3d.
- **Zoom:** `applyModerateZoom()` solo si el track expone `zoom` (objetivo 1.4), sin fallar ni forzar enfoque.

### 4.3c Estados visuales del lector (solo presentación, sin cambiar la lógica Quagga2)
- **Inactivo (al entrar a “Escanear”):** `#reader[hidden]` (`display: none`, sin visor negro, marco, línea ni animación, sin bloque vacío), `#scanAlignHint[hidden]`, `#scannerIdleHint` visible, `Activar cámara` habilitado (si hay librería) y `Detener` deshabilitado (`opacity: .55`, scopado a `#view-scanner`).
- **Activación:** `startCamera()` mantiene solicitud de permiso e `init/start`; durante el arranque muestra `SCANNER_STARTING_MSG` (“Iniciando cámara...”) en `#scannerStatus`, deshabilita ambos botones (anti doble-clic) y mantiene el visor oculto; solo tras `Quagga.start()` exitoso aplica `setScannerVisual(true)` (`hidden = false` + `is-active` con `scannerIn`), muestra marco + línea animada y deja `Activar` deshabilitado / `Detener` habilitado. Formatos EAN/UPC/CODE-128 y cámara trasera intactos; sin `setTimeout` nuevo para estado; sin listeners/HTML duplicados.
- **Detención:** `stopCamera()` ejecuta el flujo actual (`Quagga.stop()` + `offDetected()` + vaciado de `#reader`), quita `is-active` (detiene la línea al instante), oculta el visor y restaura el estado inicial con hint visible. Tras una lectura confirmada (`releaseAndFinish`) también se oculta el visor sin alterar `onScannedCode()` → `addToCart()`. Reactivar no crea instancias ni listeners extra (guardas `scannerRunning/scannerInitializing/_quaggaDetectedBound`).
- **Errores:** sin visor activo ni línea verde; botones a inactivo; ingreso manual siempre disponible; mensajes existentes (`classifyScannerError()` + `toast`), sin mensajes técnicos inventados.

### 4.3d Simplificación de textos del lector (solo `index.html` + `styles.css`)
- Eliminados los dos párrafos informativos bajo el título (“Coloca todas las barras dentro del marco horizontal.” y “Mantén el código quieto, bien iluminado y a una distancia de 15 a 25 cm.”); no aparecen ni apagado ni activo. Se conservan título, `#scannerIdleHint` (solo apagada), `#scanAlignHint` (solo activa), `.scanner-viewport`/`#scannerStatus`, botones e ingreso manual.
- Ajuste visual mínimo scopado a `#view-scanner`: `.scanner-card > h2 { margin: 0 0 6px }` + `.scanner-idle-hint { margin: 2px 0 10px }`; sin cambios de colores, tamaños generales, responsive ni animaciones; sin contenedores vacíos (los `<p>` usaban clases genéricas `.muted`, sin estilos exclusivos que limpiar).

### 4.3e Instrumentación temporal de rendimiento del lector (`[scan-perf]`, 2026-10-21)
> Instrumentación **temporal** de la Fase 5C (`5be1b76`). Solo memoria y consola; no persiste, no llama al backend y no incluye EAN, producto, identidad ni datos personales. **No debe retirarse hasta terminar todas las pruebas (Fase 6D).**

- Un único contexto por ciclo de lectura (`scanPerfCtx`) con `scanId`, `mode`, hitos y `httpStatus`; un ciclo anterior sin emitir se cierra como `scan_restarted`.
- Funciones: `beginScanPerf()` (al iniciar cámara), `markScanPerf(field)`, `markScanPerfToken(token, field)` (solo si el token es el contexto vigente, para que una lectura manual concurrente no contamine el ciclo de cámara), `setScanPerfHttpStatus(token, status)`, `scanPerfReadingActive()`, `emitScanPerf({ success, errorStage })` y `abortScanPerf(errorStage)`.
- Hitos: `openAt` → `readyAt` (tras `Quagga.start()`) → `decodeAt` (`onScanSuccess`) → `lookupStartAt/EndAt` (demo) o `fetchStartAt` → `fetchHeadersAt` → `fetchJsonAt` → `fetchEndAt` (real) → `uiStartAt` → `uiEndAt` (`onScannedCode`).
- Etapas de aborto: `scan_restarted`, `scanner_library_unavailable`, `insecure_context`, `camera_not_supported`, `camera_init`, `camera_start`, `camera_open_exception`, `camera_stopped`, `invalid_code`, `fast_limit`, `product_lookup`, `product_not_found`, `product_fetch`, `add_to_cart`.
- Salida: un solo `console.log("[scan-perf]", {...})` con `scanner_open_to_ready_ms`, `scanner_ready_to_decode_ms`, `ean_decode_to_fetch_ms`, `product_fetch_headers_ms`, `product_fetch_json_ms`, `product_fetch_duration_ms`, `product_lookup_duration_ms`, `response_to_ui_ms`, `total_from_camera_ready_ms`, `total_from_open_ms`, `httpStatus`, `success`, `errorStage` y `timestamp`, redondeados a 0,1 ms.

### 4.4 Carrito (`addToCart`, `changeQty`, `renderCart`, RN-CAJA-RÁPIDA 40)
- Mapa `cart = {code: qty}` persistido con `saveState()` en `tottus_cart_demo` (demo) o `tottus_cart_real_<id>` (cliente real); sin contexto activo no se persiste. `saveState()` retorna `false` y no guarda si `qty > 40`. La clave antigua `tottus_cart` se conserva intacta sin migrar.
- **Regla 40 (compra rápida):** `MAX_ITEMS = 40`; `cartTotalQty() + qty > 40` bloquea con toast + `beep(false)` + modal `#fastLimitModal` (“Límite de compras rápidas alcanzado (40 artículos). Dirígete a una caja tradicional para procesar esta compra.”) y aviso de TOBI al llegar al tope; progreso `qty/40` + badge `pop`. `btnCheckout` deshabilitado con texto `Agrega productos para continuar` si vacío.
- **Modal:** `#fastLimitModal` (overlay `z-index:70` + `.modal-card` max 420px, responsive móvil, cierre con botón `Entendido` / clic fuera). Funciones modulares `isFastLimitReached()/showFastLimitModal()/hideFastLimitModal()`.
- **Perf <2s:** validación O(1) + `renderAll()` + `calcTotals()` con n≤40 medido en `0.36ms` (test `qty:40, blocked41:true, under2s:true`).
- Controles `− / +` por ítem (`changeQty` también valida tope); `Vaciar carrito` con `confirm()`.

### 4.4d Fase 2-3: order persistente, pago medido, ticket, historial, tarjeta, PWA
- **Order persistente:** `tottus_order_demo` (demo) o `tottus_order_real_<id>` (cliente real) mediante `claveOrdenActual()` + `saveOrder/loadOrder/clearOrder`; la clave antigua `tottus_order` se conserva intacta sin migrar. `init()` retoma con `restoreOrderUI()` + toast `🔄 Retomaste tu pago pendiente` solo si hay identidad real (`!demoMode`). `issueCajaQR/issueSalidaQR` guardan; `validateSalida` guarda historial y limpia.
- **Pago ≤60s:** `payT0` inicia en `checkout()/openCheckout()` (`#payTimerHint`); `payNow()` muestra `aprobado en Xs (meta ≤60s)` y guarda `paySecs` en `order`/boleta.
- **Ticket imprimible:** boleta demo SUNAT (RUC demo + DNI) en `#ticketBody/#finalTicketBody` + `window.print()` (`#btnPrintTicket/#btnPrintFinal`) con `@media print` solo ticket.
- **Historial:** demo → `tottus_demo_history` (máx. 20) con `ticketId/fecha/total/qty/método`; real con sesión → `GET /api/historial/cliente/:id` (PostgreSQL, sin fallback local); real sin sesión → mensaje «Inicia sesión para ver tu historial de compras.». `renderHistory()` pinta `#historyCard`. La clave legada `tottus_history` se conserva y todavía se escribe al cerrar una compra real, pero **no se muestra**. El botón «Borrar historial» solo está habilitado en demo y elimina únicamente `tottus_demo_history` (`actualizarBotonBorrarHistorial()`).
- **Tarjeta demo:** `#cardForm` visible solo si método Tarjeta; valida 16 dígitos + `MM/AA` + CVV3 (solo formato, sin cobro real).
- **PWA mínima:** `manifest.json` + `sw.js` cache-first (`./, index.html, styles.css, app.js`); registro en `init()` con `catch` silencioso.

### 4.4b TOBI 🤖 robot guía (`botSay`, `botGuideView`, `firstName`)
- Widget flotante abajo-derecha: avatar robot CSS (antena pulsante, ojos que parpadean, cuerpo con “T” Tottus) + burbuja con efecto de escritura.
- **Posición (solo CSS, sin JS):** `.bot-widget` en `bottom:120px !important; right:30px !important` para quedar sobre la barra inferior; en `@media (min-width:700px)` pasa a `bottom:120px !important; right:max(30px, calc(50% - 310px)) !important` para no recortarse en escritorio. `.bot-bubble` con `margin-right:10px` y tope `min(260px, calc(100vw - 70px))`; cola `.bot-bubble::after` en `right:25px` para apuntar al centro de la cabeza.
- Saluda al cliente **con su nombre registrado** tras login/demo, y da guía contextual por vista (scanner, carrito, checkout) y por eventos (primer producto, tope del carrito, QR de caja, pase de salida, compra autorizada).
- Clic en el robot reabre el último mensaje; la ✕ lo cierra. Mensajes clave incluyen la explicación de seguridad del QR.

### 4.4c Confeti (`confettiBurst`)
- Canvas overlay propio (`#confettiCanvas`, sin CDN): ~160 partículas verde/blanco/dorado con gravedad y rotación, 4.5 s, respeta `prefers-reduced-motion`. Se dispara en `validateSalida()` junto al mensaje “🎊 ¡Felicidades por tu compra!” de TOBI.

### 4.8 TOBI conversacional (sesión 2026-10 — 6 vistas, `view-tobi`)

#### 4.8.0 Saludo animado + saltito (`app.js`, sin diálogos nuevos)
- Al abrir el panel, el propio botón saluda 2.6 s: `.tobi-greet` (inclinación ±7° con `transform-origin: 50% 100%`, ojos cerrados, boca abierta, brazo `.tobi-greet-arm` que solo existe durante el saludo). Se dispara en el clic con doble `requestAnimationFrame` + reflow (`tobiGreetOnOpen()`), se retira al terminar/cerrar y se repite en cada apertura.
- Con el panel cerrado, saltito `.tobi-nudge` (.8 s, −7 px) cada 7 s (`tobiNudgeStart()` + primer aviso a los 3.5 s) hasta el primer press (`window._tobiPressedOnce`). Con `prefers-reduced-motion`: cara feliz + brazo quietos, sin saltos.
- Los textos de bienvenida del panel quedan idénticos; la animación solo los acompaña.

#### 4.8.1 Chat propio (`tobi-chat.js`, `#view-tobi`)
- Se entra con `💬 Chatear con Tobi` dentro del panel (sin tocar el texto de bienvenida) y se vuelve con `← Volver` (reutiliza `showView` previo).
- Burbujas cliente (verde, derecha) / Tobi (blanca, izquierda) con `textContent` (sin HTML inyectado), formulario con Enter + Enviar, scroll automático, indicador `#tobiTyping` (“Tobi está escribiendo...”), sin límite de mensajes. Manejo de errores con mensajes amables en cada `try/catch`.
- Respuestas **por reglas, sin IA**: `getTobiReply(text)` (saludos + ayuda de escaneo/carrito/pago/caja/salida/ofertas/cuenta + respaldo) y `getTobiReplyNamed(text, ctx)` (nombre ocasional + “¿Te ayudo con algo más?” solo si no terminaba en pregunta). Punto de conexión futura a backend con IA comentado en el archivo (endpoint propio, claves en servidor, nunca en frontend).

#### 4.8.2 Historial + saludo con nombre (`tobi-history.js`)
- `getUserName()`: primer nombre de `tottus_user` o “Cliente” (demo); único lugar que lo define, con comentario del hook a sesión real. Nunca se imprime en consola.
- Conversaciones `{id, title (≤40, del primer mensaje del cliente), createdAt, updatedAt, messages:[{who,text,ts}]}`; tope 30 conversaciones / 200 mensajes; retoma la última activa; panel 🕘 con Nueva, borrar (con `confirm()`) y Borrar todo (con `confirm()`); estado vacío amable.
- Saludo 1×/visita (“Hola, {nombre}, qué gusto verte de nuevo…”) vía `sessionStorage` + respaldo en memoria; también al retomar historial.

#### 4.8.3 Alergias (`tobi-profile.js` + `tobi-chat.js`)
- Pregunta inicial con botones `Sí, tengo alergias / No tengo alergias / Prefiero responder después`; “Sí” → dictar (comas o “y”) → repite y pide “¿Las guardo?”; “No” registra estado `none` (distinto de “no preguntado”); “Después” usa `sessionStorage` (recordatorio discreto máx. 1×/visita).
- Intents fuera del flujo (`tengo alergia a…`, `soy intolerante…`, `mis alergias`, `agrega/quita alergia`); `{id, nombre normalizado, fecha}`, sin duplicados, tope 20 ítems / 40 caracteres; pantalla “Mis alergias” 🛡️ (agregar/editar inline/eliminar y borrar-todas con confirmación). Tobi solo registra lo declarado: sin preguntas ni consejos médicos.

#### 4.8.4 Productos frecuentes (mismo patrón)
- Pregunta tras alergias (chips `Sí, te cuento / Después` + recordatorio 1×/visita); dictar → confirmar → guardar; `tobiFrequentInCatalog()` avisa “lo tenemos en el catálogo” sin tocar el carrito; intents (`suelo comprar…`, `mis productos`, `agrega/quita producto`); tope 30; pantalla “Mis productos” 🛒. Prioridad sin interrumpir consultas a medias.

#### 4.8.5 Recetas con filtro estricto (`tobi-recipes.js`, 27 recetas)
- Cada receta: `id, nombre, descripción, tiempo, porciones, ingredientes[{nombre, alérgenos}], pasos, etiqueta` (desayuno/almuerzo/cena/snack), platos peruanos sencillos.
- `tobiRecipeAllergyLabels()` mapea lo declarado a etiquetas (derivados: leche/lactosa/lácteos → queso, yogur, mantequilla, crema, etc., sin tildes/mayúsculas).
- `tobiRecipesFor()`: **excluye sin excepciones** cualquier receta con ingrediente coincidente; si la alergia no se reconoce, excluye por texto y lo avisa; ordena por frecuentes que usa y muestra “tienes / te falta”. Guardarraíles en el chat (sin alergias → las pregunta; sin frecuentes → los pregunta o muestra generales). Pantalla 🍲 feed + detalle + banner de exclusiones + aviso médico fijo. Intents (`qué puedo cocinar`, `dame recetas`, `ver recetas`).

#### 4.8.6 Descuentos del día (`tobi-discounts.js`, 8 promos demo)
- Config por día de semana y/o fechas (`{id, título, desc, porcentaje o monto, productIds o categoría, días, inicio/fin}`); los % de productos se reutilizan del catálogo (`PRODUCTS[].discount`, una sola fuente).
- `tobiDiscountsToday(fecha?)` con huso America/Lima (`Intl`); ignora vencidos/no-iniciados. Hook a API real comentado. Pantalla 🏷️ con tarjetas clicables al catálogo (filtro Ofertas + resaltado, jamás al carrito); destaca frecuentes con descuento salvo choque con alergias; mención 1×/visita (`sessionStorage`) sin interrumpir flujos; vacío amable + nota de precios.

#### 4.8.7 Comprensión sin IA (`tobi-chat.js`)
- `tobiCleanText` (minúsculas, sin tildes/signos/espacios) + `tobiCanon` (`TOBI_TYPO_MAP`: “lactoza”, “ofetas”…, + sinónimos→frases que los flujos entienden); el historial guarda el texto original.
- `tobiFollowUp` responde con datos reales (“¿alguna lleva leche?”, “¿son seguras?”, “¿qué alergias tengo?”, “¿qué excluyes?”; si no hay datos, lo dice sin inventar).
- Si nada entiende, `tobiSmartFallback` + `tobiGuessChips`: aclaración + 3 botones probables (nunca se toca el mensaje genérico de respaldo).

#### 4.8.8 Alerta de alergia en catálogo/carrito (`tobi-allergens.js`)
- Tabla demo de los 14 productos (`TOBI_PRODUCT_ALLERGENS`: etiquetas o `verified:false` = “composición no verificada”; debe validarse con fabricantes).
- Envoltura de `addToCart` (sin tocar `app.js`): ante choque con alergia, modal “Agregar igual / No agregar” (suave si no verificada: “revisa la etiqueta”); ante cualquier fallo, el producto se agrega igual (fail-open). Badge discreto “⚠️ Contiene X” en tarjetas solo con alergias registradas; nada si no hay o eligió “sin alergias”. Nunca dice “seguro”.

#### 4.8.9 Lista de compras + sugerencias (`tobi-chat.js` + `tobi-profile.js`)
- Botón “Agregar lo que me falta a mi lista” en el detalle: compara con frecuentes, enlaza equivalentes del catálogo (“No disponible” si no hay), omite choques con alergias, jamás toca el carrito; `tobi_profile_shopping` (tope 50); pantalla “Mi lista” 🧾 (✓ comprado, quitar, vaciar con confirmación).
- Fila `#tobiSuggest` al abrir y tras cada respuesta: máx. 4, según contexto (registrar alergias, recetas, ofertas…), sin repetir las recién mostradas y oculta en flujos guiados; scroll horizontal en celular.

#### 4.8.10 Claves de almacenamiento (todas con `try/catch`; aviso discreto si falla)
| Clave | Dónde | Estructura |
|-------|-------|------------|
| `tobi_chat_convos` | localStorage | `[{id, title, createdAt, updatedAt, messages:[{who,text,ts}]}]` (30/200) |
| `tobi_chat_active` | localStorage | id de la última conversación |
| `tobi_chat_greeted` | sessionStorage | `"1"` saludo con nombre mostrado |
| `tobi_profile_allergies` | localStorage | `[{id, name, ts}]` o `{none:true, ts}` (20/40) |
| `tobi_profile_asked` | localStorage | `"1"` ya se preguntó alergias |
| `tobi_profile_reminded` / `tobi_profile_later` | sessionStorage | recordatorio / “después” de la visita |
| `tobi_profile_frequents*` | localStorage/session | igual patrón (`*_asked`, `*_reminded`, `*_later`; 30) |
| `tobi_profile_shopping` | localStorage | `[{name, code\|null, bought}]` (50) |
| `tobi_discounts_mentioned` | sessionStorage | mención de ofertas mostrada |

#### 4.8.11 Reglas de seguridad aplicadas
- Todo texto del cliente se pinta con `textContent` (nunca `innerHTML`); topes de longitud y de lista en cada registro.
- Alergias/productos/nombres/mensajes **jamás** en `console`, jamás a servicios externos (cero `fetch`/`XMLHttpRequest` en `tobi-*.js` salvo comentarios de conexión futura).
- Alergias: solo se guarda lo declarado + la confirmación aceptada; recordatorios con `sessionStorage`.
- Recetas/descuentos/alérgenos son **demostración**; avisos fijos: médico/nutricionista, etiquetas de productos y precios en app/caja.

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

### 4.9 Aislamiento demo ↔ cliente real y por cliente (2026-10-21, `e041871`)
> Complementa §63 de `MEJORAS-IMPLEMENTADAS (1).md`. No cambia backend, base de datos, login, CORS ni Quagga2.

- **Claves por contexto:** `claveCarritoActual()` y `claveOrdenActual()` devuelven `tottus_cart_demo` / `tottus_order_demo` en demo y `tottus_cart_real_<id>` / `tottus_order_real_<id>` con cliente real. Sin sesión devuelven `null`: no se lee ni se escribe una clave compartida.
- **Claves legadas:** `tottus_cart` y `tottus_order` se conservan intactas y **no se migran** (no puede determinarse a qué modo/cliente pertenecían).
- **Identidad visible única:** `identidadActiva()` devuelve «Cliente demo» en demo —sin leer `tottus_user`— o el perfil real con `id` entero > 0; se expone como `window.scanGoIdentidadActiva` y la usa también `getUserName()` de `tobi-history.js`.
- **Historial en memoria:** `limpiarHistorialRemoto()` incrementa `historialSolicitud`, borra `historialRemoto`, `historialError`, `historialCargando` e `historialClienteId` y repinta. Una respuesta en vuelo de otro cliente se descarta por número de solicitud.
- **Boleta visible:** `limpiarBoletaVisible()` oculta `#ticketCard` / `#payStep4` y vacía `#ticketBody` / `#finalTicketBody` al entrar a demo, iniciar/cerrar sesión.
- **Boleta demo vs real:** `checkout()` rotula «BOLETA DEMO (SUNAT) / RUC demo» o «BOLETA (SUNAT) / RUC 20100123456»; `validateSalida()` rotula «SALIDA AUTORIZADA (DEMO)» y en demo no pinta DNI real.
- **Cierre de sesión:** si se sale de demo, **no** se elimina `tottus_user` y se vuelve a la sesión real pausada; si se cierra sesión real, se elimina `tottus_user`. Antes se guardan carrito/orden del contexto y después se recargan las claves del contexto nuevo.
- **Registro/login:** tras guardar la sesión se ejecutan `loadState()`, `loadOrder()`, `limpiarHistorialRemoto()`, `limpiarBoletaVisible()`, `updateAuthUI()`, `renderAll()` y `cargarHistorialRemoto()`.
- **Orden pendiente:** `init()` solo restaura la orden si hay identidad real (`!demoMode`).
- **Observación:** `sw.js` sigue en `tottus-scan-go-v12`; los commits posteriores no cambiaron el SW, por lo que un cliente PWA con caché anterior podría seguir usando el `app.js` viejo hasta actualizar la versión del caché.

### 4.10 Despliegue: frontend en Vercel, API en Render, PostgreSQL dual y health check (2026-10-20)
> Documenta `f50ecf8` (backend) y `cdaf28b` (frontend). No se modificó configuración de Vercel, Render ni Neon al documentarlos.

- **Frontend → Render:** `index.html` incluye un script inline antes de `app.js` que, si `location.hostname` no es `localhost`, `127.0.0.1` ni `::1`, asigna `window.SCANGO_API_BASE_URL = "https://scan-go2-backend.onrender.com"`. `app.js` respeta ese override; si no existe, usa `http://localhost:3000` en local y `""` (mismo origen) en cualquier otro host. La URL queda fija en el HTML: *previews*, dominio propio e IP de LAN también apuntan a Render.
- **PostgreSQL dual:** `backend/config/db.js` usa `DATABASE_URL` (con `ssl: { rejectUnauthorized: false }`) cuando tiene valor e **ignora** las `DB_*`; si está vacía, exige `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` y `DB_NAME`, valida que `DB_PORT` sea numérico y no usa SSL. El log de arranque solo indica `modo nube (DATABASE_URL)` o `modo local (DB_*)`, sin credenciales.
- **`GET /api/health`:** ruta pública que ejecuta `SELECT NOW()`; responde **200** `{ success:true, service:"scan-go2-backend", database:"connected" }` o **503** `{ success:false, ..., database:"disconnected" }`, sin detalles del error. No sustituye autenticación ni autorización.
- **CORS:** la lista blanca sigue viniendo de variables de entorno; este cambio no la modifica. Para que Vercel funcione, el origen exacto del despliegue debe estar permitido en Render.
- **Límite:** no hay separación por entorno (staging/producción) ni secreto en el frontend; cambiar de backend exige editar `index.html` y volver a desplegar.

## 5. Modelo de datos (cliente)

```js
PRODUCTS[i] = { id, name, brand, price, oldPrice|null, code, emoji, cat, discount, restricted? }
cart        = { "7750123…": qty }
tottus_user = { id, name, dni, email, birth, age, isAdult }  // sesión real mínima: `id` entero > 0 del backend (registro/login por correo); `isAdult` proviene de `data.esAdulto`; el modo demostración NO se persiste
order = {
  ticketId, method, total, subtotal, igv, saving, qty, paySecs,
  items: {...cart},
  status: "PAGADO_PENDIENTE_CAJA" | "VALIDADO_CAJA" | "AUTORIZADO",
  caja:   { code, token, exp, used },
  salida: { code, token, exp, used }
}
tottus_order_demo = order persistido en demo (retomar flujo)
tottus_order_real_<id> = order persistido por cliente real (retomar flujo)
tottus_history = [{ ticketId, date, total, qty, method }] (máx. 20; clave legada compartida: se escribe al cerrar compra real, no se muestra)
tottus_demo_history = [{ ticketId, date, total, qty, method }] (máx. 20; historial del modo demo)
tottus_cart_demo = { "7750123…": qty } (carrito demo)
tottus_cart_real_<id> = { "7750123…": qty } (carrito por cliente real)
tottus_cart / tottus_order = claves antiguas conservadas intactas, sin migrar y sin uso
// Nota: la demo se distingue solo por demoMode; currentClienteId() devuelve null en demo.
tobi_chat_convos = [{ id, title(≤40), createdAt, updatedAt, messages:[{who,text,ts}] }] (30 convos / 200 msgs)
tobi_chat_active = id última conversación (localStorage)
tobi_chat_greeted = "1" (sessionStorage, saludo con nombre 1×/visita)
tobi_profile_allergies = [{ id, name, ts }] o { none:true, ts } (20 ítems / 40 caracteres)
tobi_profile_asked = "1" (localStorage); tobi_profile_reminded / tobi_profile_later (sessionStorage)
tobi_profile_frequents = [{ id, name, ts }] (30) + *_asked/*_reminded/*_later (mismo patrón)
tobi_profile_shopping = [{ name, code|null, bought }] (50)
tobi_discounts_mentioned = "1" (sessionStorage, mención de ofertas 1×/visita)
```

## 5b. Proceso con Opencode (Sec.5 del informe — reemplaza Google Studio/Firebase)

> Todo el código fue generado solo con **Opencode**, sin Google Studio. Firebase se simula con `localStorage` por alcance 1.5 (un sector + pasarela de prueba).

**Fase 1 — RN02 + tope inicial 205:** prompt `agrega DNI 8 + nacimiento, calcAge/isAdultUser, 2 licores restricted:true, badge +18, MAX_ITEMS 205`. Verificación `node --check app.js`.
**Cambio posterior RN-CAJA-RÁPIDA (tope 40 + modal):** `MAX_ITEMS 205→40`, `saveState()` bloquea guardado del artículo 41, `onScannedCode()` intercepta lectura con `isFastLimitReached(1)`, `#fastLimitModal` con texto exacto + `.modal-overlay/.modal-card` responsive, medido `0.36ms <2s`.
**Fase 2 — Validaciones:** `tottus_order` + `restoreOrderUI()`, `scanT0/payT0` discretos, `btnCheckout` deshabilitado, boleta SUNAT demo + `window.print()`.
**Fase 3 — Experiencia:** `tottus_history`, `beep()` WebAudio, `#cardForm` con validación de formato, `manifest.json + sw.js`.
**Fase 4 — Docs:** actualización de este archivo + texto listo para pegar en el Word del informe.
**Fase 5 — Autenticación real (2026-10-21):** registro (`POST /api/clientes/registro`) e inicio de sesión (`POST /api/clientes/login`) con correo y contraseña, hash bcrypt (costo 10), migración `002-add-password-hash-clientes.sql`, sesión local mínima y retiro del login por DNI de la interfaz.
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
cd frontend
python3 -m http.server 8000
# abrir http://localhost:8000  (localhost/https requerido para la cámara)
```
1. Pulsa **Iniciar sesión** e ingresa tu **correo y contraseña** (cuenta real), o **Crear cuenta** si aún no tienes una. **Ver demostración** abre el modo de prueba sin credenciales. El botón «G» de Google muestra solo el aviso «próximamente».
2. Agrega productos o usa **📷 Escanear** (o pega un código de “códigos de prueba”).
3. Ve a **🛒 Carrito → Finalizar compra → Pagar desde el celular → Pagar ahora**.
4. Muestra el QR en **Caja → ✅ Validar en Caja**, luego el pase en **Seguridad → Validar salida**.
5. Presiona la **T** de Tobi → **💬 Chatear con Tobi** (historial 🕘, alergias 🛡️, productos 🛒, recetas 🍲, ofertas 🏷️, lista 🧾).

## 8. Limitaciones conocidas (demo)
- **Pago, caja y seguridad siguen simulados:** cualquiera puede pulsar “validar”. `localStorage` (`tottus_cart_demo/real_<id>`, `tottus_order_demo/real_<id>`, `tottus_demo_history`, `tottus_user`) es manipulable; en producción usar pasarela real + HMAC/JWT en servidor con nonces. El aislamiento demo/real y por cliente es **solo de interfaz**: no sustituye la autorización en el backend (ver auditoría de Fase 6).
- **Sesión local mínima:** el registro/login reales validan credenciales contra la API y guardan solo la proyección pública en `localStorage['tottus_user']` (sin contraseñas, hashes ni tokens). No hay JWT, cookies ni sesión de servidor: cerrar sesión borra ese perfil local y la recuperación de contraseña aún no está implementada.
- Firma QR demo (`simpleHash` + secreto en cliente); tarjeta demo solo valida formato.
- Escáner Quagga2 exclusivamente por CDN (`https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.2/dist/quagga.min.js`, sin copia local ni npm): requiere internet y permiso de cámara; si el CDN falla, el escaneo se deshabilita con el aviso en `#scannerStatus` y se continúa por ingreso manual (`#manualCode/#btnManualAdd`) + `beep()`. El SW cachea el app shell, no el CDN.
- QR de pago por CDN (`qrcode@1.5.3`) requiere internet; sin él solo placeholder (`fallbackQR()`). SW cachea app shell, no los CDN.
- **Tobi responde por reglas locales, no por IA** (`getTobiReply` + flujos por palabras clave): entiende lo previsto y lo demás lo deriva a opciones; no mantiene contexto salvo el flujo activo en memoria.
- **Todos los datos de Tobi viven solo en este navegador** (`tobi_chat_*`, `tobi_profile_*`): se pierden si se borra el almacenamiento; no hay sincronización ni multi-dispositivo.
- **Descuentos, recetas y tabla de alérgenos son de demostración**: los % de productos reutilizan el catálogo, pero las promos, las 27 recetas y las etiquetas por producto deben validarse con datos reales (precios, fabricantes, nutricionista).
- **Las sugerencias no reemplazan** la opinión de un médico o nutricionista ni la lectura de etiquetas y precios en app/caja (avisos fijos en pantalla).

## 9. Trabajo futuro
- [ ] Backend (pasarela Yape/Plin/tarjeta real, API de tickets, validación HMAC en servidor).
- [ ] App de personal (caja/seguridad escanean QR real del cliente).
- [x] Boleta imprimible demo (hecho con `window.print()`); pendiente boleta electrónica SUNAT real en PDF.
- [ ] Catálogo real con imágenes, stock y precios por tienda.
- [x] PWA mínima (hecho `manifest.json + sw.js`); pendiente notificaciones + offline total (CDN QR).
- [ ] Recuperación de contraseña y sesión persistente con token (hoy la sesión real es local y mínima, sin JWT ni cookies).
- [ ] Tobi con IA real (endpoint propio tras `getTobiReply`), perfil e historial en backend con sesión, y datos validados (precios, alérgenos de fabricantes, recetas de nutricionista).

## 10. Pruebas manuales sugeridas
1. Límite 40 (RN-CAJA-RÁPIDA): llena 40 → intenta el 41 por escáner/botón/+ → abre `#fastLimitModal` con texto exacto, no guarda (`saveState()=false`), toast + `beep(false)`. Carrito vacío → `btnCheckout` deshabilitado.
1b. RN02: login 2015 → cerveza `...0136` bloquea 🔞; demo sí deja; badge `+18` visible.
1c. Perf: scan muestra `⏱️ Xs (meta <3s)`; pago muestra `aprobado en Xs (meta ≤60s)`; tarjeta `4111111111111111 12/28 123` ok, `123` falla.
1d. Persistencia: paga → recarga → `🔄 Retomaste tu pago pendiente` con QR redibujado; termina → aparece en Historial; Imprimir abre PDF.
1e. Autenticación real (pendiente de prueba manual): **Crear cuenta** con datos válidos → 201, perfil en `tottus_user` e ingreso al dashboard; **Iniciar sesión** con esa cuenta → 200; credenciales incorrectas → 401 con mensaje bajo el formulario; correo o DNI duplicado → 409; backend apagado → mensaje de conexión, sin sesión y sin demo.
1b. TOBI: entrar con demo → saluda con "Cliente"; registrarse como "María" → saluda con "María".
1c. Confeti: completar flujo caja+salida → lluvia de confeti verde/blanco/dorado + "🎊 ¡Felicidades por tu compra!".
2. IGV: total S/ 118.00 → subtotal S/ 100.00, IGV S/ 18.00.
3. QR caja: esperar 5 min (o forzar `exp` pasado) → “expirado”, regenerar invalida anterior.
4. Reúso: validar caja dos veces → “QR ya usado”.
5. Código erróneo de cajero/seguridad → “incorrecto”.
6. Recargar a mitad del flujo: el carrito persiste en `tottus_cart_demo` o `tottus_cart_real_<id>`, y la orden en `tottus_order_demo` o `tottus_order_real_<id>`, con QR redibujado. En demo, salir y volver a la sesión real no mezcla carrito, orden ni boleta.
7. Fallback del lector: con CDN disponible `#btnStartCamera/#btnStopCamera` habilitados y `#manualCode/#btnManualAdd` operativo; simulando CDN caído (`window.__quaggaCdnFailed = true` o bloqueo de `https://cdn.jsdelivr.net/npm/@ericblade/quagga2`), `#scannerStatus` muestra “El escáner no está disponible. Puedes ingresar el código manualmente.”, los botones de cámara quedan `disabled`, el ingreso manual sigue agregando y el catálogo/carrito/TOBI no se afectan.
8. TOBI conversacional: presionar la **T** → saludo 2.6 s (cara feliz + brazo, se repite al reabrir); con el panel cerrado, saltito cada ~7 s hasta el primer press; **Chatear con Tobi** → escribir (“hola”, “cómo pago”, “zzzqqq” → 3 botones); 🕘 retoma/borra conversaciones; recarga → retoma la última; pestaña nueva → saludo con nombre otra vez.
9. Alergias/frecuentes: primera apertura pregunta con botones; “Sí” → dictar (`maní, lácteos y mariscos`) → confirmar → 🛡️/🛒 muestran, editan y borran; reset: borrar `tobi_profile_asked` (+ `tobi_profile_frequents_asked`) en DevTools → recarga.
10. Recetas/descuentos: con alergia `lactosa` + frecuente `arroz`, `¿qué puedo cocinar?` → 18 tarjetas sin lácteos; `ofertas de hoy` → tarjetas del día; `tobiDiscountsToday(new Date('2026-10-12T12:00:00'))` en consola simula el lunes.
11. Alerta catálogo: con `lactosa`, Leche + Agregar → modal de coincidencia (Agregar igual / No agregar); Inca Kola → aviso suave de no verificada; badge “⚠️ Contiene lactosa” en la tarjeta.

## Historial de cambios técnicos

### Backend dual (local/Neon) y conexión Vercel → Render (2026-10-20; documentado 2026-10-22)
> Registro de dos commits que no figuraban en esta documentación. No se modificó código al documentarlos.

**`f50ecf8` — `feat(backend): soporte dual PostgreSQL local/Neon y endpoint /api/health`**
- `backend/config/db.js`: si `DATABASE_URL` tiene valor, el `Pool` usa `connectionString` + `ssl: { rejectUnauthorized: false }` y se ignoran las `DB_*`; si está vacía, exige `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` y `DB_NAME`, valida `DB_PORT` numérico y no usa SSL.
- El log de arranque ya no imprime usuario/host/base; solo `[db] Pool configurado en modo nube (DATABASE_URL)` o `modo local (DB_*)`.
- `backend/.env.example`: añade `NODE_ENV`, deja `DATABASE_URL=` vacío y reemplaza credenciales por `CAMBIAR`.
- `GET /api/health` (público): `SELECT NOW()` → **200** `{ success:true, service:"scan-go2-backend", database:"connected" }` o **503** `{ success:false, ..., database:"disconnected" }`, sin exponer el error.
- Archivos: `backend/config/db.js`, `backend/src/app.js`, `backend/.env.example`. Sin cambios de esquema, rutas de negocio ni CORS.

**`cdaf28b` — `feat(frontend): conectar Vercel con backend de Render`**
- `frontend/index.html` añade, antes de `app.js`, un script que asigna `window.SCANGO_API_BASE_URL = "https://scan-go2-backend.onrender.com"` cuando el host no es `localhost`, `127.0.0.1` ni `::1`.
- `app.js` respeta el override; en local usa `http://localhost:3000` y, sin override, el mismo origen. Cualquier despliegue no local (incluidos *previews*) apunta a Render.
- La URL está fija en el HTML: no hay separación staging/producción. El CORS del backend debe permitir el origen de Vercel; este commit no lo modificó.
- Archivo: `frontend/index.html`. Sin cambios en `app.js`, backend ni base de datos.

### Aislamiento demo ↔ cliente real, historial demo y rendimiento del lector (2026-10-21; documentado 2026-10-22)
> Registro de los tres commits que no figuraban en esta documentación. No se modificó código al documentarlos.

**`e041871` — `fix(frontend): aislar datos entre demo y usuario real`**
- Carrito y orden dejan de usar claves globales: `tottus_cart_demo` / `tottus_cart_real_<id>` y `tottus_order_demo` / `tottus_order_real_<id>` mediante `claveCarritoActual()` y `claveOrdenActual()`. Las claves antiguas `tottus_cart` y `tottus_order` se conservan intactas y no se migran.
- `identidadActiva()` se convierte en la fuente única de identidad visible (demo = «Cliente demo» sin leer `tottus_user`); se expone como `window.scanGoIdentidadActiva` y `getUserName()` de `tobi-history.js` pasa a usarla.
- `limpiarBoletaVisible()` evita que una boleta demo quede visible en modo real (y al revés). `limpiarHistorialRemoto()` + `historialSolicitud` descartan respuestas en vuelo de otra sesión.
- `enterDemo()`, registro, login, `init()` y cierre de sesión recargan el contexto correcto. El cierre distingue «Salir de demo» (conserva `tottus_user`) de cerrar sesión real (elimina `tottus_user`).
- `firstName()`, `buildPreTicket()` y `validateSalida()` usan `identidadActiva()`; las boletas se rotulan como demo o reales y en demo no muestran DNI real.
- Archivos: `frontend/app.js`, `frontend/tobi-history.js`. Sin cambios en backend, base de datos, CORS ni Quagga2.
- Observación: `frontend/sw.js` permaneció en `tottus-scan-go-v12`; conviene revisar la versión del caché antes de publicar.

**`ced9665` — `fix(history): corregir borrado del historial demo`**
- El botón «Borrar historial» borraba `tottus_history` (clave legada) y no `tottus_demo_history`.
- Nueva `actualizarBotonBorrarHistorial()`: en demo habilita «Borrar historial»; en real lo deshabilita y muestra «El historial real no puede eliminarse desde esta versión».
- El listener solo elimina `tottus_demo_history` en demo, repinta y avisa «Historial demo borrado»; en real no toca storage.
- Archivo: `frontend/app.js`. El historial real sigue viviendo en PostgreSQL y no tiene endpoint `DELETE`.

**`5be1b76` — `chore(frontend): instrumentar rendimiento del lector`**
- Instrumentación temporal `[scan-perf]` de la Fase 5C: un contexto por ciclo (`beginScanPerf`), hitos con `markScanPerf` / `markScanPerfToken`, estado HTTP con `setScanPerfHttpStatus`, emisión única con `emitScanPerf` y cierre de errores con `abortScanPerf`.
- Mide apertura de cámara → `readyAt`, `decodeAt`, `fetch` del producto (headers/JSON/fin y HTTP), búsqueda local en demo, render de UI y totales; imprime un solo `console.log("[scan-perf]", {...})`.
- Solo memoria y consola: no persiste, no envía datos al backend y no incluye EAN, producto, identidad ni datos personales. **No debe retirarse hasta terminar las pruebas (Fase 6D).**
- Archivo: `frontend/app.js`.

### Fase 5 — Registro e inicio de sesión reales con correo y contraseña (2026-10-21)
**Objetivo:** conectar los formularios existentes con los endpoints reales, conservar una sesión mínima segura, mantener la demo separada y retirar el DNI como mecanismo de inicio de sesión.

**Backend (Node/Express/PostgreSQL):**
- Dependencia nueva: `bcryptjs ^3.0.3` (única añadida). `BCRYPT_ROUNDS = 10`.
- `POST /api/clientes/registro` → valida nombre (≥3), DNI (8 dígitos), correo (formato), contraseña (≥4) y confirmación, y fecha de nacimiento real/no futura. Normaliza `correo` con trim + lowercase, detecta duplicados por correo y DNI (409) y responde **201** con `{ success: true, data }`.
- `POST /api/clientes/login` → normaliza el correo y compara el hash con `bcrypt.compare`. Credenciales inválidas devuelven **401** con el mensaje genérico «Correo o contraseña incorrectos.» (misma respuesta si la cuenta no existe o no tiene contraseña).
- La proyección pública (`clienteSesionPublico`) devuelve `id`, `nombre`, `correo`, `dni`, `fechaNacimiento`, `edad` y **`esAdulto`**; nunca incluye `password_hash`.
- Nuevas funciones de modelo: `buscarPorCorreo`, `buscarPorCorreoConPassword` (uso interno del login) y `crearConPassword` (solo persiste el hash). Se conservan `identificarPorDni`, `buscarPorDni` y la ruta `POST /api/clientes/dni` por compatibilidad.
- **Sin JWT, cookies, `Authorization` ni sesión de servidor**, según el alcance de la fase.

**Base de datos:**
- Migración `database/migrations/002-add-password-hash-clientes.sql`: `ALTER TABLE public.cliente ADD COLUMN IF NOT EXISTS password_hash TEXT;` (nullable, sin `DEFAULT`, idempotente). Ya aplicada manualmente en Neon; no se reejecuta en las validaciones.

**Frontend:**
- Login real en `#emailLoginForm` contra `${API_BASE_URL}/api/clientes/login`, con estados “Iniciando sesión…”, errores bajo el formulario (`#authStatus`), botón deshabilitado durante la petición y restauración en `finally`.
- Registro real en `#loginForm` contra `${API_BASE_URL}/api/clientes/registro` con el contrato `{ nombre, dni, correo, password, passwordConfirm, fechaNacimiento }`, mensajes de éxito/error (`#registerSuccess`, `#registerError`) y limpieza de todos los campos al crear la cuenta.
- Helper común `guardarSesionCliente()`: guarda en `localStorage['tottus_user']` exactamente `{ id, name, email, dni, birth, age, isAdult }`; exige `id` entero > 0 y **no** guarda contraseñas, confirmaciones, hashes ni tokens.
- Corrección del mapeo: `isAdult` se construye con **`data.esAdulto === true`** (antes se leía por error `data.esAdult`), aplicado tanto a registro como a login.
- **Retiro del login por DNI de la interfaz:** se eliminaron `#dniLoginForm`, `#dniLogin`, `#dniLoginError`, `#btnDniLogin`, el separador `o`, las funciones `setDniLoginError()` / `ingresarConDni()` y su listener. El DNI sigue siendo obligatorio en “Crear cuenta”.
- La demo queda separada: `#btnDemo` es la **única** vía de `enterDemo()`; ni el login ni el registro ni sus errores activan el modo demo.
- Estilos mínimos `.form-status` (carga/error/éxito) con `aria-live` ya existente en los párrafos de estado.

**Verificación:**
- `node --check` OK en `backend/src/models/clienteModel.js`, `backend/src/controllers/clienteController.js`, `backend/src/routes/clienteRoutes.js` y `frontend/app.js`; `git diff --check` sin errores.
- No se ejecutaron POST reales, no se creó ningún cliente y no se ejecutó SQL durante la implementación/revisión.
- Pendiente: prueba manual de registro/login (éxito, 400, 401, 409 y backend caído) en local o producción.
- Archivos de la fase: `backend/package.json`, `backend/package-lock.json`, `backend/src/models/clienteModel.js`, `backend/src/controllers/clienteController.js`, `backend/src/routes/clienteRoutes.js`, `frontend/app.js`, `frontend/index.html`, `frontend/styles.css`, `database/migrations/002-add-password-hash-clientes.sql` y esta documentación.

### Ingreso por DNI + Google «próximamente» (Etapa 3, 2026-10-17/18) — histórico
- **El ingreso por DNI estuvo activo hasta la Fase 5 (2026-10-21), cuando se retiró de la interfaz.** En `#loginCard` el formulario `#dniLoginForm` pedía el DNI, lo limpiaba (sin espacios, solo dígitos, máx. 8), validaba el formato (exactamente 8 dígitos) y **evitaba solicitudes vacías**. Mientras consultaba, deshabilitaba `#btnDniLogin` y mostraba «Verificando…»; al terminar lo reactivaba (éxito o error).
- Histórico: consultaba la **ruta real del backend** `POST /api/clientes/dni` (`{ dni }`, `API_BASE_URL`). `200` → identificaba al cliente (`id`, `nombre`, `dni`); `404` → «El DNI no está registrado…»; error de red → mensaje controlado sin bloquear la interfaz.
- **El DNI identificaba al cliente dentro del prototipo académico; no era autenticación de alta seguridad** (sin contraseña ni token). El estado reutilizaba `localStorage['tottus_user']` con el `id` real y `currentClienteId()` usaba ese `id` para historial y compra. **Retirado en la Fase 5:** ya no se ofrece como login; el DNI solo se usa como dato obligatorio del registro.
- **Google queda preparado en el backend pero desactivado en el frontend.** El botón «G» (`#btnGoogleAccess`) **no** llama a `POST /api/auth/google`, **no** carga Google Identity Services, **no** abre formularios ni crea usuarios: solo abre un **modal propio de Scan & Go** (`#googleModal`), cerrable con «Entendido», con el botón ✕ o con `Escape`, con `role="dialog"`, `aria-modal`, `aria-label` y foco gestionado. Muestra: «Acceso con Google próximamente» + «El backend ya está preparado para validar cuentas de Google. Esta opción se habilitará cuando se configuren las credenciales oficiales. Por ahora, inicia sesión con tu correo y contraseña.» No imita el selector oficial de Google ni pide correo, contraseña o nombre. Para habilitarlo se necesitará `GOOGLE_CLIENT_ID` y conectar el `credential` real.
- **Modo demostración claramente identificado:** la demo se activa **únicamente** con el botón «Ver demostración» (`#btnDemo`) y entra a un modo de prueba de **solo memoria** (`demoMode`) —nunca se persiste— que muestra el distintivo permanente «Modo demostración» (`#demoBadge`), no pide ni guarda correos, no crea un perfil de cliente y no representa una sesión autenticada. Desde la Fase 5, el formulario de correo es el login real y ya no activa la demo.
- **No se usa autenticación falsa:** no se crean tokens, correos ni `google_id` inventados. Se retiró el mensaje temporal de prueba/desarrollo del registro («Se requiere un servidor para crear una cuenta real»).
- `API_BASE_URL`: local (`localhost`/`127.0.0.1`/`::1`) → `http://localhost:3000`; en cualquier otro host, `index.html` define `window.SCANGO_API_BASE_URL = "https://scan-go2-backend.onrender.com"` (ver §4.10). Si el override no existe, `app.js` usa el mismo origen. La URL de Render está fija en el HTML y no se separa por entorno.

#### Cambios aplicados en la revisión (archivo por archivo)
**`frontend/index.html`**
- `#demoBadge`: «Modo demo» → **«Modo demostración»**.
- `#btnDemo`: «Probar demo» → **«Ver demostración»**.
- Se **eliminó el aviso en línea** `#googleNotice` y su botón `#btnCloseGoogleNotice` (la clase `.hero-notice` de `styles.css` queda sin uso).
- Se **añadió el modal propio de Scan & Go** `#googleModal` (`.modal-overlay` + `.google-modal-card`) con `#btnCloseGoogleModal` (✕) y `#btnGoogleModalOk` («Entendido»), `role="dialog"`, `aria-modal="true"`, `aria-labelledby="googleModalTitle"`, `aria-describedby="googleModalDesc"`.
- Texto del acceso de correo: «Acceso con correo (demostración)» → **«Acceso de demostración (no crea cuenta ni guarda tus datos)»** (histórico; desde la Fase 5 el bloque es el login real: «Inicia sesión con tu correo y contraseña»).

**`frontend/app.js`**
- `handleGoogleAccess()` (aviso en línea con auto-cierre a los 7 s) → **`openGoogleModal()` / `closeGoogleModal()`**: abren/cierran `#googleModal`; cierran con «Entendido», con ✕, con clic en el fondo (overlay) y con **`Escape`**; guardan el disparador en `googleModalTrigger` y **devuelven el foco** al cerrar. El botón «G» sigue **sin** llamar a `POST /api/auth/google`, sin cargar Google Identity Services y sin pedir correo/contraseña/nombre.
- Nuevas funciones de limpieza invocadas al inicio de `init()`: `limpiarDatosFalsosGoogle()` (borra `scango_google_accounts` y cualquier clave `scango_google_*`) y `limpiarPerfilLocalInventado()` (borra `tottus_user` **sin `id` de backend**). No tocan carrito, historial, pedido ni perfiles con `id` válido.
- **Acceso por correo (histórico):** en la Etapa 3 se **eliminó la fabricación de perfil** y se llamaba a `enterDemo()`. En la Fase 5 se reemplazó por el login real contra `POST /api/clientes/login`, que guarda la sesión pública y nunca entra a la demo.
- Mensaje `404` del DNI: «…usa «Probar demo»» → «…usa «Ver demostración»».
- Comentario del binding de `#btnDemo` actualizado a «Ver demostración».

**`frontend/styles.css`**
- Nuevas reglas `.google-modal-card` y `.google-modal-card .modal-close` (botón de cierre arriba a la derecha con `hover` y `:focus-visible`), con diseño propio; **no** imita la interfaz de Google.

**`frontend/tobi-chat.js`**
- Respuesta del asistente para demo/cuenta: menciona «Ver demostración»; desde la Fase 5 invita a crear una cuenta o iniciar sesión con correo y contraseña (ya no menciona el ingreso por DNI).

**Sin cambios en:** `backend/` (Google OAuth intacto), `database/`, configuración de Vercel y Docker (no existen en el repositorio). No se crearon clientes, órdenes ni tokens.

### Validación Etapa 3 (QA, 2026-10-18) — histórico
> **Nota de vigencia:** estas pruebas corresponden al login por DNI, retirado de la interfaz en la Fase 5. `POST /api/clientes/dni` sigue disponible en el backend, pero ya no se usa para autenticar. Las pruebas de registro/login por correo quedaron pendientes de ejecución manual.
Registro de las pruebas ejecutadas sobre el backend + PostgreSQL reales (puerto `3000`, `npm start` → `node src/app.js`). No se crearon clientes ni órdenes y no se eliminaron datos.
- **Cámara y lector:** **verificados manualmente por el usuario en un dispositivo real**, con el frontend desplegado en Vercel. No fue una comprobación automática.
- **Backend activo (salud):** `GET /` → `200` (`{"success":true,...}`); `GET /api/products` → `200`.
- **Login por DNI (histórico) con backend conectado:** **verificado.** `POST /api/clientes/dni` `{ "dni": "99999999" }` → `200` con `{ id, nombre, dni }` (cliente existente).
- **DNI inexistente:** **verificado.** `{ "dni": "12345678" }` → `404` (`"El DNI no esta registrado."`).
- **Formato inválido:** **verificado.** `{ "dni": "abc" }` → `400`; `{}` (sin DNI) → `400`. El frontend no permite continuar ante `404`/`400`.
- **Seguridad estática del login (histórico):** `404`, `!response.ok` y error de red retornaban sin entrar; solo se guardaba `tottus_user` cuando el backend devolvía un `id` real; el `finally` reactivaba el botón y restauraba el texto del acceso; el modo demostración quedaba separado del login por DNI; el botón «G» no llama a `/api/auth/google`.
- **Backend desconectado:** **verificado** (se detuvo únicamente el proceso Node con Ctrl + C; PostgreSQL permaneció encendido). `POST /api/clientes/dni` falló por **conexión** (`curl` exit 7, sin respuesta HTTP), descartando `200`/`400`/`404`. La UI muestra error de conexión, permanece en el login, **no** crea `tottus_user`, **no** activa el modo demostración y reactiva el botón con su texto original.
- **Recuperación tras reinicio:** **verificada.** Reiniciado el backend, `GET /` y `POST /api/clientes/dni` `99999999` vuelven a responder `200`, sin recargar el frontend ni modificar la base de datos.
- **Google OAuth real:** **pospuesto** por falta de `GOOGLE_CLIENT_ID` en el servidor; el botón «G» permanece como aviso «próximamente» y no llama a `POST /api/auth/google`.

### Sesión TOBI conversacional (2026-10-08/09, rama `cambios-texto`)
- Commits: `WIP: Tobi Saltito` → `Tobi saluda al abrirce` → backup → `Agregacion del chat con Tobi` → `Saludo en el chat de Tobi` → `Alergias` → `Recetas` (+ trabajo sin commitear: frecuentes, descuentos, pasos 8.x).
- Saludo en el propio botón (`.tobi-greet` 2.6 s + `.tobi-nudge` 7 s/3.5 s, `prefers-reduced-motion`, diálogos intactos); vista `view-tobi` + `tobi-chat.js` (reglas, typing, scroll); `tobi-history.js` (30/200, `getUserName`, saludo 1×/visita); `tobi-profile.js` (alergias 20/40, frecuentes 30, lista 50); `tobi-recipes.js` (27 recetas, filtro estricto); `tobi-discounts.js` (8 promos, Lima); `tobi-allergens.js` (tabla 14, modal, badges); comprensión (`tobiCanon`, `tobiFollowUp`, 3 botones), sugerencias (máx. 4). SW `tottus-scan-go-v10`.

### Actualización del lector y fallback manual (2026-10-03)
- Se reemplazó la implementación basada en `BarcodeDetector` y `getUserMedia()` directo por `Html5QrcodeScanner` (`new window.Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false)` + `render(onScanSuccess, onScanFailure)`).
- La librería `html5-qrcode` se carga exclusivamente mediante CDN (`<script id="html5qrcode-cdn" src="https://unpkg.com/html5-qrcode">` en `index.html`).
- No se añadió copia local ni dependencia instalada mediante npm.
- Flujo actualizado: la página intenta cargar el CDN → `isScannerLibAvailable()` comprueba `window.__html5QrcodeCdnFailed` y `window.Html5QrcodeScanner` → si está disponible, `updateScannerAvailability()` habilita `#btnStartCamera/#btnStopCamera` y `startCamera()` inicializa el lector en `#reader`; el código detectado se procesa con `onScannedCode()` → `addToCart()`; `stopCamera()` hace `clear()`, vacía `#reader` y restaura “Cámara detenida”.
- Se añadió validación previa antes de inicializar el escáner y manejo de `onerror` del script (`window.__html5QrcodeCdnFailed`) más suscripción única al evento `error` en `init()`.
- Si el CDN falla, la app no crea `Html5QrcodeScanner` (evita `Html5QrcodeScanner is not defined`), deshabilita solo la función de escaneo, muestra “El escáner no está disponible. Puedes ingresar el código manualmente.” en `#scannerStatus` y mantiene habilitado el ingreso manual (`#manualCode`, `#btnManualAdd`, `#codesList`, `#scanResult`).
- Un fallo del lector no bloquea catálogo, carrito, TOBI ni checkout: `init()` evalúa la disponibilidad sin condicionar `renderAll()`/`updateAuthUI()`.

### Bienvenida minimalista y acceso por pasos (2026-10-04)
- La vista inicial muestra solo la tarjeta verde (logo blanco `img/Logo_Tottus-blanco.png`, etiqueta, título, descripción, 3 beneficios) y los accesos a ancho completo (`52px`, `gap:12px`, `max-width:380px`). **Nombres actuales tras la Etapa 3:** ícono «G» de Google (`#btnGoogleAccess`, aviso «próximamente») + «Iniciar sesión» (`#btnGoLogin`) + «Ver demostración» (`#btnDemo`, antes «Probar demo»). El antiguo botón «Crear cuenta» (`#btnGoRegister`) ya no está en el hero; la acción de registro sigue accesible desde `#loginCard`.
- Se eliminaron el botón “Comenzar compra” (`href="#loginForm"`) y la tarjeta blanca de beneficios; cada formulario se abre solo por JS en la misma pantalla (login `#loginCard`, registro `#loginForm`), sin redirigir ni recargar.
- Corrección de visibilidad inicial: `.auth-card { display:grid }` vencía al atributo `hidden`; se añadieron reglas `#loginCard[hidden]` / `#loginForm[hidden] { display:none !important }` y limpieza del hash (`#loginForm`/`#registerForm`) con `history.replaceState` al iniciar y al volver.
- Logotipos: `img/Logo_Tottus.png` (320×320 con 135 px transparentes arriba/abajo, 0 píxeles blancos; el blanco era solo CSS) → recorte `img/Logo_Tottus-cropped.png` (304×66) → variante blanca `img/Logo_Tottus-blanco.png` (verdes a blanco, amarillos conservados). Bienvenida usa la variante blanca sin fondos/cápsulas (`190px/65vw`, `170px` móvil, `200px` escritorio); cabecera conserva el original.

### Migración del lector a Quagga2 horizontal (2026-10-06)
- Diagnóstico HTTPS: `getScannerDiagnosis()` + `classifyScannerError()` (mensajes HTTPS/CDN/permiso/sin cámara/cámara en uso); en HTTP local no se abre la cámara y el ingreso manual sigue activo.
- Cámara trasera preferente (`facingMode: environment`, `fps: 10`), sin auto-apertura, una sola instancia, `scanT0` real con meta `<3s`.
- Estabilidad EAN: normalización a string, doble lectura idéntica (`1800 ms`), validación EAN-13, procesamiento único, mensajes `Producto agregado: [nombre]` / `Código leído correctamente, pero no registrado: [código]`.
- Reemplazo total de `html5-qrcode` por Quagga2 (`quagga2-cdn`, `Quagga.init/start/stop`, un `onDetected` + `offDetected`); visor `#reader` 100% × 260px con guía 85% × 90px y área central `35%/8%/35%/8%`.
- `node --check app.js` OK; cero referencias activas a `Html5Qrcode*` en `index.html`/`app.js`.

### Mensaje de código no registrado (formato exacto + inserción segura)
- `SCANNER_UNKNOWN_MSG`: `"Código leído correctamente, pero no registrado:"` → `"Código de barras no registrado:"` (`app.js`).
- Rama `if (!prod)` en `onScannedCode()`: `innerHTML + replace(<) + perf` → `textContent = SCANNER_UNKNOWN_MSG + " " + code`; muestra el valor real leído/ingresado como texto (ceros intactos), sin HTML dinámico inseguro, reutilizando `#scanResult`; cámara y manual comparten el flujo; anti-duplicado y cámara intactos; flujo exitoso, catálogo (14) y carrito sin cambios.

### Estados visuales del lector por cámara activa/inactiva
- `index.html`: `#reader` con `hidden` inicial + `#scannerIdleHint` (“La cámara está desactivada. Presiona Activar cámara para comenzar.”) + `#scanAlignHint` con `hidden`.
- `styles.css` (scopado `#view-scanner`): `scannerIn` (.32s) + `scanLine` (2.2s, ±34px contenida) solo en `#reader.is-active`; `::before/::after` con `opacity: 0` fuera de activo; transiciones de botones y `disabled: opacity .55`; `prefers-reduced-motion` global existente.
- `app.js`: `+ SCANNER_STARTING_MSG` (“Iniciando cámara...”) y `setScannerVisual(active)` (única función visual); `startCamera`/`stopCamera`/`updateScannerAvailability`/`showView`/`releaseAndFinish` la invocan sin alterar formatos, cámara trasera, `onScannedCode`, manual ni listeners (uno por botón, un `onDetected`).

### Simplificación de textos del lector (pendiente de commit)
- `index.html`: eliminados 2 `<p>` (marco horizontal + distancia 15–25 cm), sin tocar lógica ni botones.
- `styles.css`: `+ .scanner-card > h2 { margin: 0 0 6px }`, `.scanner-idle-hint` a `margin: 2px 0 10px`; `.scanner-viewport` y responsive intactos. `git diff --stat`: solo `frontend/index.html` + `frontend/styles.css`.
