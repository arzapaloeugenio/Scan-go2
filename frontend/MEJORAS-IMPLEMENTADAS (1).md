# 🚀 Scan & Go Tottus — Registro de Mejoras Implementadas

> Documento de trabajo: segunda iteración del proyecto **Tottus Scan & Go** (Universidad Norbert Wiener – Software 1, Proyecto Integrador).
> Fecha: septiembre 2026 · Equipo: Arzapalo, Alva, Cabrejos, Condori · Ciclo: IS4M1.
> **Tercera iteración (octubre 2026):** secciones 10–13 documentan los cambios posteriores (tope 40 + modal, posición TOBI, logo oficial, imágenes reales). **Cuarta iteración (paleta logo):** sección 15 documenta el ajuste visual a los colores del logotipo. **Quinta iteración (acceso + responsive + revisión):** secciones 24–28 (acceso uniforme, bienvenida con 3 botones, dashboard móvil/escritorio, revisión final y visibilidad nav/TOBI solo en dashboard). **Sexta iteración (TOBI conversacional, octubre 2026):** secciones 39–50 (saludo animado y saltito, chat aparte, historial, saludo con nombre, alergias, productos frecuentes, recetas con filtro, descuentos del día, comprensión, alerta en catálogo, lista de compras y sugerencias). Todo el código se genera solo con **Opencode**.

Esta carpeta `Scan-Go` contiene la versión final mejorada del proyecto:

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Estructura de la app (6 vistas + robot TOBI + canvas de confeti) |
| `styles.css` | Diseño mobile-first verde/blanco + animaciones del robot y confeti |
| `app.js` | Toda la lógica: auth, carrito, escáner, IGV, pago, QRs, TOBI y confeti |
| `tobi-chat.js` | Chat propio: respuestas por reglas, flujos, pantallas y sugerencias |
| `tobi-history.js` | Historial de conversaciones + nombre del cliente |
| `tobi-profile.js` | Perfil: alergias, productos frecuentes y lista de compras |
| `tobi-recipes.js` | 27 recetas saludables + filtro estricto de alergias |
| `tobi-discounts.js` | Descuentos de ejemplo + vigentes hoy (Lima) |
| `tobi-allergens.js` | Tabla de alérgenos del catálogo + alerta al agregar |
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
| 11 | Saludo animado de Tobi + saltito “ábreme” | ✅ | §39: `.tobi-greet` al abrir + `.tobi-nudge` cada 7 s |
| 12 | Chat aparte con Tobi, sin límite | ✅ | §40: vista `view-tobi`, typing, scroll, Enter |
| 13 | Historial de conversaciones | ✅ | §41: retomar, lista, borrar (30/200) |
| 14 | Saludo con tu nombre 1 vez por visita | ✅ | §42: `getUserName()` + sessionStorage |
| 15 | Registro de alergias | ✅ | §43: pregunta con botones + pantalla Mis alergias |
| 16 | Productos frecuentes | ✅ | §44: pregunta + pantalla Mis productos |
| 17 | Recetas saludables sin tus alérgenos | ✅ | §45: 27 recetas + filtro estricto |
| 18 | Descuentos del día | ✅ | §46: 8 promos demo + pantalla Ofertas |
| 19 | Tobi entiende mejor (sin IA) | ✅ | §47: tipeos, sinónimos, seguimiento, 3 botones |
| 20 | Alerta de alergia en catálogo y carrito | ✅ | §48: tabla 14 productos + modal |
| 21 | Lista de compras + sugerencias rápidas | ✅ | §49–50: Mi lista (tope 50) + fila de hasta 4 |

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

---

## 22. ⚡ “Probar demo” como sesión visual (sin cuenta ni credenciales)

Sin reconstruir acceso. Login, registro, validaciones, 14 productos, lector, carrito, pago y TOBI intactos.

| Cambio | Dónde |
|--------|-------|
| Sesión demo solo en memoria `let demoMode=false`; `enterDemo()` activa el flag y reutiliza `updateAuthUI()` + `showView("home")` (misma vía que abre la tienda al autenticarse), sin abrir login/registro ni pedir datos | `app.js` |
| Eliminado `localStorage.setItem(tottus_user, Cliente Demo...)`; sin cuenta falsa, sin email/DNI, sin contraseñas, sin backend, sin credenciales predeterminadas | `app.js` |
| `updateAuthUI()` contempla `demoMode`: cabecera `Hola, Cliente demo` + `#demoBadge` `Modo demo` visible solo en demo; `showView` guía TOBI también en demo; `firstName()` → `Cliente` e `isAdultUser()` → `true` en demo para no limitar catálogo/escáner/carrito más allá de RN02/40 | `app.js`, `index.html` |
| `Salir` restablece: `demoMode=false` + `stopCamera/stopQrTimer/botClose` + reutiliza `window._scanGoShowWelcome()` (oculta formularios, restaura 3 botones, limpia `#loginForm/#registerForm`, sin recarga) + `updateAuthUI()`; solo estado temporal, catálogo intacto | `app.js` |
| Listener único `btnDemo → enterDemo` con guarda `_demoBound`; `Comenzar compra` sin referencias en código (solo mención histórica en docs), nada que eliminar en JS/HTML | `app.js` |
| Botón terciario intacto + estados discretos `hover/focus-visible/active` sin animaciones; etiqueta `#demoBadge` blanca discreta con `hidden` inicial | `styles.css`, `index.html` |

**Verificación:** `node --check app.js` OK; 3 botones iniciales; demo abre dashboard sin formularios con `Modo demo`; catálogo/escáner/carrito operativos; `Salir` regresa a bienvenida con formularios ocultos; reingreso sin eventos/productos duplicados; sin errores de consola.

---

## 23. ✨ Pulido final de acceso (un solo estado, sin nuevas funciones)

Sin reconstruir acceso ni añadir funciones/listeners duplicados. Dashboard, productos, lector, carrito, pago y TOBI intactos.

