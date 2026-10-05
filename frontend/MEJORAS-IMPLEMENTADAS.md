# 🚀 Scan & Go Tottus — Registro de Mejoras Implementadas

> Documento de trabajo: segunda iteración del proyecto **Tottus Scan & Go** (Universidad Norbert Wiener – Software 1, Proyecto Integrador).
> Fecha: septiembre 2026 · Equipo: Arzapalo, Alva, Cabrejos, Condori · Ciclo: IS4M1.
> **Tercera iteración (octubre 2026):** secciones 10–13 documentan los cambios posteriores (tope 40 + modal, posición TOBI, logo oficial, imágenes reales). **Cuarta iteración (paleta logo):** sección 15 documenta el ajuste visual a los colores del logotipo. Todo el código se genera solo con **Opencode**.

Esta carpeta `Scan-Go` contiene la versión final mejorada del proyecto:

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Estructura de la app (5 vistas + robot TOBI + canvas de confeti) |
| `styles.css` | Diseño mobile-first verde/blanco + animaciones del robot y confeti |
| `app.js` | Toda la lógica: auth, carrito, escáner, IGV, pago, QRs, TOBI y confeti |
| `DOCUMENTACION-TECNICA.md` | Documentación técnica completa actualizada |
| `MEJORAS-IMPLEMENTADAS.md` | **Este documento:** registro de las mejoras de esta iteración |
| `img/` | Logotipo (`Logo_Tottus.png`) + 14 fotos reales de productos |
| `manifest.json` + `sw.js` | PWA mínima (manifest instalable + SW cache-first) |

---

## 1. Resumen de mejoras

| # | Mejora solicitada | Estado | Dónde |
|---|-------------------|--------|-------|
| 1 | Robot guía con temática Tottus que saluda por nombre | ✅ | `botSay()`, widget `#botWidget` |
| 2 | TOBI guía el escaneo de productos paso a paso | ✅ | `botGuideView("scanner")` |
| 3 | TOBI explica cómo pagar desde el celular | ✅ | `botGuideView("checkout")` + `payNow()` |
| 4 | Carrito con máximo de productos justificado | ✅ | `MAX_ITEMS = 150` (2.ª iteración; vigente `40`, ver §10) |
| 5 | QR seguro para validación en Caja | ✅ | `issueCajaQR()`, 5:00 min |
| 6 | QR seguro para validación en Seguridad (salida) | ✅ | `issueSalidaQR()`, 3:00 min |
| 7 | Confetis + "¡Felicidades por tu compra!" al finalizar | ✅ | `confettiBurst()` |
| 8 | Explicación al cliente de la seguridad del QR | ✅ | Notas 🔒 en pantalla + TOBI |
| 9 | Login mejorado | ✅ | Botón 👁️ ver contraseña + saludo de TOBI |
| 10 | Interfaz más dinámica y atractiva | ✅ | Animaciones, burbuja parlante, confeti |

---

## 2. 🤖 TOBI — El robot guía de Tottus

### 2.1 Concepto
TOBI es una mascota asistente exclusiva de la app, con los colores institucionales de Tottus (verde `#00a651`, verde oscuro `#044d29`, lima `#5df08d`). Está construido **100% en CSS puro** (sin imágenes externas), lo que garantiza:

- Carga instantánea (RNF03: < 2 s en 4G).
- Cero dependencias externas adicionales.
- Escalado perfecto en cualquier resolución móvil.

### 2.2 Anatomía visual (CSS)
```
        ◉ ← antena (luz pulsante, box-shadow animado)
      ╭─────╮
      │ ●● │ ← cabeza blanca, ojos que parpadean (keyframes `blink` 4s)
      │  ‿  │ ← sonrisa
      ╰──┬──╯
       │ T │ ← cuerpo verde con la "T" de Tottus
       ╰──╯
      TOBI ← etiqueta con su nombre
```