| Cambio | Dónde |
|--------|-------|
| Estados únicos `loginHero` / `loginCard` / `loginForm`; hero con `id` y `hidden` real (`display:none`, no solo `visibility`); inicial solo bienvenida; limpieza de `#loginForm/#registerForm` sin hashes | `index.html`, `styles.css`, `app.js` (`setIntroHidden/showWelcome`) |
| Transición breve `fadeSlide .22s` (opacidad + vertical suave) en `.view/.auth-card/.login-card`; `prefers-reduced-motion` la anula con cambio inmediato | `styles.css` |
| Unificación: `--muted:#607069`, gaps `12/16px`, radios `12/14/16px`, campos y botones `min-height:48px`, forms `420px`, hero `520px`, `:focus-visible` verde oscuro, `auth-switch` también en login | `styles.css` |
| Accesibilidad: `aria-expanded/aria-controls` en Iniciar/Crear, `aria-hidden` sincronizado en hero/cards, `aria-live` en 9 errores/confirmación, `label for`, `autocomplete email/current-password/new-password`, `inputmode numeric`, foco a correo/nombre y retorno a su botón, sin autofocus inicial | `index.html`, `app.js` |
| Enlace faltante `¿No tienes cuenta? Crear cuenta` (`#btnGoRegisterFromLogin → showRegister`); el inverso ya existía; foco y una sola tarjeta por vez conservados | `index.html`, `app.js` |
| Seguridad re-verificada: sin contraseñas en `localStorage`/`sessionStorage`/consola/URL; registro demo sin cuenta real; demo en memoria sin credenciales | `app.js` |

**Verificación:** `node --check` OK; flujos 1–5 (login, registro, enlaces, demo, recarga sin forms/hash/errores); 320–1366 sin scroll horizontal ni superposición TOBI/navegación.

---

## 24. 🎨 Mejora visual del acceso existente (solo `styles.css`)

Solo diseño. Login, registro y “Probar demo” funcionan igual; sin cambios de lógica, validaciones, OTP, dashboard, dependencias ni servicios externos.

| Cambio | Dónde |
|--------|-------|
| Una sola vista visible: bienvenida / login / registro ya excluyentes; se conserva logo blanco + amarillo sobre fondo verde y 3 botones a todo el ancho | `index.html` intacto, `.hero-auth .hero-btn` |
| Tarjetas blancas uniformes con sombra suave y `16px`: `.auth-card` y `.login-card` con mismo `max-width:420px`, `padding:20px`, `gap:12px`, `border:1px solid var(--border)`, `border-radius:16px`, `box-shadow:var(--shadow)` | `styles.css` (`.auth-card, .login-card`) |
| Títulos, campos, botones y espaciado uniformes: `h2 19px`, `label 14px`, `input min-height:48px + font-size:16px`, `form gap:12px` | `styles.css` (`.auth-card/.login-card h2, p, form, label, input`) |
| Etiquetas visibles en todos los campos y controles 👁️ conservados con área táctil `48px` sin tapar texto (`padding-right:52px`) | `styles.css` (`.pass-wrap`, `.pass-toggle`) |
| Sin bordes verdes gruesos en acceso: eliminado `border-top:3px` de registro; `#view-login .btn-ghost` con `1px solid var(--border)` (el `.btn-ghost` global del dashboard no se toca) | `styles.css` (`#view-login .btn-ghost`) |
| Transición discreta al cambiar de vista: `fadeSlide .25s` en `#loginHero, #loginCard, #loginForm` | `styles.css` |
| TOBI no cubre campos/botones: `margin-bottom:84px` en tarjetas (`96px` en `<=430px`) + `scroll-margin-bottom:110px` y `overflow-x:clip` en `#view-login` | `styles.css` |
| `320-430px`: tarjetas con `padding:16px` y margen inferior amplio; campos/botones `>=48px`; sin scroll horizontal | `styles.css` (`@media max-width:430px`) |

**Verificación:** ningún formulario visible al cargar; sin `#loginForm/#registerForm` en URL; campos y botones `>=48px`; `320-430px` sin solapes; login, registro y demo siguen operativos. `git diff --stat`: solo `frontend/styles.css`.

---

## 25. 🔑 Bienvenida con tres botones: Iniciar sesión / Continuar con Google / Probar demo

Sin “Crear cuenta” independiente en la bienvenida. Lógica de login, registro, demo, validaciones y TOBI intacta.

| Cambio | Dónde |
|--------|-------|
| Botón `#btnGoRegister` (“Crear cuenta”) eliminado de `.hero-auth`; nuevo `#btnGoogle` (“Continuar con Google”, texto exacto) entre “Iniciar sesión” y “Probar demo”: bienvenida con exactamente 3 botones | `index.html` |
| Texto del login ajustado a “¿No tienes una cuenta? Crear cuenta”; “Crear cuenta” vive solo dentro del login (`#btnGoRegisterFromLogin → showRegister`, sin hashes ni recarga) | `index.html` |
| `.hero-btn-google`: fondo blanco, texto oscuro, borde gris suave, hereda `min-height:52px` y ancho completo de `.hero-btn`; sin icono (no existe set local en `img/`, sin descargas ni CDN) | `styles.css` |
| `.login-hero` con `padding:20px 16px` para ajustar la tarjeta verde al contenido sin altura fija | `styles.css` |
| `#btnGoogle` con guarda `window._googleBound` (sin listeners duplicados): solo `toast("El acceso con Google estará disponible próximamente")`, sin pedir contraseña, sin simular auth, sin acceso al dashboard | `app.js` |
| `demo` reutiliza `enterDemo()` existente (directo al dashboard, sin cuenta ni credenciales); referencias a `$("btnGoRegister")` ya protegidas con `if`, sin roturas | `app.js` |

**Verificación:** recarga → 3 botones; “Iniciar sesión” → solo login; “Crear cuenta” (dentro del login) → solo registro; “Volver” → bienvenida; Google → aviso sin acceso; demo → dashboard; navegación oculta durante el acceso; `node --check` OK.

---

## 26. 📱💻 Dashboard móvil compacto + escritorio centrado (solo `styles.css`)

Mismo HTML, catálogo (14 productos), carrito, escáner y JavaScript. Sin duplicar nada; móvil/tablet no se tocan entre sí (cada cambio vive en su propio `media query`).

| Cambio | Dónde |
|--------|-------|
| Móvil `320–430px`: cabecera `6px 12px`, logo `110px`, saludo `11px`, carrito `44px`; buscador `min-height:48px` con “Todo/Ofertas” en `44px` dentro del ancho; promo `8px 10px`; 4 pasos en `9px/40px`; escáner `10px`; catálogo 2 columnas `gap:8px`, imagen `110px`; nav fina con botones `44px`; TOBI `bottom:108px/right:12px` | `@media (max-width:430px)` |
| Escritorio `≥1024px`: contenedor `max-width:1100px` centrado; cabecera compacta con logo `130px` y carrito `44px` visible; catálogo **4 columnas** `gap:16px`, imagen `130px`; promo/pasos/escáner compactos en fila; misma navegación de 5 opciones como barra `1100px` (sin duplicar); TOBI `32px/32px` | `@media (min-width:1024px)` |
| Hover discreto solo en compatibles (`translateY(-2px)` tarjetas, `brightness` en botones); `focus-visible` global existente; sin animaciones nuevas | `@media (min-width:1024px) and (hover:hover)` |

**Verificación:** `320/360/390/430` → 2 columnas, sin scroll-x, filtros y pasos en pantalla, nav/TOBI sin cubrir; `1024/1280/1366/1440` → 4 columnas, centrado, sin tarjetas gigantes; escáner, carrito y pago funcionando.

---

## 27. 🔍 Revisión final sin funciones nuevas (solo `styles.css`)

Correcciones puntuales de acabado; cero cambios de lógica (`app.js` e `index.html` intactos, `node --check` OK).

| Cambio | Dónde |
|--------|-------|
| Botones `<44px`: `.icon-btn` base `40px → 44px`; `.codes-list button` con `min-height:44px`; `−/+` del carrito y `✕` de TOBI con área táctil de 44px vía `::after` (`inset:-6px` / `-12px`) sin alterar su tamaño visual ni el layout | `styles.css` |
| Desbordes: `overflow-wrap:anywhere` en `.product-brand`, `.product-code` (EAN largo en tarjetas de ~140px) y `.cart-info` | `styles.css` |
| Contraste/legibilidad: `.bot-name` `9px → 10px` (blanco sobre verde profundo) | `styles.css` |
| Espaciado y superposiciones verificados sin cambios (TOBI, navegación y tarjetas ya con márgenes anti-solape; bienvenida/login/registro/dashboard verificados punto por punto) | — |

**Verificación:** bienvenida (3 botones), login, registro desde login, Google (aviso), demo, dashboard móvil/escritorio, catálogo (14), escáner, carrito, navegación (5) y TOBI (colapsado “T”) operativos; `git diff --stat`: solo `frontend/styles.css`.

---

## 28. 🙈 Navegación y TOBI solo en el dashboard (estado `access` / `dashboard`)

La barra inferior aparecía en bienvenida/login/registro y TOBI antes de entrar. Causa: `.bottom-nav { display:flex }` vence al atributo `hidden` (los estilos de autor tienen prioridad sobre la hoja UA), así que `bottomNav.hidden = true` nunca la ocultaba; y `#botWidget` no tenía ninguna lógica de ocultamiento. Sin cambios de funciones, diseño, productos, escáner, carrito, pago, validaciones ni TOBI.

| Cambio | Dónde |
|--------|-------|
| Estado visual único en `<body>`: `access-mode` / `dashboard-mode`, conmutado solo en `updateAuthUI()` según `logged` (demo, login validado → dashboard; Google sin OAuth no cambia el modo; Salir → acceso) | `app.js` |
| Estado inicial obligatorio en el HTML: `<body class="access-mode">` (bienvenida + 3 botones, sin flash de dashboard antes del JS) | `index.html` |
| `body.access-mode #appHeader/#bottomNav/#botWidget { display:none !important }` (fuera del flujo, sin `opacity`) + `body.access-mode { padding-bottom:0 !important }` (sin espacio reservado de la barra fija) | `styles.css` |

**Verificación:** flujo de 20 pasos (recarga → acceso sin nav/TOBI; login/registro/Google mantienen ocultos; demo → dashboard con nav/TOBI; Salir → bienvenida sin nav/TOBI; recarga → modo acceso); `node --check` OK.

---

## 29. 📱 Acceso móvil a pantalla completa 320–767px (solo `styles.css`)

Sin tocar escritorio, HTML, lógica ni validaciones. El acceso parecía una tarjeta pequeña flotando sobre página vacía con zona blanca debajo.

| Cambio | Dónde |
|--------|-------|
| Contenedor a pantalla completa: `body.access-mode`, `.app-main`, `#view-login` y `#loginHero` con `width: 100%` y `min-height: 100dvh`, sin altura fija | `@media (max-width: 767px)` |
| Verde Tottus continuo: `background: var(--green)` en `body.access-mode` y `#view-login`, `background: transparent` en `.app-main`; sin radio/sombra/borde en `#loginHero` | `@media (max-width: 767px)` |
| Sin tarjeta flotante ni blancos: márgenes exteriores a 0, `padding` seguro `calc(20px + safe-area)` arriba/abajo y `20px` laterales, contenido en columna flex centrada, scroll vertical solo si el contenido supera `100dvh` | `@media (max-width: 767px)` |
| Botones intactos en mismo contenedor: `.hero-auth` `100% / max 380px / gap 12px` centrado, `.hero-btn` `100% / max 380px / min 52px` | `@media (max-width: 767px)` |
| Formularios sobre el mismo fondo verde: `.auth-card/.login-card` `calc(100% - 32px) / max 420px / margin 20px auto`, bienvenida oculta por JS existente, scroll natural en registro | `@media (max-width: 767px)` |
| Ocultos sin reserva: se reutiliza `body.access-mode #appHeader/#bottomNav/#botWidget {display:none}` + `padding-bottom: 0`, más `overflow-x: clip` | `styles.css` base + `@media (max-width: 767px)` |