### 2.3 Comportamiento
| Momento | Mensaje de TOBI |
|---------|-----------------|
| Carga de la app (sin sesión) | Se presenta: "¡Hola! Soy Tobi 🤖🌿, el robot guía de Tottus..." |
| Login exitoso | **Saluda con el nombre registrado**: "¡Hola, María! Soy Tobi, tu guía..." y resume los 3 pasos |
| Acceso demo | "Estás en el modo de prueba de Tottus Scan & Go..." |
| Vista Escáner | Explica la cámara, el marco verde y el ingreso manual |
| Primer producto agregado | Felicita y explica que total/IGV se actualizan |
| Vista Carrito | Explica controles −/+ y el límite de 40 productos (compra rápida) |
| Carrito llega a 40 | Abre el modal de tope y redirige a pagar o a caja tradicional |
| Vista Pago | Explica los métodos (Yape/Plin/Tarjeta) |
| QR de Caja emitido | **Explica la seguridad**: un solo uso, 5 min, regeneración anula |
| Pase de Salida emitido | Último paso: mostrar a seguridad, caduca en 3 min |
| Compra autorizada | 🎉 "¡FELICIDADES POR TU COMPRA!" + invitación a volver |

### 2.4 Interacciones
- **Efecto de escritura**: los mensajes se "tipean" letra por letra (16 ms/carácter) con cursor parpadeante ▋.
- **Clic en TOBI**: reabre el último mensaje si la burbuja está cerrada.
- **Botón ✕**: cierra la burbuja.
- **Autocierre**: cada mensaje se oculta solo tras 11–16 segundos.
- **Cierre de sesión**: la burbuja se cierra automáticamente.

### 2.5 Implementación técnica (`app.js`)
```js
botSay(html, keepMs)   // función central: burbuja + typing + animación "talking"
botGuideView(name)     // guía contextual por vista (scanner, cart, checkout)
firstName()            // extrae el primer nombre del usuario registrado
```

---

## 3. 🎊 Confeti de celebración

- **Canvas overlay propio** (`#confettiCanvas`): sin librerías externas (funciona offline).
- **160 partículas** en la paleta de marca: verde Tottus, verde oscuro, lima, blanco y dorado.
- Física simple: gravedad incremental, deriva horizontal, rotación propia.
- Duración: ~4.5 segundos; luego el canvas se limpia solo.
- Respeta `prefers-reduced-motion` (accesibilidad).
- Se dispara en `validateSalida()` — cuando **Seguridad valida la salida** — junto al encabezado "🎊 ¡Felicidades por tu compra!" y el mensaje de TOBI.

**Objetivo comercial:** reforzar dopaminérgicamente la compra sin colas → animar a repetir (alineado al objetivo del informe: mejorar experiencia y rentabilidad).

---

## 4. 🛒 Límite del carrito: 40 productos (compra rápida — vigente)

> Valor original de 2.ª iteración: `150`. Evolucionó a `205` (Fase 1, objetivo del informe) y finalmente a **`40`** por la regla de negocio RN-CAJA-RÁPIDA (ver §10). La justificación de fraude de la tabla siguiente sigue vigente.