**Verificación:** `320/360/390/430` con verde a pantalla completa, sin zona blanca, sin scroll-x, botones `52px+`, nav/TOBI ocultos, login/registro reemplazan bienvenida, demo operativo. Escritorio intacto.

---

## 30. 💻 Acceso escritorio en dos columnas 1024px+ (solo `styles.css`)

Móvil intacto, mismo HTML y misma lógica. Se reemplaza la tarjeta pequeña centrada por pantalla completa `55% / 45%` sin duplicar formularios.

| Cambio | Dónde |
|--------|-------|
| Rejilla escritorio: `#view-login` `display: grid`, `55% / 45%`, `min-height: 100vh`, contenido centrado verticalmente; `1024–1366px` equilibrado y `≥1440px` con `max-width: 1400px` centrado | `@media (min-width: 1024px)` + `@media (min-width: 1440px)` |
| Panel izquierdo verde `55%` con `#view-login::before` (base `160deg #40a629→#3f752f→#01855d→#044d29`) y `#view-login::after` como marco scanner con esquinas amarillas | `@media (min-width: 1024px)` |
| Patrones solo CSS, discretos, sin texto/emojis/fotos/CDN: puntos circulares del logo (`radial 24px`), hojas/frescos (radiales blancos/amarillos suaves), código de barras (`repeating-linear 72px` abajo), marco de lectura (`::after`) y líneas suaves del recorrido (radiales amplios) | `@media (min-width: 1024px)` |
| Sin duplicar HTML: `#loginHero {display: contents}` (también con `[hidden]`) para que logo/título/descripción/beneficios sean ítems de la columna 1 y `pill/auth/cards` de la columna 2 | `@media (min-width: 1024px)` |
| Derecha `45%`: bienvenida con `pill + auth` (`100% / max 420px / min 52px / gap 12px` centrados, sin repetir beneficios); login/registro con `.auth-card/.login-card` `max 420px`, `max-height: calc(100vh - 64px)` y scroll solo en panel derecho | `@media (min-width: 1024px)` |
| Login/registro conservan la izquierda: `:has(#loginCard:not([hidden]))` y `:has(#loginForm:not([hidden]))` re-muestran `h1/desc/steps` ocultos por JS solo en escritorio; `pill/auth` siguen ocultos y no hay formulario bajo la bienvenida | `@media (min-width: 1024px)` |
| Dashboard/nav/TOBI ocultos sin reserva mediante `body.access-mode` existente; Google conserva aviso sin acceso falso; `overflow-x: clip`, sin scroll horizontal | `styles.css` base + `@media (min-width: 1024px)` |

**Verificación:** `1024/1280/1366/1440` a pantalla completa, corporativo a la izquierda y acceso a la derecha, sin blancos grandes, login/registro reemplazan solo la derecha, nav/TOBI ocultos, móvil intacto. Solo `frontend/styles.css`.

---

## 31. 🟢 Corrección de contraste de “Probar demo” en escritorio (solo `styles.css`)

En móvil se veían los 3 botones; en escritorio el tercero parecía desaparecer. El botón seguía en el HTML y funcionaba, era invisible.

| Cambio | Dónde |
|--------|-------|
| Causa: `.hero-btn-tertiary {background: transparent; color: #fff; border: 1.5px solid #fff}` diseñado para fondo verde; al pasar `.hero-auth` al panel derecho blanco en escritorio quedó blanco sobre blanco | `styles.css:193` + `@media (min-width: 1024px)` |
| Corrección mínima solo escritorio: `body.access-mode #view-login #btnDemo {background: #40a629; color: #fff; border: 1.5px solid #3f752f}` con `hover/active` por `brightness` y `focus-visible` verde oscuro, mismas esquinas/altura | `@media (min-width: 1024px)` |
| Sin duplicados: un único `#btnDemo` en `index.html:52` dentro de `.hero-auth` y un único listener `btnDemo → enterDemo()` con guarda `_demoBound` | `index.html`, `app.js:976` |
| Comportamiento intacto: `enterDemo()` reutilizada, directo al dashboard sin login/registro/cuenta/credenciales; visible solo en bienvenida y oculto con login/registro/dashboard por `.hero-auth[hidden]` existente; `Volver/Salir` lo recuperan | `app.js` |

**Verificación:** bienvenida con exactamente 3 botones alineados a `100% / max 420px / min 52px / gap 12px` sin salirse del panel; demo abre dashboard con nav/TOBI; `Salir` recupera los 3; móvil intacto; sin scroll-x ni errores.

---

## 32. 🔍 Diagnóstico HTTPS + cámara trasera del lector (solo `app.js`)

Sin cambiar de librería todavía. El lector no explicaba por qué la cámara no abría por IP local HTTP.

| Cambio | Dónde |
|--------|-------|
| Diagnóstico previo `getScannerDiagnosis()` (solo lectura: `isSecureContext`, `mediaDevices`, `getUserMedia`, global de librería, flag de fallo CDN) + `classifyScannerError()` (permiso rechazado, cámara en uso, sin cámara) | `app.js` |
| En origen HTTP inseguro no se intenta abrir la cámara; `#scannerStatus` muestra el mensaje HTTPS y el ingreso manual sigue activo; el fallo CDN conserva su propio mensaje sin confundirse | `app.js` (`startCamera`) |
| Cámara trasera preferente `facingMode: { ideal: "environment" }` (sin `exact`), `fps: 10`, sin auto-apertura, permiso solo en `Activar cámara`, una sola instancia con botón deshabilitado durante la inicialización | `app.js` |
| `scanT0` inicia al quedar preparado el lector y el tiempo real se muestra en `#scanResult` | `app.js` |

**Verificación:** `node --check` OK; HTTP local → mensaje HTTPS; CDN caído → mensaje propio; sin `getUserMedia()` directo como lector; manual intacto.

---

## 33. 📏 Estabilidad EAN-13 con doble lectura (solo `app.js` + textos)

Las lecturas a distancia variaban dígitos y se procesaban valores inestables.

| Cambio | Dónde |
|--------|-------|
| Normalización a string (`trim` + sin espacios/guiones/saltos), conserva ceros, sin `Number`, sin autocorrección, sin parciales; numérico 6–14 dígitos; EAN-13 con dígito verificador (los 14 códigos registrados se aceptan tras doble lectura) | `app.js` (`normalizeScanText/isNumericCode/isValidEan13/isRegisteredCode`) |
| Candidato + contador: dos detecciones idénticas en `1800 ms` para aceptar; reinicio si cambia un dígito; sin aviso de “no encontrado” antes de confirmar; procesado único (`scanProcessing` + último confirmado 3000 ms) | `app.js` (`onScanSuccess`) |
| Registrado exacto → `onScannedCode()` + `addToCart(code, 1)` una vez + `Producto agregado: [nombre]` + detención; desconocido → `Código leído correctamente, pero no registrado: [código]`, sin agregar | `app.js` (`onScannedCode`) |
| `qrbox` función responsive (~85% ancho, ~3:1) y zoom moderado solo si el track lo admite | `app.js` |

**Verificación:** `node --check` OK; una lectura agrega una sola unidad; manual reutiliza `onScannedCode()`.

---

## 34. 🔄 Migración del lector a Quagga2 (adiós interfaz QR)

`Html5QrcodeScanner` generaba `Select Camera`, `Stop Scanning`, marco cuadrado QR y visor vertical. Se eliminó `html5-qrcode` del código activo (sin ocultar con CSS) y se usa solo Quagga2 1D.

| Cambio | Dónde |
|--------|-------|
| Eliminado CDN `https://unpkg.com/html5-qrcode` (`html5qrcode-cdn`); añadido único CDN `https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.2/dist/quagga.min.js` (`quagga2-cdn`); sin npm ni copia local | `index.html` |
| Eliminadas referencias activas a `Html5QrcodeScanner`, `Html5Qrcode`, `Html5QrcodeSupportedFormats` en `index.html`/`app.js` (cero coincidencias) | `index.html`, `app.js` |
| `buildQuaggaConfig()`: `LiveStream` en `#reader`, `facingMode: environment`, `locate: true`, `frequency: 10`, lectores `ean_reader, ean_8_reader, upc_reader, upc_e_reader, code_128_reader` (sin QR) | `app.js` |
| `Activar cámara` → `Quagga.init()` + `Quagga.start()`; `Detener` → `Quagga.stop()` + `offDetected()` + vaciado de `#reader` + botones restablecidos; un solo `onDetected` (`ensure/detach`, sin duplicados) | `app.js` |

**Verificación:** `node --check` OK; `new window.Html5Qrcode*` inexistente; un `.onDetected(`; manual intacto; `PRODUCTS` y 14 códigos intactos.

---

## 35. ↔️ Visor horizontal Quagga2 con guía propia (solo `app.js` + `index.html` + `styles.css`)

El visor debía dejar de parecer un lector QR.

| Cambio | Dónde |
|--------|-------|
| `#reader`: `width 100%`, `height 260px`, `max-height 300px`, `aspect-ratio 4/3`, `radius 16px`, `#111`, `relative`, `overflow hidden`; video/canvas Quagga2 al 100% con `object-fit: cover` absoluto | `styles.css` |
| Guía propia `::before` (85% × 90px ≈3:1, borde blanco 3px, `pointer-events: none`) + línea central `::after` (verde); sin esquinas QR; texto externo `Alinea todas las barras dentro del rectángulo`; ingreso manual debajo | `styles.css`, `index.html` |
| Área de detección central `top 35% / right 8% / bottom 35% / left 8%` (franja horizontal ~84% × 30%) | `app.js` (`buildQuaggaConfig`) |
| Textos: título `Lector de código de barras` (sin emoji), instrucción de marco horizontal, ayuda 15–25 cm, activo `Cámara activa. Alinea las barras dentro del rectángulo.` | `index.html`, `app.js` |

**Verificación:** marco 272×90 (320px) a 366×90+ (430px); sin `Select Camera`/`Stop Scanning`; video sin deformar; `320–430px` sin scroll-x.

---

## 36. 🏷️ Mensaje exacto de código no registrado (solo `app.js`)

Cámara y manual comparten `onScannedCode()`; el texto anterior no coincidía con el formato pedido y usaba `innerHTML`.

| Cambio | Dónde |
|--------|-------|
| `SCANNER_UNKNOWN_MSG`: `"Código leído correctamente, pero no registrado:"` → `"Código de barras no registrado:"` | `app.js` |
| Rama `if (!prod)`: `innerHTML + code.replace + perf` → `textContent = SCANNER_UNKNOWN_MSG + " " + code` (valor real como texto, ceros intactos, inserción segura, reutiliza `#scanResult`) | `app.js` (`onScannedCode`) |
| Flujo exitoso (`7750123450013` → Leche Gloria + `addToCart`), manual, anti-duplicado, cámara, 14 productos y carrito intactos; sin dependencias ni listeners nuevos | — |

**Verificación:** `node --check` OK; revisión lógica: no registrado muestra `Código de barras no registrado: [número leído]` una sola vez.

---

## 37. 📷 Estados visuales del lector según cámara activa/inactiva (sin tocar su lógica)

El visor negro, el marco y la línea verde aparecían antes de pulsar “Activar cámara”.