### Justificación
| Consideración | Análisis |
|---------------|----------|
| Compra promedio real en supermercado | ~20–40 ítems por visita |
| Compra grande del mes (familia completa) | 80–120 ítems |
| Apps Scan & Go reales (Walmart, Sam's Club) | topes de 100–200 unidades |
| Riesgo de fraude | a más ítems por ticket QR, mayor exposición si el QR se intercepta |

**Decisión (2.ª iteración): `MAX_ITEMS = 150`** — cubre >99% de las compras reales (incluso las mensuales) y minimiza la ventana de riesgo. El tope se muestra en la UI con barra de progreso (`qty / 150`) y bloqueo con toast + aviso de TOBI al alcanzarlo.
**Decisión vigente: `MAX_ITEMS = 40`** — ver §10 (modal bloqueante a caja tradicional).

---

## 5. 🔒 Seguridad del QR — ruta elegida

### Ruta: "QR efímero encadenado de doble validación"

El problema: un QR estático puede ser **fotografiado/replicado** y usado por otra persona. La solución implementada:

```
PAGO OK → QR-CAJA (token A, 6 dígitos, 5:00 min, 1 solo uso)
                  │  cajero valida → token A MUERE (used=true)
                  ▼
          QR-SALIDA (token B, 6 dígitos NUEVOS, 3:00 min, 1 solo uso)
                  │  seguridad valida → token B MUERE → salida autorizada
                  ▼
              🎊 Todos los QRs del ticket quedan invalidados
```

### Las 5 garantías de seguridad
1. **Caducidad corta (TTL)**: caja 5:00 min (tiempo de sobra para caminar), salida 3:00 min (tramo corto). Al expirar: canvas en escala de grises + estado "⛔ expirado".
2. **Un solo uso**: `used = true` al primer escaneo válido. Una captura posterior es inútil.
3. **Regenerar = anular**: pedir QR nuevo invalida el anterior al instante.
4. **Credenciales distintas por paso**: el QR de caja y el de salida NO comparten token ni código → robar el de caja no permite salir de la tienda.
5. **Contenido firmado**: payload `TOTTUS|ticketId|TIPO|total|code|token|exp|firma` con firma hash, legible pero no falsificable *en la demo*.

### Comunicación al cliente (importante para adopción)
- Nota 🔒 visible bajo cada QR explicando caducidad, un solo uso y a quién mostrarlo.
- TOBI lo explica "en voz alta" en el momento exacto: *"muéstralo solo en la caja", "nadie puede robarte con una captura de pantalla"*.

### ⚠️ Nota honesta (para el informe)
En producción la firma debe ser **HMAC/JWT del lado del servidor** y la validación contra base de datos con nonces (el cliente nunca tiene el secreto). En esta demo académica la firma es `simpleHash` (djb2) simplificada y la validación es local — documentado como limitación conocida, no como vulnerabilidad oculta.

---

## 6. ✨ Login mejorado

- **Botón 👁️ ver/ocultar contraseña** (alterna `type="password"` ↔ `type="text"`).
- **Saludo de TOBI con el nombre real registrado** apenas inicia sesión.
- Se conserva el acceso demo de un toque para exposiciones.
- Textos corregidos: se eliminó "prueba gratis" (confuso) → ahora dice **"modo de prueba"** de la app.

---

## 7. Verificaciones realizadas

| Prueba | Resultado |
|--------|-----------|
| Sintaxis `app.js` (`node --check`) | ✅ sin errores |
| Todos los IDs referenciados en JS existen en HTML | ✅ verificación cruzada automática |
| App servida y abierta en navegador local | ✅ `http://localhost:8123` |
| `DOCUMENTACION-TECNICA.md` actualizada | ✅ objetivos O9/O10, secciones 4.4b/4.4c, 4.7, pruebas 1b/1c |

---

## 8. Cómo ejecutar

```bash
cd Scan-Go
python -m http.server 8000
# abrir http://localhost:8000  (localhost/https requerido para la cámara)
```

**Flujo de descarga rápida (demo):**
Demo → Agregar productos → 🛒 Carrito → Finalizar compra → Pagar desde el celular → Pagar ahora → Validar en Caja → Validar salida → 🎊 ¡Confeti!

---

## 9. Qué sigue (trabajo futuro, sin cambios)

- Backend real (pasarela Yape/Plin, validación HMAC en servidor).
- App del personal de caja/seguridad que escanee QRs reales.
- Boleta electrónica SUNAT en PDF.
- ~~PWA instalable + modo offline~~ ✅ hecho en 3.ª iteración (`manifest.json + sw.js` cache-first).

---

## 10. 🛒 RN-CAJA-RÁPIDA: tope estricto de 40 + modal bloqueante

Nueva regla de negocio: la compra rápida Scan & Go acepta **máximo 40 artículos**; el artículo 41 se deriva a caja tradicional.

| Cambio | Dónde |
|--------|-------|
| `MAX_ITEMS = 205 → 40` | `app.js:5` |
| Módulo `isFastLimitReached() / showFastLimitModal() / hideFastLimitModal()` (validación O(1)) | `app.js` |
| `addToCart()` y `changeQty()` bloquean el 41 con modal + `beep(false)` + toast | `app.js` |
| `onScannedCode()` intercepta la lectura y valida antes de insertar | `app.js` |
| `saveState()` retorna `false` y no guarda si `qty > 40` | `app.js` |
| Modal `#fastLimitModal` con texto exacto “Límite de compras rápidas alcanzado (40 artículos). Dirígete a una caja tradicional para procesar esta compra.”, cierre con botón `Entendido` / clic fuera | `index.html` + `app.js` |
| `.modal-overlay` (`z-index:70`) + `.modal-card` (max 420px, responsive móvil) en verde/blanco base | `styles.css` |
| Textos UI `205 → 40` (beneficios login, carrito, progreso) | `index.html` |

**Rendimiento:** validación + render + recálculo con 40 ítems medido en `0.36ms <2s` (`{qty:40, blocked41:true, under2s:true}`).

---

## 11. 🤖 Posición de TOBI sobre la barra de navegación

El widget chocaba con la barra inferior y se recortaba a la derecha (peor en escritorio). Solo CSS, sin JS:

| Cambio | Dónde |
|--------|-------|
| `.bot-widget` → `bottom:120px !important; right:30px !important` | `styles.css` |
| `@media (min-width:700px)` → `bottom:120px !important; right:max(30px, calc(50% - 310px)) !important` | `styles.css` |
| `.bot-bubble` → `margin-right:10px` + tope `min(260px, calc(100vw - 70px))` (sin desborde) | `styles.css` |
| Cola `.bot-bubble::after` → `right:25px` (apunta al centro de la cabeza) | `styles.css` |

---

## 12. 🟢 Logotipo oficial (`img/Logo_Tottus.png`)

| Cambio | Dónde |
|--------|-------|
| Texto `Tottus` del header → `<img src="img/Logo_Tottus.png" class="main-logo">` | `index.html` |
| Texto `Tottus` del login → misma imagen | `index.html` |
| Ícono redundante `.logo-badge` (“T”) eliminado del header | `index.html` |
| `.main-logo` base 180px (interior) / `#view-login .main-logo` 280px (login), centrada, `filter:brightness(0) invert(1)` (blanco puro sobre verde) | `styles.css` |
| `.app-header` con `background-color:var(--green)` sólida de respaldo | `styles.css` |

Evolución del acabado: mezcla `screen` + `grayscale/invert` → eliminadas al llegar el PNG con transparencia → `brightness(0) invert(1)` final.

---

## 13. 📸 Fotos reales de productos (adiós emojis)

| Cambio | Dónde |
|--------|-------|
| `PRODUCTS`: propiedad `emoji` eliminada, nueva `image` con las 14 rutas de `img/` | `app.js` |
| Catálogo y carrito renderizan `<img src="${p.image}" class="product-image" alt="${p.name}">` | `app.js` (`renderProducts`, `renderCart`) |
| `.product-image`: `100% / 140px / contain` en catálogo; `.cart-item .product-image` 80px compacta | `styles.css` |
| Edad (`calcAge/isAdultUser`) e IGV (`calcTotals`) intactos | — |

⚠️ Discrepancia de archivo: la ruta indicada era `img/NestleSublime.png`, pero el archivo real es `img/NestléSublime.png` (con tilde); se usó el nombre real.

---

## 14. Verificaciones de la 3.ª iteración

| Prueba | Resultado |
|--------|-----------|
| Sintaxis `app.js` (`node --check`) tras cada cambio | ✅ sin errores |
| Límite 40: llenar 40 → intentar el 41 (escáner/botón/+) → modal exacto, sin guardado, `beep(false)` | ✅ |
| Perf 40 ítems: validación + total | ✅ `0.36ms <2s` |
| Sin restos de `emoji` en `app.js` | ✅ 0 coincidencias |
| Solo `styles.css` / `index.html` tocados según cada tarea (JS intacto donde se exigía) | ✅ `git diff --stat` |

---

## 15. 🎨 Paleta alineada al logotipo Tottus (solo `styles.css`)

Ajuste visual para que la interfaz concuerde con `img/Logo_Tottus.png`. Solo colores; sin cambios de estructura, lógica, lector ni TOBI.

| Paleta aplicada | Valor |
|-----------------|-------|
| Verde principal | `#40a629` (botones, cabecera-detalles, acciones importantes) |
| Verde secundario | `#6dba4d` (gradiente progreso, detalles) |
| Verde oscuro | `#3f752f` (textos destacados, bordes, estados activos) |
| Verde profundo | `#01855d` (enlaces / interactivos) |
| Amarillo principal | `#feeb15` (solo promociones, avisos y énfasis) |
| Amarillo suave | `#fcf6c0` (fondos de avisos) |
| Fondo general / superficie | `#ffffff` / `#f5f5f5` |
| Texto principal | `#263238` |

| Cambio | Dónde |
|--------|-------|
| Variables `:root` actualizadas a la paleta del logo (`--green`, `--green-secondary`, `--green-dark`, `--green-deep`, `--yellow`, `--yellow-soft`, `--bg:#f5f5f5`, `--text:#263238`, `--border:#e0e0e0`) | `styles.css` |
| Cabecera a blanco con detalles verdes (`background:#fff`, `border-bottom:3px solid var(--green)`, `search-bar` con borde suave) | `styles.css` (`.app-header`) |
| Logotipo sin filtro `brightness(0) invert(1)` para mostrar colores originales; ruta, tamaño (180px / 280px) y proporciones intactas | `styles.css` (`.main-logo`) |
| Botones principales a `#40a629` sólido con texto blanco; secundarios a blanco con borde `#40a629`; `btn-dark`/activos a `#3f752f` | `styles.css` (`.btn-primary`, `.add-btn`, `.btn-scan`, `.btn-ghost`, `.btn-dark`, `.chip-filter.active`, `.bottom-nav .active`) |
| Amarillo solo en promociones/avisos (`promo-banner`, `login-pill`, `discount-tag`, `qr-secure-note` en `#fcf6c0` con texto `#263238`) | `styles.css` |
| Tarjetas blancas con bordes suaves y fondo general `#f5f5f5`; inputs y fondos saturados pasan a blanco/gris claro | `styles.css` (`body`, `.card`, `.login-card input`, `.product-img`, `.ticket pre`) |
| TOBI, lector (`#reader`), `index.html` y `app.js` intactos; sin nuevas dependencias | — |

**Validación:** texto legible sobre blanco/amarillo, botones con contraste, sin saturación de verde/amarillo, layout móvil intacto (`max-width:640px`, `@media 700px` sin cambios).

---

## 16. 📱 Estructura móvil compacta (solo `styles.css`)

| Cambio | Dónde |
|--------|-------|
| Cabecera a la mitad: `padding:8px 16px`, radio `16px`, borde inferior gris `1px`; logo `120px` + carrito `40px` en la misma fila | `.app-header`, `.header-inner`, `.main-logo`, `.icon-btn` |
| Buscador a ancho completo con `flex-wrap` (`input flex:1 1 120px/min-width:0`, chips `12px` sin desborde; “Todo” y “Ofertas” siempre visibles) | `.search-bar`, `.chip-filter` |
| Bordes verdes gruesos eliminados (`login-card/totals-card/qr` de 6–8px a 3px o ninguno; resto a `1px` gris `#dfe5dd`) y sombras ligeras | `styles.css` general |
| Ancho seguro `16px` laterales (`.app-main`), `overflow-x:hidden` global y `min-width:0` en flex/grid | `html, body, .app-main, .product-grid, .hero-steps, .steps-mini` |
| Fondo `#f5f7f4`, superficies `#ffffff`, esquinas `14–16px`, espaciado `8/12/16px` | `:root`, `.card` |

---

## 17. 🏷️ Promoción, pasos y tarjeta de escaneo (solo `styles.css`)

| Cambio | Dónde |
|--------|-------|
| Promo compacta: ticker repetido oculto (`display:none`), fondo `#fcf6c0`, texto verde oscuro, CTA “Ver ofertas” en `#feeb15` con `min-height:44px` | `.promo-banner`, `.promo-ticker`, `.promo-main` |
| 4 pasos en una fila (`min-height:44px` táctil, `ellipsis`, solo el activo en verde, resto blancos) | `.steps-mini`, `.step-mini` |
| Tarjeta de escaneo reducida (horizontal en pantallas suficientes, vertical limpia bajo `360px`, botón “Escanear” priorizado `56px`) | `.scan-cta`, `.btn-scan` |
| Iconos: sin set local en `img/` (solo logo + productos), se conservan los emojis actuales; sin librerías ni CDN | — |

---

## 18. 🛒 Catálogo 2 columnas + navegación y TOBI sin superposición (solo `styles.css`)

| Cambio | Dónde |
|--------|-------|
| 14 productos intactos; 2 columnas `repeat(2,minmax(0,1fr))` entre 320–430px; tarjetas igualadas (`height:100%`, botón con `margin-top:auto/min-height:44px`); imagen `contain 120px`; hover solo en `@media (hover:hover)` | `.product-grid`, `.product`, `.product-img`, `.add-btn` |
| Navegación fija inferior de ancho completo (`bottom:0`, fondo blanco, borde superior gris, sombra superior suave, botones `48px`) con las 5 opciones; solo la activa resaltada | `.bottom-nav` |
| Espacio inferior `body padding-bottom:128px` para que la navegación no tape productos ni botones | `body` |
| TOBI colapsado con “T” (lógica intacta): `right:16px/bottom:96px` en móvil sobre la navegación; `32px/32px` esquina inferior derecha en escritorio | `.bot-widget` |

---

## 19. 👋 Bienvenida comercial + logotipo sin caja blanca

| Cambio | Dónde |
|--------|-------|
| Hero compacta `max-width:520px` (padding `20px` móvil / `24px` escritorio, radio `22px`, fondo sólido `#40a629`, círculos sutiles, sin degradados intensos ni emojis grandes) | `.login-hero` |
| Logotipo: `Logo_Tottus.png` 320×320 con 135 px transparentes arriba/abajo y 0 píxeles blancos (el blanco era CSS) → recorte `Logo_Tottus-cropped.png` (304×66) → variante blanca `Logo_Tottus-blanco.png` (verdes a blanco, amarillos intactos); bienvenida sin fondos/cápsulas (`190px/65vw`, `170px` móvil, `200px` escritorio); cabecera conserva el original | `img/`, `index.html` (solo `src` de bienvenida), `.login-logo` |
| Formulario de acceso separado `28px` debajo (`max-width:520px`); TOBI sin superposición | `.login-card` |

---

## 20. 🔑 Acceso minimalista por pasos (`index.html` + `styles.css` + `app.js`)

| Cambio | Dónde |
|--------|-------|
| Vista inicial: solo bienvenida + 3 botones (`#btnGoLogin` amarillo, `#btnGoRegister` blanco, `#btnDemo` transparente con borde blanco; `52px`, `gap:12px`, `max-width:380px`); eliminados “Comenzar compra” y tarjeta de beneficios | `index.html`, `.hero-auth`, `.hero-btn-*` |
| Login (`#loginCard`/`#emailLoginForm`): título + texto corto, email + contraseña con etiquetas, toggle 👁️, enlace visual de recuperación, “Ingresar” verde y “Volver” discreto; errores bajo cada campo; tarjeta blanca `max-width:420px` (`20px` móvil / `24px` escritorio) | `index.html`, `.auth-card`, `.field-error` |
| Registro (`#loginForm` “Crear cuenta”): campos y validaciones RN02 intactos + botón “Volver” (`#btnBackToWelcomeReg`) | `index.html` |
| Interacción por JS sin hash ni recargas: cada botón muestra solo su formulario en la misma pantalla con foco al primer campo; “Volver” restaura, devuelve el foco y limpia el hash con `history.replaceState`; demo reutiliza el acceso existente; guardia `window._emailLoginBound` (sin listeners duplicados); contraseña nunca en `localStorage`/consola | `app.js` |
| Corrección inicial: `.auth-card { display:grid }` vencía a `hidden` → reglas `#loginCard[hidden]` / `#loginForm[hidden] { display:none !important }` | `styles.css` |

---

## 21. 📝 Formulario “Crear cuenta” con validación por campo (sin backend)

Solo acceso/registro. Login (`#loginCard`), demo, catálogo, escáner, carrito, pago, salida y TOBI intactos.

| Cambio | Dónde |
|--------|-------|
| `#loginForm` con `novalidate`: 6 campos únicos (nombre, correo, contraseña, confirmar contraseña, DNI, nacimiento) con `label for` visible + `input` + `<p class="field-error" aria-live="polite">` debajo de cada campo | `index.html` |
| Controles: toggle independiente `Contraseña` (`#btnTogglePass`) y `Confirmar` (`#btnTogglePassConfirm`), aviso RN02 +18 existente, `Crear cuenta` (`btn-primary` verde) + `Volver` (`btn-ghost` discreto) + `¿Ya tienes una cuenta? Iniciar sesión` (`#btnGoLoginFromRegister`, `type="button"`, sin hash) | `index.html` |
| DNI solo números: `inputmode="numeric"`, `maxlength="8"`, `pattern="\d{8}"` + filtro `replace(/\D/g,"").slice(0,8)` en `input` | `index.html`, `app.js` |
| Helpers `setRegError()` / `clearRegisterErrors()` / `validateRegisterField()` / `validateRegisterAll()`; errores por campo con `aria-invalid`, limpieza al corregir (`input`/`change`), re-chequeo de confirmación al cambiar la original | `app.js` |
| Submit valida todo, enfoca el primer error, no borra otros campos; éxito solo muestra `Registro de demostración completado. Se requiere un servidor para crear una cuenta real.` en `#registerSuccess` + `toast`, limpia ambas contraseñas y no guarda nada | `app.js` |
| Seguridad: sin `localStorage`/`sessionStorage`/consola/URL con contraseñas; comentario técnico `registro real requiere servidor + almacenamiento seguro` en el submit | `app.js` |
| Navegación reutiliza `showRegister` / `showEmailLogin` / `showWelcome` + `calcAge`: un solo formulario visible, foco a `loginName`, `Volver` restaura bienvenida + limpia errores/contraseñas + foco a `btnGoRegister` sin recarga ni cambio de URL; guardas `_registerBound` / `_registerToggleBound` / `_emailLoginBound` | `app.js` |
| Estilo login reutilizado: `.login-card` blanca `max-width:420px`, `gap:16px`, `input min-height:48px`, `.field-error`/`.form-success`/`.auth-switch`, `margin-bottom:32px` para que TOBI/navegación no tapen controles; `overflow-x:hidden` global | `styles.css` |

**Verificación:** `node --check app.js` OK; registro oculto inicial; solo registro visible; envío vacío → 6 errores; DNI letras/7-9 dígitos; mismatch; fecha futura; `Volver` → bienvenida; `Iniciar sesión` → solo login; sin scroll horizontal; TOBI no cubre botones.