| Cambio | Dónde |
|--------|-------|
| `#reader` con `hidden` inicial (sin visor ni altura reservada) + `#scannerIdleHint` (“La cámara está desactivada. Presiona Activar cámara para comenzar.”) + `#scanAlignHint` con `hidden` | `index.html` (`#view-scanner`) |
| `scannerIn` (.32s opacidad + vertical) y `scanLine` (2.2s contenida ±34px) solo en `#reader.is-active`; `::before/::after` con `opacity: 0` fuera de activo; botones con transiciones y `disabled: opacity .55` (todo scopado `#view-scanner`, `prefers-reduced-motion` global) | `styles.css` |
| `+ SCANNER_STARTING_MSG` (“Iniciando cámara...”) y `setScannerVisual(active)` (única función visual: visor + hints); `startCamera` (ambos botones disabled durante arranque, visor oculto hasta `start()` OK), éxito (visor + marco + línea, `Activar` off / `Detener` on), errores/stop/`releaseAndFinish` (ocultan visor, botones a inactivo, manual intacto, mensajes existentes) | `app.js` |
| Sin cambios de librería, formatos EAN/UPC/CODE-128, cámara trasera, `onScannedCode`, productos, carrito, login, pago, TOBI; sin `setTimeout` nuevo de estado; sin duplicados | — |

**Verificación:** `node --check` OK; entrar muestra solo hint; activar OK revela visor/marco/línea; detener restaura; reactivar sin instancias/listeners extra; manual operativo apagado.

---

## 38. ✂️ Simplificación de textos del lector (solo `index.html` + `styles.css`, pendiente de commit)

| Cambio | Dónde |
|--------|-------|
| Eliminados los 2 `<p>` (“Coloca todas las barras dentro del marco horizontal.” y “Mantén el código quieto, bien iluminado y a una distancia de 15 a 25 cm.”); conservados título, `#scannerIdleHint` (solo apagada), `#scanAlignHint` (solo activa), `.scanner-viewport`, botones y manual | `index.html` |
| `+ .scanner-card > h2 { margin: 0 0 6px }`, `.scanner-idle-hint` a `margin: 2px 0 10px`; sin contenedores vacíos (clases genéricas), sin cambios de colores/tamaños/responsive/animaciones | `styles.css` |

**Verificación:** grep 0 coincidencias de los textos eliminados; idle solo apagada; visor/marco/línea solo activa; `git diff --stat`: solo `frontend/index.html` + `frontend/styles.css`. Sin commit, sin prueba física.

---

## 39. 👋 Saludo animado de Tobi + saltito “ábreme”

Tobi es un solo personaje: el botón flotante de la esquina inferior derecha (antena, cabeza, cuerpo con la “T”). Nada de robots dentro del diálogo.

| Qué hace | Cómo se usa |
|----------|-------------|
| Al presionar la “T”, el propio Tobi saluda 2.6 segundos: se inclina, cierra los ojos feliz con la boca abierta y mueve su brazo (que solo aparece durante el saludo) | Presiona la “T”, cierra con ✕ y vuelve a abrir: el saludo se repite |
| Con el panel cerrado, la “T” da un saltito leve cada ~7 segundos (el primero a los ~3.5 s) hasta que la presionas por primera vez | Entra con demo y espera sin presionar: verás el saltito |
| Con movimiento reducido activado, no hay saltos: Tobi queda sonriente y quieto | Accesibilidad del sistema, sin configurar nada en la app |

**Verificación:** textos del panel idénticos; `prefers-reduced-motion` sin movimiento; sin librerías.

---

## 40. 💬 Chat aparte con Tobi

| Qué hace | Cómo se usa |
|----------|-------------|
| Pantalla propia (`view-tobi`) para conversar sin límite de mensajes | En el panel de Tobi pulsa **💬 Chatear con Tobi**; vuelve con **← Volver** |
| Burbujas (tú en verde a la derecha, Tobi en blanco a la izquierda), campo de texto con Enviar y envío con Enter | Escribe y pulsa Enter |
| Scroll automático al último mensaje e indicador “Tobi está escribiendo...” | Se ve solo mientras Tobi “piensa” (~1 s) |
| Si algo falla, Tobi lo dice con amabilidad y el chat sigue funcionando | Mensajes de error amables, sin pantallas rotas |
| Tobi responde por reglas (saludos + ayuda de escaneo, carrito, pago, caja, salida, ofertas y cuenta), **no por IA** | Pregunta “cómo pago”, “ofertas”, “qué es Tobi”... |

**Verificación:** cómodo en celular y escritorio; sin API keys en el frontend (la conexión a IA futura está comentada en `tobi-chat.js`).

---

## 41. 🕘 Historial de conversaciones

| Qué hace | Cómo se usa |
|----------|-------------|
| Todo lo conversado se guarda solo en tu navegador, de la más reciente a la más antigua (título + fecha y hora) | Pulsa **🕘 Historial** dentro del chat |
| Al tocar una conversación se abre con todos sus mensajes y puedes seguir escribiendo | Toca cualquier conversación de la lista |
| Botón de nueva conversación, borrar una (con confirmación) y borrar todo (con confirmación) | Botones dentro del panel; si no hay nada verás “Aún no tienes conversaciones” |
| Al reabrir el chat retoma la última conversación | Cierra y vuelve a entrar al chat |

**Verificación:** tope 30 conversaciones y 200 mensajes por conversación; si el guardado falla, el chat sigue funcionando con un aviso discreto.

---

## 42. 👋 Saludo con tu nombre (una vez por visita)

| Qué hace | Cómo se usa |
|----------|-------------|
| La primera vez que abres el chat en una visita, Tobi te saluda por tu nombre (“Hola, Cliente, qué gusto verte de nuevo…”) | Abre el chat; recarga la página y reabre: no se repite |
| Al cerrar la pestaña y volver a abrir la app, vuelve a saludar | Cierra la pestaña, reabre y entra al chat |
| El nombre sale de tu perfil guardado (`tottus_user`); en demo es “Cliente” | Automático, sin configurar nada |

**Verificación:** una sola función lo define (`getUserName()`); el nombre nunca sale a consola ni a internet.

---

## 43. 🛡️ Registro de alergias

| Qué hace | Cómo se usa |
|----------|-------------|
| La primera vez que abres el chat, Tobi pregunta con amabilidad si tienes alergias, con botones: “Sí, tengo alergias”, “No tengo alergias”, “Prefiero responder después” | Abre el chat y responde con los botones |
| Si dices que sí, dictas (“maní, lácteos y mariscos”), Tobi las repite y pide “¿Las guardo?” antes de guardar | Confirma con “Sí, guardar” o cancela |
| “No tengo” se guarda como estado propio; “Después” vuelve a preguntar discretamente como máximo una vez en la visita | Automático |
| Fuera de ese flujo entiende “tengo alergia a…”, “soy intolerante…”, “mis alergias”, “agrega/quita alergia” | Escríbelo tal cual en el chat |
| Pantalla **Mis alergias**: ver, agregar, editar (✏️), eliminar (🗑️ con confirmación) y borrar todas (con confirmación) | Botón **🛡️ Mis alergias** en el chat |

**Verificación:** sin duplicados, tope 20, nombres de 40 caracteres; Tobi solo registra lo que declaras (sin consejos médicos); datos sensibles solo en tu navegador.

---

## 44. 🛒 Productos frecuentes

| Qué hace | Cómo se usa |
|----------|-------------|
| Tras lo de alergias, Tobi pregunta qué sueles comprar (“Sí, te cuento” / “Después”), lo repite y lo guarda al confirmar | Dicta (“leche, pan y arroz”) y confirma |
| Si algo está en el catálogo te lo dice (“lo tenemos en el catálogo”), sin agregarlo al carrito | Automático al guardar |
| Entiende “suelo comprar…”, “mis productos”, “agrega/quita producto” | Escríbelo en el chat |
| Pantalla **Mis productos**: agregar, editar, eliminar y borrar todos (con confirmación) | Botón **🛒 Mis productos** en el chat |

**Verificación:** sin duplicados, tope 30; no interrumpe consultas a medias (cada flujo respeta al otro).

---

## 45. 🍲 Recetas saludables (con filtro estricto de alergias)

| Qué hace | Cómo se usa |
|----------|-------------|
| 27 recetas peruanas sencillas (desayuno, almuerzo, cena, snack) con tiempo, porciones, ingredientes y pasos | Botón **🍲 Recetas** o escribe “¿qué puedo cocinar?” |
| **Ninguna receta con tus alérgenos aparece. Sin excepciones** (leche/lactosa excluye queso, yogur, mantequilla, crema, etc.) | Registra “lactosa” y comprueba: fuera quinua con leche, yogur con fruta, humita, smoothie y demás lácteos |
| Si una alergia no se reconoce, esas recetas también se excluyen y se te avisa | Mensaje de precaución en el panel |
| Ordenadas por lo que ya tienes (“tienes / te falta”); si faltan datos, Tobi pregunta antes | Automático según tu perfil |
| Cada receta muestra qué alergias se excluyen + aviso fijo de médico/nutricionista | Visible en cada pantalla |

**Verificación:** prueba lactosa (arriba) → 18 tarjetas seguras, 0 fugas.

---

## 46. 🏷️ Descuentos del día

| Qué hace | Cómo se usa |
|----------|-------------|
| Tobi informa las ofertas vigentes hoy (8 promos de ejemplo por día de semana y fechas, hora de Lima) | Escribe “ofertas de hoy” o pulsa **🏷️ Ofertas** |
| Los % de productos salen del propio catálogo (una sola fuente de precio) | Igual número que la etiqueta amarilla del catálogo |
| Si un frecuente tuyo está en oferta te lo destaca (“Tu producto arroz está con −15% hoy”), salvo choque con alergias (marcado ⚠️, nunca recomendado) | Registra “arroz” y pregunta |
| La primera vez que abres el chat en la visita puede mencionarlo en una línea (“Hoy hay X ofertas, ¿quieres verlas?”) con “Ver ofertas / Ahora no”, una sola vez y sin interrumpir | Automático |
| Cada tarjeta lleva al producto en el catálogo (filtro Ofertas + resaltado), sin agregarlo al carrito | Toca una tarjeta |
| Sin ofertas hoy: mensaje amable + sugerencia del catálogo | Automático |

**Verificación:** en consola `tobiDiscountsToday(new Date('2026-10-12T12:00:00'))` simula el lunes; nota fija de precios en el panel.

---

## 47. 🧠 Tobi entiende mejor (sin IA)

| Qué hace | Cómo se usa |
|----------|-------------|
| Entiende sinónimos, variantes y errores de tipeo (“lactoza”, “ofetas”, tu “pero ninguna lleve leche cierto”) | Escríbelo con tus palabras |
| Responde seguimientos con datos reales: “¿alguna lleva leche?”, “¿son seguras?”, “¿tienen gluten?”, “¿qué alergias tengo?”, “¿qué excluyes?” (si no lo sabe, lo dice sin inventar) | Pregunta sobre lo que ves en pantalla |
| Si no entiende, en vez del mensaje genérico ofrece 3 botones probables | Escribe algo raro como “zzzqqq” |

**Verificación:** la lógica anterior sigue intacta; el historial guarda tu texto original.

---

## 48. ⚠️ Alerta de alergia en catálogo y carrito

| Qué hace | Cómo se usa |
|----------|-------------|
| Tabla local de los 14 productos (etiquetas o “composición no verificada”; **demo: validar con fabricantes**) | Automático, sin configurar |
| Al agregar algo que coincide con tu alergia, aviso **antes** de agregar, con “Agregar igual / No agregar” (suave si no está verificado: “revisa la etiqueta”) | Con “lactosa”, agrega la Leche al carrito |
| Etiqueta discreta “⚠️ Contiene X” en la tarjeta, solo con alergias registradas (nada si no hay o elegiste “sin alergias”) | Mira el catálogo con alergias registradas |
| Nunca dice “seguro”, solo coincidencias + recuerda verificar la etiqueta; si el aviso falla, el producto se agrega igual | El flujo de compra nunca se bloquea |

**Verificación:** prueba lactosa + leche (arriba); Inca Kola muestra el aviso suave.

---

## 49. 🧾 Lista de compras desde una receta

| Qué hace | Cómo se usa |
|----------|-------------|
| En el detalle de cada receta, botón “Agregar lo que me falta a mi lista” (compara con tus frecuentes; enlaza equivalentes o marca “No disponible”; omite choques con alergias; jamás toca el carrito) | Abre una receta y pulsa el botón |
| Pantalla **Mi lista**: marcar ✓ comprado, quitar, vaciar (con confirmación), tope 50 | Botón **🧾 Mi lista** en el chat |

**Verificación:** estado vacío amable; guardada solo en tu navegador.

---

## 50. ⚡ Sugerencias rápidas

| Qué hace | Cómo se usa |
|----------|-------------|
| Fila discreta al abrir el chat y tras cada respuesta: “Ofertas de hoy”, “¿Qué cocino hoy?”, “Mis alergias”, “¿Cómo pago?”, “Mi lista”… | Toca un botón: o escribe por ti o abre su pantalla |
| Cambian según tu contexto (sin alergias → “Registrar mis alergias”; con recetas → “Ver recetas”; con ofertas → “Ofertas de hoy”), máximo 4, sin repetir las recién mostradas | Automático |
| Se ocultan durante confirmaciones pendientes para no interrumpir | Escribe y confirma algo para verlo |
| Scroll horizontal en celular, estilo verde actual | Sin configurar nada |

**Verificación:** `prefers-reduced-motion` respeta todo lo anterior (sin movimiento); sin librerías nuevas en ninguna mejora.

---

## 51. 🔵 Ícono decorativo de Google en la portada (reemplazo del botón horizontal)

Fase intermedia: el botón blanco horizontal “Continuar con Google” se eliminó y se colocó solo el ícono `<i class="fa-brands fa-google">` centrado encima de “Iniciar sesión” y “Probar demo”.

| Cambio | Dónde |
|--------|-------|
| Eliminado `<button id="btnGoogle" class="hero-btn hero-btn-google">Continuar con Google</button>` de `.hero-auth`; orden: ícono, “Iniciar sesión”, “Probar demo” | `index.html` |
| Agregada una sola CDN Font Awesome 6.5.2 (`cdnjs …/font-awesome/6.5.2/css/all.min.css`), reutilizada después sin duplicar | `index.html:9` |
| Ícono decorativo `<i class="fa-brands fa-google hero-google-icon" aria-hidden="true">` (sin `button`/`a`, sin foco, sin acción) | `index.html` |
| Estilo `.hero-google-icon`: centrado `justify-self:center`, `30px`, blanco sobre verde móvil y `#4285F4` solo en columna derecha blanca de escritorio 1024px+ | `styles.css` + `@media (min-width:1024px)` |
| Eliminado bloque exclusivo `#btnGoogle` con guarda `window._googleBound` y su `toast`; eliminada clase `.hero-btn-google` | `app.js`, `styles.css` |
| “Iniciar sesión” y “Probar demo” intactos en ancho, estilo y funcionamiento | — |

**Verificación:** sin texto visible “Continuar con Google”; solo 2 botones; `node --check` OK; responsive móvil/escritorio. Estado superado por §52 (el ícono pasó a botón real).

---

## 52. 🔵 Botón circular de Google accesible y responsive (PC + móvil)

El ícono decorativo aislado de §51 se convirtió en un `button` real, circular y compacto, con colores Scan & Go. Sin integración OAuth real.

| Cambio | Dónde |
|--------|-------|
| `<i class="hero-google-icon">` → `<button type="button" id="btnGoogleAccess" class="btn-google-circle" aria-label="Continuar con Google"><i class="fa-brands fa-google" aria-hidden="true"></i></button>`, primero en `.hero-auth` | `index.html:51` |
| `.btn-google-circle`: circular `52x52` (`48x48` e ícono `20px` en `≤430px`), `border-radius:50%`, `display:grid; place-items:center`, `justify-self:center`, `margin:2px 0`, `cursor:pointer`, sin ancho completo ni absolutos | `styles.css` + `@media (max-width:430px)` |
| Colores corporativos reutilizados: fondo `var(--green)`, borde `2px solid var(--yellow)`, ícono `#fff` solo vía `.btn-google-circle .fa-google` (sin tocar la clase global de Font Awesome); hover `var(--green-dark)`; active `scale(.94)`; focus-visible con contorno `var(--yellow)` + sombra `rgba(63,117,47,.5)` | `styles.css` |
| Sin celeste: eliminados `.hero-google-icon` y `#4285F4` (0 coincidencias); CDN Font Awesome única, sin duplicar | `styles.css`, `index.html:9` |
| `handleGoogleAccess()` + listener único con guarda `window._googleAccessBound` sobre `#btnGoogleAccess`: solo `toast("El acceso con Google aún no está configurado en esta demo")`, sin simular sesión, sin credenciales/tokens, sin recarga | `app.js` |
| “Iniciar sesión”, “Probar demo”, catálogo, Quagga2 y TOBI intactos | — |

**Sin integración real:** falta OAuth de Google (Client ID, SDK/redirect, validación en backend y sesión). El botón es una respuesta visible controlada, no un login.

**Verificación:** botón real con foco teclado (Enter/Espacio) y `aria-label`; un clic = una acción; `node --check` OK; PC conserva dos secciones con grupo centrado y `gap:12px`; `320/375/430` sin solapes ni scroll-x.
