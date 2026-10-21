# 🚀 Scan & Go Tottus — Registro de Mejoras Implementadas

> Documento de trabajo: segunda iteración del proyecto **Tottus Scan & Go** (Universidad Norbert Wiener – Software 1, Proyecto Integrador).
> Fecha: septiembre 2026 · Equipo: Arzapalo, Alva, Cabrejos, Condori · Ciclo: IS4M1.
> **Tercera iteración (octubre 2026):** secciones 10–13 documentan los cambios posteriores (tope 40 + modal, posición TOBI, logo oficial, imágenes reales). **Cuarta iteración (paleta logo):** sección 15 documenta el ajuste visual a los colores del logotipo. **Quinta iteración (acceso + responsive + revisión):** secciones 24–28 (acceso uniforme, bienvenida con 3 botones, dashboard móvil/escritorio, revisión final y visibilidad nav/TOBI solo en dashboard). **Sexta iteración (TOBI conversacional, octubre 2026):** secciones 39–50 (saludo animado y saltito, chat aparte, historial, saludo con nombre, alergias, productos frecuentes, recetas con filtro, descuentos del día, comprensión, alerta en catálogo, lista de compras y sugerencias). **Séptima iteración (backend Node/Express/PostgreSQL, octubre 2026):** secciones 53–54 documentan la API REST (modelos, controladores y rutas sobre las tablas de `backend/database/init.sql`) y la corrección de la ruta `/api/products`; §55–§57 la integración del catálogo y la búsqueda por código del frontend con la API. **Cierre del backend (octubre 2026):** §58–§61 documentan el registro de compras con detalles y transacción (`orden_detalle`, `POST /api/ordenes`), la conexión del pago del frontend (botón *Pagar* + protección anti doble pago), el historial desde PostgreSQL con respaldo local y la auditoría final del backend. **Octava iteración (ingreso por DNI + Google «próximamente», octubre 2026):** §62 documenta el ingreso por DNI contra el backend real, la desactivación segura de Google (modal propio, sin OAuth en el frontend), el modo demostración claramente etiquetado y la validación QA de la Etapa 3 (el login por DNI fue retirado en la Fase 5, §64). **Fase 2A (octubre 2026):** §63 documenta la separación estricta entre modo demo y cliente real en catálogo, búsqueda, pagos e historial, eliminando el fallback al cliente 1. **Fase 5 (octubre 2026):** §64 documenta el registro e inicio de sesión reales con correo y contraseña, bcrypt, la migración `password_hash`, la sesión local mínima y el retiro del login por DNI de la interfaz. Todo el código se genera solo con **Opencode**. **Diagnóstico Fase 5 (octubre 2026):** §65 documenta la verificación estática de registro/login, la consulta agregada segura para Neon y el estado de Git, sin cambios de código ni de datos.

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
| 9 | Login mejorado | ✅ | §64: login real por correo/contraseña (`POST /api/clientes/login`) + toggle 👁️ + saludo de TOBI |
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
| 22 | Registro real con correo y contraseña | ✅ | §64: `POST /api/clientes/registro` + bcrypt (costo 10) |
| 23 | Login real y retiro del acceso por DNI | ✅ | §64: `POST /api/clientes/login`; el DNI queda solo como dato de registro |

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
- **Login real:** `#emailLoginForm` normaliza el correo y envía `{ correo, password }` a `${API_BASE_URL}/api/clientes/login`. Solo acepta la sesión con HTTP OK, `success:true` e `id` entero > 0; un 400/401/500 o un error de red muestra un mensaje controlado en `#authStatus` y no entra a la demo.
- **Registro real:** `#loginForm` envía `{ nombre, dni, correo, password, passwordConfirm, fechaNacimiento }` a `${API_BASE_URL}/api/clientes/registro`; un 201 guarda la sesión pública, limpia los campos e ingresa al dashboard.
- **Saludo de TOBI con el nombre real registrado** apenas inicia sesión o se crea la cuenta.
- **Demo separada:** se conserva el acceso demo de un toque, pero solo mediante `#btnDemo` → `enterDemo()`.
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
| Interacción por JS sin hash ni recargas: cada botón muestra solo su formulario en la misma pantalla con foco al primer campo; “Volver” restaura, devuelve el foco y limpia el hash con `history.replaceState`; la demo se activa solo con `#btnDemo`; guardia `window._emailLoginBound` (sin listeners duplicados); contraseña nunca en `localStorage`/consola | `app.js` |
| Corrección inicial: `.auth-card { display:grid }` vencía a `hidden` → reglas `#loginCard[hidden]` / `#loginForm[hidden] { display:none !important }` | `styles.css` |

---

## 21. 📝 Formulario “Crear cuenta” con validación por campo (validación local; alta real desde §64)

> **Nota de vigencia (§64, Fase 5):** este formulario ya **no** es una simulación. El submit valida localmente y envía `POST /api/clientes/registro`; con 201 guarda la sesión pública y limpia todos los campos. Las filas de “éxito sin backend” describen el estado histórico de esta sección.

Solo acceso/registro. Login (`#loginCard`), demo, catálogo, escáner, carrito, pago, salida y TOBI intactos.

| Cambio | Dónde |
|--------|-------|
| `#loginForm` con `novalidate`: 6 campos únicos (nombre, correo, contraseña, confirmar contraseña, DNI, nacimiento) con `label for` visible + `input` + `<p class="field-error" aria-live="polite">` debajo de cada campo | `index.html` |
| Controles: toggle independiente `Contraseña` (`#btnTogglePass`) y `Confirmar` (`#btnTogglePassConfirm`), aviso RN02 +18 existente, `Crear cuenta` (`btn-primary` verde) + `Volver` (`btn-ghost` discreto) + `¿Ya tienes una cuenta? Iniciar sesión` (`#btnGoLoginFromRegister`, `type="button"`, sin hash) | `index.html` |
| DNI solo números: `inputmode="numeric"`, `maxlength="8"`, `pattern="\d{8}"` + filtro `replace(/\D/g,"").slice(0,8)` en `input` | `index.html`, `app.js` |
| Helpers `setRegError()` / `clearRegisterErrors()` / `validateRegisterField()` / `validateRegisterAll()`; errores por campo con `aria-invalid`, limpieza al corregir (`input`/`change`), re-chequeo de confirmación al cambiar la original | `app.js` |
| Submit valida todo, enfoca el primer error, no borra otros campos. **Histórico:** el éxito solo mostraba `Registro de demostración completado…` en `#registerSuccess`; desde §64 crea la cuenta real, informa “Cuenta creada correctamente” y limpia todos los campos | `app.js` |
| Seguridad: sin `localStorage`/`sessionStorage`/consola/URL con contraseñas; desde §64 el perfil público guardado excluye contraseñas, confirmaciones y hashes | `app.js` |
| Navegación reutiliza `showRegister` / `showEmailLogin` / `showWelcome` + `calcAge`: un solo formulario visible, foco a `loginName`, `Volver` restaura bienvenida + limpia errores/contraseñas + foco a `btnGoRegister` sin recarga ni cambio de URL; guardas `_registerBound` / `_registerToggleBound` / `_emailLoginBound` | `app.js` |
| Estilo login reutilizado: `.login-card` blanca `max-width:420px`, `gap:16px`, `input min-height:48px`, `.field-error`/`.form-success`/`.auth-switch`, `margin-bottom:32px` para que TOBI/navegación no tapen controles; `overflow-x:hidden` global | `styles.css` |

**Verificación:** `node --check app.js` OK; registro oculto inicial; solo registro visible; envío vacío → 6 errores; DNI letras/7-9 dígitos; mismatch; fecha futura; `Volver` → bienvenida; `Iniciar sesión` → solo login; sin scroll horizontal; TOBI no cubre botones.

---

## 22. ⚡ “Probar demo” como sesión visual (sin cuenta ni credenciales)

Sin reconstruir acceso. Login, registro, validaciones, 14 productos, lector, carrito, pago y TOBI intactos.

> **Nota de vigencia (§62):** el botón pasó a llamarse **«Ver demostración»** y su distintivo **«Modo demostración»**; la etiqueta `Modo demo` descrita aquí quedó superada.

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
| Seguridad re-verificada: sin contraseñas en `localStorage`/`sessionStorage`/consola/URL; desde §64 el registro crea una cuenta real y la demo sigue en memoria sin credenciales | `app.js` |

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

> **Nota de vigencia (§62):** «Probar demo» hoy es **«Ver demostración»**; el botón «Continuar con Google» se convirtió después en el ícono «G» `#btnGoogleAccess` (§52) que abre un **modal propio**, sin OAuth (§62).

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

> **Nota de vigencia (§62):** el `toast` de `handleGoogleAccess()` se reemplazó por un **modal propio** `#googleModal` (cierre con «Entendido», ✕, clic en el fondo y `Escape`; foco gestionado). «Probar demo» hoy es **«Ver demostración»**.

**Verificación:** botón real con foco teclado (Enter/Espacio) y `aria-label`; un clic = una acción; `node --check` OK; PC conserva dos secciones con grupo centrado y `gap:12px`; `320/375/430` sin solapes ni scroll-x.

---

## 53. 🗄️ API REST del backend (Node.js + Express + PostgreSQL)

Se construyó la API REST del backend a partir de las 4 tablas definidas en `backend/database/init.sql` (`cliente`, `producto`, `carrito_virtual`, `sesion_web`), usando solo `express`, `pg`, `cors` y `dotenv` (sin librerías nuevas) y la conexión compartida de `backend/config/db.js` con consultas parametrizadas (`$1`, `$2`).

**Modelos** (`backend/src/models/`, uno por tabla):

| Archivo | Funciones |
|---------|-----------|
| `clienteModel.js` | `crear`, `buscarPorId`, `buscarPorDni`, `listar` |
| `productoModel.js` | `listar`, `buscarPorCodigo`, `listarConDescuento` |
| `carritoModel.js` | `crear`, `buscarPorId`, `buscarActivoPorCliente`, `listarPorCliente`, `listarOrdenesPorCliente`, `actualizarMonto`, `incrementarMonto`, `actualizarEstado` |

**Controladores** (`backend/src/controllers/`): `productoController.js`, `carritoController.js` (carrito + órdenes), `descuentoController.js`, `historialController.js`.

**Rutas** (`backend/src/routes/`): `productoRoutes.js`, `carritoRoutes.js`, `ordenRoutes.js`, `descuentoRoutes.js`, `historialRoutes.js`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Lista el catálogo (`producto`) |
| GET | `/api/productos/:codigoBarras` | Búsqueda por código de barras |
| GET | `/api/carrito/cliente/:idCliente` | Carrito activo del cliente |
| POST | `/api/carrito` | Crea carrito (`{ idCliente }`) |
| GET | `/api/carrito/:id` | Carrito por id |
| POST | `/api/carrito/:id/productos` | Agrega producto (`{ codigoBarras, cantidad }`) |
| DELETE | `/api/carrito/:id/productos/:codigoBarras` | Quita producto (`?cantidad=`) |
| PUT | `/api/carrito/:id/confirmar` | Checkout / estado final |
| GET | `/api/ordenes/cliente/:idCliente` | Órdenes del cliente (§ estado ≠ `activo`) |
| GET | `/api/ordenes/:id` | Orden por id |
| GET | `/api/descuentos` | Productos con `precio_antiguo > precio` |
| GET | `/api/historial/cliente/:idCliente` | Historial (carritos no activos) |

**Notas de diseño (limitaciones del esquema):** no existe tabla de líneas de detalle del carrito, por lo que `agregarProducto`/`quitarProducto` suman o restan `precio × cantidad` al `monto_total` (con `GREATEST(..., 0)`), sin persistir qué productos contiene el carrito. Los descuentos se derivan de `precio_antiguo` y el historial de `carrito_virtual.estado`. La tabla `sesion_web` no tiene endpoints (no se solicitó sesión). El modelo `clienteModel` cubre su tabla y valida la existencia del cliente al crear un carrito.

> **Actualización (ver §58):** desde la fase 3 sí existe la tabla de líneas **`orden_detalle`** y `carritoModel.registrarCompra()`, que persiste cabecera + detalles con transacción. Los endpoints legacy `agregarProducto`/`quitarProducto` siguen ajustando solo `monto_total` del carrito activo (no persisten líneas); el flujo de compra real es `POST /api/ordenes`.

**Registro en `app.js`:** routers importados y montados con `app.use()`, conservando el middleware 404 “Ruta no encontrada” **después** de todas las rutas y el manejador de errores al final. Puerto y credenciales intactos; CommonJS.

**Verificación:** `node --check` sobre `app.js` y los 12 archivos nuevos → 13/13 OK.

---

## 54. 🔧 Corrección: `GET /api/products` no llegaba al controlador

`GET http://localhost:3000/api/products` respondía `{"success":false,"message":"Ruta no encontrada"}`.

**Causa exacta:** desajuste de prefijo. En `app.js` el router de productos estaba registrado solo en `/api/productos` (español), pero la petición es `/api/products` (inglés). Express no encontraba coincidencia y la petición caía en el middleware 404 final. No era problema de controlador, modelo, tabla ni exportación: `productoRoutes.js` existe con `router.get('/')`, se exporta/importa bien, `productoController.listar` consulta la tabla `producto` con SQL parametrizado, y el 404 ya estaba después de las rutas.

| Cambio | Dónde |
|--------|-------|
| Alias en inglés añadido (se conserva el español para no eliminar endpoints): `app.use('/api/products', productoRoutes)` + `app.use('/api/productos', productoRoutes)` | `backend/src/app.js` |

**Archivos modificados:** solo `backend/src/app.js`.

**Ruta final registrada:** `GET /api/products` → `productoRoutes` → `productoController.listar` → `productoModel.listar()` → `SELECT ... FROM producto ORDER BY nombre`.

**Verificación:** `node --check src/app.js` OK; servidor reiniciado; `GET /api/products` → **HTTP 200**, `success: true`, **14 productos** devueltos (ya no cae en “Ruta no encontrada”). Una tabla vacía devolvería 200 con lista vacía, no error de ruta.

---

## 55. 🔌 Catálogo del frontend desde la API (`GET /api/products`) — Paso 2B

El catálogo del frontend dejó de ser solo estático: ahora se carga desde el backend y, si este no responde, se conserva el catálogo local como respaldo. Sin tocar cámara, escáner, carrito, ingreso manual ni Service Worker.

| Cambio | Dónde |
|--------|-------|
| Nueva constante de configuración `API_BASE_URL = "http://localhost:3000"` (punto único de URL) | `frontend/app.js` |
| El arreglo local pasa a llamarse `PRODUCTOS_LOCALES` (se conserva intacto como respaldo) | `frontend/app.js` |
| `let PRODUCTS = PRODUCTOS_LOCALES.slice()` → catálogo **activo** del frontend | `frontend/app.js` |
| `normalizarProductoAPI(item)` → mapea la respuesta del backend a la estructura interna (`code`, `name`, `price`, `oldPrice`, `image`, `restricted`; `codigoBarras` como `String`; `precioAntiguo: null` respetado) y calcula `discount` | `frontend/app.js` |
| `cargarProductosDesdeAPI()` (async) → `GET ${API_BASE_URL}/api/products`, comprueba `response.ok`, valida `success !== false` y arreglo `data`, normaliza y **reemplaza `PRODUCTS`** | `frontend/app.js` |
| `init()` pasa a `async` y hace `await cargarProductosDesdeAPI()` antes de `renderCodesHelp()`/`renderAll()` | `frontend/app.js` |

**Contrato de la respuesta procesada:** `{ success: true, data: [ { codigoBarras, nombre, precio, precioAntiguo, imagen, restringido } ] }` (se acepta arreglo directo o `data`). Rutas de imagen `img/…` reutilizadas sin cambios.

**Fallback:** ante backend apagado, error de red, HTTP no-2xx, JSON inválido, `success:false`, `data` no-arreglo o arreglo vacío/inválido, se mantiene/restaura `PRODUCTOS_LOCALES` y se avisa una vez: `[catalogo] API no disponible; usando catálogo local de respaldo`. En éxito: `[catalogo] N productos cargados desde la API` (N dinámico). Un guard (`catalogoRemotoIntentado`) evita reejecuciones.

**Archivos modificados:** solo `frontend/app.js`.

**Verificación:** `node --check frontend/app.js` OK; con backend activo la consola muestra **14 productos**; con backend apagado la app sigue operando con el respaldo local.

---

## 56. 🔎 Búsqueda por código de barras contra la API — Paso 2C

El escáner y el ingreso manual dejaron de buscar únicamente en el catálogo local: ahora consultan el endpoint real por código, con respaldo local si la petición falla. Sin duplicar lógica y sin tocar la cámara, sus callbacks ni la protección anti-repetición.

| Cambio | Dónde |
|--------|-------|
| Nueva `buscarProductoPorCodigo(codigo)` (async) → `GET ${API_BASE_URL}/api/products/${encodeURIComponent(code)}`; normaliza `String(codigo).trim()` (conserva ceros iniciales); `response.ok` verificado; si el producto no está en `PRODUCTS`, se agrega para que `addToCart()` (sin cambios) lo encuentre | `frontend/app.js` |
| Deduplicación de solicitudes con `busquedasProductoEnCurso` (Map) para la misma lectura rápida | `frontend/app.js` |
| `onScannedCode` pasa a `async` y su búsqueda (`PRODUCTS.find`) se reemplaza por `await buscarProductoPorCodigo(code)` | `frontend/app.js` |
| El ingreso manual reutiliza la **misma** función (sigue llamando a `onScannedCode`) | `frontend/app.js` |

**Endpoint real utilizado:** `GET /api/products/:codigoBarras` (parámetro `codigoBarras`; alias `/api/productos/:codigoBarras`) → `productoController.buscarPorCodigoBarras` → `productoModel.buscarPorCodigo`. Éxito `200 { success:true, data:{…} }`; inexistente `404 { success:false, message:'Producto no encontrado' }`.

**Comportamiento:** HTTP 404 → código no registrado (sin error general, sin agregar al carrito); error de red/backend apagado → respaldo local; si tampoco está local → mismo mensaje de no registrado.

**Archivos modificados:** solo `frontend/app.js`.

**Verificación:** `node --check frontend/app.js` OK; código registrado (manual y cámara) agrega al carrito; código inexistente muestra “no registrado”; con backend apagado el respaldo local sigue funcionando.

---

## 57. 🟥 Mensaje visual de “Código de barras no registrado”

Antes, al ingresar manualmente un código de 13 dígitos inexistente (p. ej. `9999999999999`), `onScannedCode` salía en la rama de EAN inválido y el área de estado bajo el lector seguía mostrando en verde “Lectura inestable…”, sin consultar el backend ni avisar del código no registrado.

**Causa raíz:** una guarda de EAN en `onScannedCode` (`code.length === 13 && !isValidEan13(code) && !isRegisteredCode(code)`) retornaba antes de la búsqueda, escribiendo `SCANNER_UNSTABLE_MSG` en `#scanResult` (texto verde).

| Cambio | Dónde |
|--------|-------|
| Nueva `mostrarEstadoLector(mensaje, esError)`: punto único de salida del mensaje, **reutiliza el elemento existente `#scanResult`**, usa `textContent` y alterna la clase `is-error` | `frontend/app.js` |
| Ventana de bloqueo `ESTADO_LECTOR_MS = 4000` (`estadoLectorBloqueadoHasta` + `estadoLectorTimer`): los mensajes no-error no sobrescriben el error durante su visualización; al expirar se restaura el área | `frontend/app.js` |
| `onScannedCode`: se **elimina la guarda de EAN** (para que todo código numérico llegue a la búsqueda) y sus mensajes pasan por `mostrarEstadoLector`; la rama `!prod` muestra `Código de barras no registrado: [String(code).trim()]` con `esError = true` | `frontend/app.js` |
| Nueva regla `.scan-result.is-error { color: #b71c1c; }` (rojo oscuro, sin verde; conserva el fondo) | `frontend/styles.css` |

**Comportamiento:** código inexistente (manual o cámara) → mensaje rojo `Código de barras no registrado: [codigo]` visible ~4 s y sin agregar al carrito; código registrado → sin cambios (se agrega normal). El bucle de frames del escáner escribe en `#scannerStatus` (otro elemento), por lo que no sobrescribe `#scanResult`.

**Archivos modificados:** `frontend/app.js` y `frontend/styles.css` (un único archivo de estilos, 1 línea). `index.html`, backend, `sw.js`, `manifest.json` y módulos Tobi sin cambios.

**Verificación:** `node --check frontend/app.js` OK; mensaje rojo correcto para ingreso manual y cámara; “Lectura inestable” ya no reemplaza el mensaje de inmediato.

---

## 58. 🧾 Registro de compras con detalles y transacción (`POST /api/ordenes`) — Fase 3

Con las tablas base ya creadas, la compra dejó de ser un simple `monto_total` en el carrito y pasó a persistirse como una **compra completa**: cabecera en `carrito_virtual` + líneas en la nueva tabla `orden_detalle`, todo dentro de **una sola transacción SQL**. Los precios, subtotales y el total se calculan en PostgreSQL; el backend **ignora** cualquier precio o total enviado por el cliente. (Documenta el commit `fase 3: registrar compras y detalles con transaccion`.)

**Esquema (`backend/database/init.sql`):**

| Cambio | Detalle |
|--------|---------|
| Nueva tabla `orden_detalle` | `id`, `id_carrito` → `carrito_virtual(id)` (`ON DELETE CASCADE`), `codigo_barras` → `producto(codigo_barras)` (`ON DELETE RESTRICT`), `cantidad INTEGER CHECK (> 0)`, `precio_unitario NUMERIC(10,2)`, `subtotal NUMERIC(10,2)` |
| Índices nuevos | `idx_orden_detalle_id_carrito`, `idx_orden_detalle_codigo_barras` |
| Cliente de demostración | `INSERT ... ('99999999','Cliente Demo','demo@scan-go.local') ON CONFLICT (dni) DO NOTHING` (id 1; requerido por la FK) |

**Modelo** — `backend/src/models/carritoModel.js`:

| Función | Comportamiento |
|---------|----------------|
| `registrarCompra(idCliente, items)` | `pool.connect()` (cliente único) → `BEGIN` → valida cliente (`SELECT ... WHERE id=$1`; si no existe → `CLIENTE_NO_ENCONTRADO`) → `INSERT` cabecera en `carrito_virtual` con `monto_total=0` → por cada item lee el **precio real** de `producto` (si no existe → `PRODUCTO_NO_ENCONTRADO`) e inserta el detalle con `subtotal = $4::numeric * $3::integer` (aritmética decimal **en SQL**) → total = `COALESCE(SUM(subtotal),0)` y `UPDATE` de la cabecera → `COMMIT`. Ante cualquier error → `ROLLBACK`; `release()` siempre en `finally` |
| `ErrorDatos` | Error de negocio controlado (`código`, `mensaje`, extra) para mapear a **400/404** sin exponer detalles internos de PostgreSQL |

**Controlador** — `backend/src/controllers/carritoController.js` (`registrarCompra`):

| Validación | Respuesta |
|------------|-----------|
| `idCliente \| usuarioId` entero > 0 | `400 idCliente invalido` |
| `items` arreglo no vacío | `400 La compra debe contener al menos un producto` |
| cada item es objeto | `400 Cada item debe ser un objeto valido` |
| `codigoBarras` string no vacío | `400 El codigo de barras es obligatorio` |
| `cantidad` entero > 0 (`Number.isInteger`) | `400 La cantidad debe ser un entero mayor que cero` |
| códigos repetidos | se **agrupan** sumando cantidades antes de persistir |
| éxito | **201** `{ success:true, message:'Compra registrada correctamente', data:{ compraId, total, items } }` |
| producto inexistente | **404** `{ success:false, message:'Producto no encontrado', codigoBarras }` |
| cliente inexistente | **404** `Cliente no encontrado` |

**Ruta** — `backend/src/routes/ordenRoutes.js`: `router.post('/', carritoController.registrarCompra)` (montado en `app.use('/api/ordenes', ordenRoutes)`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ordenes` | Registra la compra completa (cabecera + detalles, transacción) |

**Archivos modificados:** `backend/database/init.sql`, `backend/src/models/carritoModel.js`, `backend/src/controllers/carritoController.js`, `backend/src/routes/ordenRoutes.js`.

**Verificación:** `node --check` OK; compra válida → **201** con total recalculado; carrito vacío / cantidad `0`, negativa o decimal / `codigoBarras` no string → **400**; producto o cliente inexistente → **404**; una compra fallida no deja cabecera ni detalles (rollback comprobado).

---

## 59. 💳 Pago del frontend conectado al backend (botón *Pagar ahora*) — Fase 4

El botón **Pagar ahora** dejó de simular la compra: ahora la registra en el backend **antes** de tocar el carrito y usa como fuente de verdad el total confirmado por el servidor. (Documenta el commit `fase 4: conectar pago del frontend con backend`.)

**Frontend — `frontend/app.js`:**

| Cambio | Detalle |
|--------|---------|
| `const USUARIO_DEMO_ID = 1` | id del cliente demo sembrado en `init.sql` (dni `99999999`) |
| `let pagoEnProceso = false` | **protección anti doble pago**: `payNow()` y `registrarCompra()` salen si ya hay un envío en curso; mientras dura, `#btnPayNow` queda `disabled` con texto “Procesando...” y se restaura en `finally` |
| `async registrarCompra(carrito = cart)` | transforma el carrito `{ codigo: cantidad }` en `items: [{ codigoBarras, cantidad }]` (solo códigos no vacíos y cantidades enteras > 0); `POST ${API_BASE_URL}/api/ordenes` con `{ usuarioId: USUARIO_DEMO_ID, items }`; un único `response.json()`; éxito **solo** si HTTP 2xx + `success===true` + `data.compraId` presente; devuelve `data` o `null` (**nada** se guarda localmente si falla) |
| `async payNow()` | 1) registra la compra en el backend; si falla (red/400/404/500) el carrito se conserva intacto; 2) el **total confiable** es `compra.total` del servidor (si no viene, respaldo a `t.total`); 3) **solo** con la compra confirmada limpia el carrito y guarda la orden, con `compraId` incluido en el ticket |

**Comportamiento:** backend apagado o error de red → `toast("No se pudo conectar con el servidor. Tu carrito se conserva.")` y no se registra ninguna compra (ni local ni remota).

**Frontend nunca envía precios ni totales como fuente de verdad:** el cuerpo solo lleva `usuarioId` y `items` con `codigoBarras`/`cantidad`.

**Archivos modificados:** solo `frontend/app.js`.

**Verificación:** `node --check frontend/app.js` OK; compra válida → **201** y el ticket usa el total del servidor; doble clic durante el envío no duplica la compra; backend apagado → aviso y carrito intacto.

> **Nota de vigencia (§63):** el envío fijo de `USUARIO_DEMO_ID` se reemplazó por el ID real de `currentClienteId()`; en demo no se hace `POST` y en real sin sesión el pago se bloquea.

---

## 60. 🕘 Historial de compras desde PostgreSQL con respaldo local

El historial pasó a leerse del servidor (compras reales con sus productos) y, si el backend no responde, se conserva el respaldo local del navegador. **Cambios pendientes de commit** en el árbol de trabajo.

**Backend — `backend/src/models/carritoModel.js`** (`listarOrdenesPorCliente`, usado por `GET /api/historial/cliente/:idCliente` y `GET /api/ordenes/cliente/:idCliente`):

| Cambio | Detalle |
|--------|---------|
| Cabeceras | `carrito_virtual` con `estado <> 'activo'`, ordenadas `ORDER BY fecha DESC, id DESC` (compra más reciente primero) |
| Detalles agrupados | **segunda consulta** `orden_detalle JOIN producto WHERE id_carrito = ANY($1::int[])` (consulta parametrizada con arreglo), agrupada en memoria por `id_carrito` |
| **Sin N+1** | 1 consulta de cabeceras + 1 consulta de detalles para todas las compras del cliente (no una por compra) |
| Forma de cada compra | `{ compraId, idCliente, fecha, total, estado, items:[ { codigoBarras, nombre, cantidad, precioUnitario, subtotal } ] }` |

**Frontend — `frontend/app.js`:**

| Cambio | Detalle |
|--------|---------|
| `let historialRemoto = null` / `let historialCargando = false` | estado del historial remoto (`null` = aún no cargado o servidor no disponible) |
| `async cargarHistorialRemoto()` | `GET ${API_BASE_URL}/api/historial/cliente/${USUARIO_DEMO_ID}`; si HTTP OK + `success:true` + `data` arreglo → `historialRemoto = data`; sin backend → se conserva el respaldo local (`tottus_history`) |
| `formatearFechaHistorial(fecha)` | fecha `es-PE` segura |
| `historialVista()` | normaliza ambas fuentes (remota y local) al mismo modelo que pinta la UI (`ticketId`, `date`, `total`, `qty`, `method`) |

**Comportamiento:** con backend → historial real del servidor; backend apagado → historial local del navegador; la compra recién pagada aparece en el historial del servidor (misma fuente, PostgreSQL).

**Archivos modificados:** `backend/src/models/carritoModel.js` y `frontend/app.js` (sin commit).

**Verificación:** `node --check` OK en ambos; `GET /api/historial/cliente/1` → **200**, `data` arreglo ordenado de la más reciente a la más antigua, con `items`, cantidades, precios unitarios, subtotales y total correctos; cliente sin compras → **200** con `data: []`; con backend apagado se mantiene el respaldo local.

> **Nota de vigencia (§63):** el historial ya no usa `USUARIO_DEMO_ID` ni el respaldo local en modo real. Demo → `tottus_demo_history`; real sin sesión → sin consulta; real con ID (incluido 1) → `GET /api/historial/cliente/:idReal`, sin mezclar datos locales ante error.

---

## 61. ✅ Auditoría final del backend (validación estática + pruebas en vivo)

Última fase de cierre del backend: revisión estática, `node --check` y pruebas reales contra PostgreSQL, **sin cambios de código** (no hubo defectos que corregir en el flujo principal).

| Comprobación | Resultado |
|--------------|-----------|
| `node --check` (app.js, db.js, 5 rutas, 4 controladores, 3 modelos) | **14/14 OK** |
| Variables de entorno requeridas (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `PORT`) | todas **definidas** (sin mostrar valores) |
| `backend/.env` seguido por Git | **No** (`git ls-files backend/.env` vacío; `backend/.gitignore` incluye `.env`) |
| `.env.example` | sin credenciales reales (`DB_PASSWORD=` vacío) |
| Productos: `GET /api/products` / alias `/api/productos` / búsqueda existente / inexistente / inválido | **200 / 200 / 200 / 404 / 400** |
| `codigoBarras` tratado como **string**, consultas parametrizadas | ✔ |
| Compras: válida / carrito vacío / cantidad 0 / negativa / decimal / producto inexistente / cliente inexistente / precio manipulado / varios + duplicado | **201 / 400 / 400 / 400 / 400 / 404 / 404 / 201 (total recalculado) / 201** |
| Transacción `BEGIN`/`COMMIT`/`ROLLBACK` + `release()` en `finally`; compra fallida sin registros parciales | ✔ (hueco de secuencia sin fila; 0 huérfanos; total = suma de subtotales) |
| Historial: con compras / sin compras / id inválido | **200 / 200 (`data: []`) / 400** |
| Ruta inexistente | **404** |
| Regresión `GET /api/products` tras todas las pruebas | **200** (14 productos) |
| CORS en desarrollo y límite de cuerpo JSON (default 100 KB → **413**) | ✔ |
| SQL por concatenación / errores SQL expuestos / contraseñas en archivos versionados | ninguno |

**Compras de prueba creadas** (datos de prueba que pueden permanecer): `id 21` (10.40), `id 23` (5.20), `id 24` (32.90). El intento fallido consumió la secuencia `id 22` sin crear registro.

**Resultado:** **APROBADO CON OBSERVACIONES**. Sin errores comprobados en el backend principal y **sin archivos modificados** por la auditoría. Observaciones no bloqueantes (mejoras futuras, no implementadas): el parseo de `cantidad` en los endpoints legacy de carrito (`Number.parseInt(x,10) || 1`) trunca decimales; `express.json()` no declara un límite explícito (usa el default de 100 KB); CORS abierto (`*`) apto solo para desarrollo; no existe `.gitignore` en la raíz (no impide nada porque `backend/.gitignore` protege `backend/.env`); autenticación/tokens y rate limiting quedan como trabajo futuro.

---

## 62. 🆔🔵 Ingreso por DNI + Google «próximamente» (Etapa 3) — revisión de seguridad y QA (histórico; DNI retirado en §64)

Fase de cierre del acceso (histórica): el ingreso por DNI **estuvo activo contra el backend real hasta la Fase 5**, cuando se retiró de la interfaz; Google queda **preparado en el backend pero desactivado en el frontend** (sin OAuth y sin selector falso) y la demo queda **claramente etiquetada**. **Sin cambios** en backend, base de datos, Vercel ni Docker.

> **Nota de vigencia (§64, Fase 5):** el login por DNI ya no existe en la interfaz. El acceso real es por correo y contraseña (`POST /api/clientes/login`) y el alta por `POST /api/clientes/registro`. `POST /api/clientes/dni` se conserva en el backend por compatibilidad, pero no se usa para autenticar. Las filas sobre `#dniLoginForm` / `#btnDniLogin` describen el estado histórico de la Etapa 3.

| Cambio | Dónde |
|--------|-------|
| Ingreso por DNI (histórico; formulario retirado en §64): limpiaba a solo dígitos (máx. 8), validaba exactamente 8 (evitaba solicitudes vacías), deshabilitaba `#btnDniLogin` + «Verificando…» mientras consultaba y lo reactivaba al terminar | `index.html`, `app.js` |
| Consulta real `POST /api/clientes/dni` (`{dni}`, `API_BASE_URL`), histórica: **200** identifica (`id`,`nombre`,`dni`); **404** «El DNI no está registrado…»; error de red → mensaje controlado, se queda en el login y **no** crea sesión | `app.js` |
| `localStorage['tottus_user']` guarda el `id` real del backend; desde §64 lo alimentan registro/login por correo y `currentClienteId()` usa ese `id` para historial y registro de compra | `app.js` |
| Google «próximamente»: `#btnGoogleAccess` **no** llama a `POST /api/auth/google`, **no** carga Google Identity Services y **no** pide datos; abre un **modal propio de Scan & Go** `#googleModal` (`#btnCloseGoogleModal`, `#btnGoogleModalOk`), cerrable con «Entendido», ✕, clic en el fondo y `Escape`, con `role="dialog"`, `aria-modal` y foco gestionado (devuelve el foco al disparador) | `index.html`, `app.js`, `styles.css` |
| Eliminado el aviso en línea `#googleNotice` (y `#btnCloseGoogleNotice`) con su `handleGoogleAccess()` y su auto-cierre | `index.html`, `app.js` |
| Renombres de la demo: `#btnDemo` «Probar demo» → **«Ver demostración»**; `#demoBadge` «Modo demo» → **«Modo demostración»**; texto del acceso por correo → «Acceso de demostración (no crea cuenta ni guarda tus datos)» (histórico; desde §64 ese bloque es el login real) | `index.html` |
| Acceso por correo (histórico): en la Etapa 3 ya **no** fabricaba un perfil local ni escribía `tottus_user`; validaba y entraba a `enterDemo()`. Desde §64 es el login real y **no** activa demo | `app.js` |
| Limpieza defensiva al iniciar: `limpiarDatosFalsosGoogle()` (borra `scango_google_accounts` y claves `scango_google_*`) y `limpiarPerfilLocalInventado()` (borra `tottus_user` sin `id` de backend); no tocan carrito, historial, pedido ni perfiles con `id` válido | `app.js` |
| Mensaje 404 del DNI → «…usa «Ver demostración»» (histórico; el formulario ya no existe); la respuesta de TOBI se actualizó en §64 para invitar a correo/contraseña o a la demo | `app.js`, `tobi-chat.js` |
| Sin cambios en backend (`POST /api/auth/google` intacto: exige `credential` real), base de datos, Vercel ni Docker | — |

**Verificación (QA real, 2026-10-18):** health `GET /` OK; DNI existente **200** (`Cliente Demo`, dni 99999999), inexistente **404**, formato inválido **400**; con el backend apagado el frontend muestra «No se pudo conectar con el servidor…» y **no** crea sesión; recuperación correcta tras reiniciar el backend; `POST /api/auth/google` sin `credential` → **400** (OAuth real pospuesto por falta de `GOOGLE_CLIENT_ID`); `node --check` OK; cámara/lector verificados manualmente en Vercel.

**Sin efectos secundarios:** no se crearon ni borraron clientes, órdenes ni datos durante la validación.

> **Nota de vigencia (§63):** el fallback al cliente demo en `currentClienteId()` se eliminó. Ahora devuelve el ID real de `tottus_user` (incluido 1) y `null` en demo o sin sesión válida.

---

## 63. 🧭 Fase 2A — Separación estricta entre modo demo y cliente real

Rama de trabajo: **`fix-local-api-orders`** (octubre 2026). Objetivo: que el modo demo nunca consulte ni escriba datos reales, que el modo real sin sesión no invente un cliente y que **el ID 1 de PostgreSQL deje de estar reservado/bloqueado**. Sin cambios en login, registro, Google Auth, diseño, backend ni base de datos.

### 63.1 Cambios en `frontend/app.js`

| Cambio | Detalle |
|--------|---------|
| `currentClienteId()` | Devuelve `null` si `demoMode === true`, si no existe `tottus_user`, si el JSON es inválido (`try/catch`) o si `id` no es entero positivo. Devuelve el ID real en cualquier otro caso, **incluido `1`**. Sin fallback al cliente demo. |
| `USUARIO_DEMO_ID` eliminado | Se retiró la constante `= 1` y la condición `id === USUARIO_DEMO_ID`. La demo se distingue **solo** por `demoMode`, no por el ID del usuario. |
| `cargarProductosDesdeAPI()` | Demo: usa exclusivamente `PRODUCTOS_LOCALES`, sin `fetch`, y registra `[modo-demo] catálogo local cargado`. Real: consulta la API y registra `[modo-real] catálogo cargado desde la API`. |
| `sincronizarCatalogoConModo()` + `updateAuthUI()` | Al cambiar demo ↔ real se recarga el catálogo del modo correspondiente (sin tocar formularios ni listeners de acceso). |
| `enterDemo()` | Fuerza `PRODUCTOS = PRODUCTOS_LOCALES.slice()` y el log de modo demo; no crea ni escribe `tottus_user`, no depende de PostgreSQL. |
| `buscarProductoPorCodigo()` | Nuevo contrato `{ producto, error }`. Demo: solo catálogo local, sin red. Real: `200` → producto; `404` → “El código EAN … no está registrado”; error de red/CORS → “Error de conexión con el servidor…”, **sin** afirmar que no existe y **sin** activar demo. |
| `onScannedCode()` | Consume `{ producto, error }` y muestra el mensaje correspondiente por `mostrarEstadoLector()`. |
| `registrarCompra()` | **Demo:** no ejecuta `fetch` ni `POST /api/ordenes`, guarda la orden simulada en `tottus_demo_history`, vacía el carrito y muestra “Compra de demostración completada. No se registraron datos reales.” **Real sin sesión:** corta antes del `fetch`, conserva el carrito y pide iniciar sesión. **Real con ID:** `POST /api/ordenes` con el ID real; solo limpia el carrito con **HTTP 201**; 400/404/500/red conservan el carrito y no simulan compra. |
| `payNow()` | Toma un snapshot de ítems antes del pago (para el ticket demo), reutiliza el `ticketId` simulado y muestra el mensaje demo o real según corresponda. |
| `cargarHistorialRemoto()` | Demo: solo lee `tottus_demo_history`, sin llamar a `/api/historial/cliente/1`. Real sin ID: no consulta backend y pide iniciar sesión. Real con ID: `GET /api/historial/cliente/:idReal`; si falla, deja historial vacío/error **sin** mezclar `tottus_history` ni la demo. |
| `historialVista()` / `renderHistory()` | Fuente según modo: demo local, real remota, sin sesión → mensaje “Inicia sesión para ver tu historial de compras.” |
| `getDemoHistory()` / `saveDemoHistoryEntry()` | Lectura/escritura exclusiva de `tottus_demo_history` (máx. 20 entradas). |
| `validateSalida()` | En demo no escribe en `tottus_history` (la orden simulada ya está en `tottus_demo_history`). |

### 63.2 Cambios en `frontend/sw.js`

| Cambio | Detalle |
|--------|---------|
| Caché | `tottus-scan-go-v10` → **`tottus-scan-go-v11`**. El evento `activate` existente elimina los cachés distintos de la versión actual, por lo que el navegador carga el `app.js` nuevo. |

### 63.3 Comportamiento por escenario

| Flujo | Demo (`demoMode=true`) | Real sin sesión | Real con sesión (ID válido, incluso 1) |
|---|---|---|---|
| Catálogo | Solo `PRODUCTOS_LOCALES`, sin red | API `/api/products` | API `/api/products` |
| Escaneo | Solo local | API; 404 = no registrado; red = error de conexión | API con el mismo cliente real |
| Pago | Simulación local; sin `POST`; carrito vaciado | Bloqueado antes del `fetch`; carrito intacto | `POST /api/ordenes` con ID real; limpia solo con 201 |
| Historial | `tottus_demo_history` | No consulta; pide iniciar sesión | `GET /api/historial/cliente/:idReal` |
| `tottus_user` | Nunca se crea | Puede no existir | Fuente del ID real |
| `tottus_history` | No se escribe | No se escribe | Se conserva para el flujo real |

### 63.4 Verificación

| Prueba | Resultado |
|--------|-----------|
| `node --check frontend/app.js` | ✅ OK |
| `node --check frontend/sw.js` | ✅ OK |
| `git diff --check` | ✅ sin errores de whitespace |
| Búsqueda estática: `USUARIO_DEMO_ID` | ✅ 0 coincidencias tras eliminarlo |
| Búsqueda estática: fallback `1` en órdenes/historial | ✅ ninguno; no existe retorno `1` por defecto |
| `GET /` | ✅ **200** |
| `GET /api/products` | ✅ **200** |
| `GET /api/products/7750123450013` | ✅ **200** |
| `GET /api/products/0000000000000` | ✅ **404** JSON (`Producto no encontrado`) |
| `OPTIONS /api/ordenes` (Origin `http://localhost:8000`) | ✅ **204** + `Access-Control-Allow-Origin: http://localhost:8000` |
| `POST /api/ordenes` durante la validación | ❌ no ejecutado (prueba no destructiva) |

**Prueba manual A (demo):** entrar con “Ver demostración” → consola `[modo-demo] catálogo local cargado` → sin requests a `/api/products`, `/api/ordenes` ni `/api/historial` → pagar → mensaje demo → `tottus_demo_history` con la orden y carrito vacío.

**Prueba manual B (real sin sesión):** cerrar sesión o borrar `tottus_user` → catálogo desde API → **Pagar ahora** → “Inicia sesión para completar la compra.”, sin `POST /api/ordenes` y carrito intacto → historial pide iniciar sesión y no llama a `/api/historial/cliente/1`.

**Archivos modificados:** `frontend/app.js`, `frontend/sw.js` y este documento. Sin cambios en backend, base de datos, login, registro, Google Auth ni estilos. **Sin commit.**

**Confirmación clave:** un cliente real de PostgreSQL con `id = 1` **ya no se bloquea**. Con `demoMode === false`, `currentClienteId()` devuelve `1` y el pago/historial operan con ese ID real; la demo devuelve `null` por la bandera de modo, nunca por comparar el ID.

---

## 64. 🔐 Fase 5 — Registro e inicio de sesión reales con correo y contraseña

**Rama:** `main` · **Fecha:** 2026-10-21 · **Objetivo:** conectar los formularios existentes con los endpoints reales del backend, conservar una sesión mínima segura, mantener la demo separada y retirar el DNI como mecanismo de login.

**Alcance:** sin JWT, sin cookies, sin `Authorization`, sin sesión de servidor, sin modificar CORS, pagos, órdenes ni el flujo de compra. `POST /api/clientes/dni` se conserva en el backend por compatibilidad.

### 64.1 Backend

| Cambio | Detalle |
|--------|---------|
| Dependencia | `bcryptjs ^3.0.3` es la **única** añadida a `backend/package.json` / `package-lock.json`. |
| Hash | `BCRYPT_ROUNDS = 10`; `bcrypt.hash()` al registrar y `bcrypt.compare()` al iniciar sesión. Nunca se guarda ni se devuelve la contraseña original. |
| `POST /api/clientes/registro` | Valida nombre (≥3), DNI (8 dígitos), correo (formato), contraseña (≥4), `passwordConfirm` (si viene) y fecha de nacimiento real/no futura. Normaliza `correo` con trim + lowercase, detecta duplicados por correo/DNI (**409**) y responde **201** con `{ success:true, data }`. |
| `POST /api/clientes/login` | Normaliza el correo y busca por la columna `correo`. Si la cuenta no existe, no tiene contraseña o la clave no coincide → **401** con el mensaje genérico «Correo o contraseña incorrectos.». Éxito → **200** con la misma proyección pública. |
| Proyección segura | `clienteSesionPublico()` devuelve `id`, `nombre`, `correo`, `dni`, `fechaNacimiento`, `edad` y **`esAdulto`**. `password_hash` no forma parte de `COLUMNAS` ni de la respuesta HTTP. |
| Modelo | Nuevas funciones `buscarPorCorreo`, `buscarPorCorreoConPassword` (solo uso interno del login) y `crearConPassword` (persiste únicamente el hash). Se conservan `identificarPorDni`, `buscarPorDni`, `crear()` y la ruta `/dni`. |
| Compatibilidad | Google Auth, catálogo, productos, órdenes, historial y CORS intactos. |

### 64.2 Base de datos

Migración nueva `database/migrations/002-add-password-hash-clientes.sql`:

```sql
ALTER TABLE public.cliente
ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

- Columna **nullable**, sin `DEFAULT`, idempotente por `IF NOT EXISTS`.
- Sin datos, secretos ni contraseñas.
- Ya aplicada manualmente en Neon (`neondb`); **no** se reejecuta desde la aplicación ni durante las validaciones.

### 64.3 Frontend

| Cambio | Detalle |
|--------|---------|
| Login real | `#emailLoginForm` envía `{ correo, password }` a `${API_BASE_URL}/api/clientes/login`. Correo normalizado (trim + lowercase), validación local, botón deshabilitado con “Iniciando sesión…” y estado en `#authStatus`. |
| Registro real | `#loginForm` envía `{ nombre, dni, correo, password, passwordConfirm, fechaNacimiento }` a `${API_BASE_URL}/api/clientes/registro`. Mantiene `validateRegisterAll()` y los mensajes por campo; éxito → sesión real; 400/409/red → `#registerError` sin perder los datos útiles. |
| Sesión local | `guardarSesionCliente()` guarda en `localStorage['tottus_user']` solo `{ id, name, email, dni, birth, age, isAdult }`; exige `id` entero > 0 y no guarda contraseñas, confirmaciones, hashes ni tokens. Aplica a registro y login. |
| Mapeo de edad | `isAdult` se construye con **`data.esAdulto === true`** (se corrigió el nombre de la propiedad; antes se leía `data.esAdult` y quedaba `false`). |
| Retiro del login por DNI | Se eliminaron `#dniLoginForm`, `#dniLogin`, `#dniLoginError`, `#btnDniLogin`, el separador `o`, `setDniLoginError()`, `ingresarConDni()` y su listener. El DNI sigue siendo obligatorio en “Crear cuenta” y `#loginDNI` conserva sus validaciones. |
| Demo separada | `#btnDemo` es la **única** vía de `enterDemo()`. Login, registro y cualquier error (400/401/409/500/red) no activan la demo ni crean una sesión falsa. |
| Interfaz | Nuevos estados `#authStatus` y `#registerError` con `aria-live`; estilos mínimos `.form-status` (error/éxito). Se reemplazó “Acceso de demostración” por “Inicia sesión con tu correo y contraseña”. |
| Caché PWA | `frontend/sw.js`: `tottus-scan-go-v11` → **`tottus-scan-go-v12`**, para que el navegador descarte el `app.js` anterior y cargue el registro/login reales (el evento `activate` ya elimina cachés distintos de la versión actual). |
| Textos alineados | El modal de Google y la respuesta de TOBI invitan a iniciar sesión con correo/contraseña o a usar “Ver demostración”; ya no ofrecen ingreso por DNI. |

### 64.4 Archivos de la fase

- `backend/package.json`, `backend/package-lock.json`
- `backend/src/models/clienteModel.js`
- `backend/src/controllers/clienteController.js`
- `backend/src/routes/clienteRoutes.js`
- `frontend/app.js`, `frontend/index.html`, `frontend/styles.css`, `frontend/sw.js` (caché v12) y `frontend/tobi-chat.js` (texto de ayuda)
- `database/migrations/002-add-password-hash-clientes.sql` (nuevo)
- `frontend/DOCUMENTACION-TECNICA (1).md` y este documento

### 64.5 Verificación y pendientes

- `node --check` OK en modelo, controlador, rutas y `frontend/app.js`; `git diff --check` sin errores.
- Sin `password`, `passwordConfirm` ni `password_hash` en `localStorage`/`sessionStorage` ni en logs.
- No se ejecutaron POST reales, no se creó ningún cliente y no se ejecutó SQL durante la implementación/revisión.
- **Pendiente:** prueba manual de registro y login (éxito, 400, 401, 409 y backend caído), en local o producción. El diagnóstico de §65 verificó el contrato de forma estática y dejó preparada la consulta agregada para explicar un 401 persistente.
- Recuperación de contraseña y sesión persistente con token quedan como trabajo futuro.
- **Estado actual (2026-10-21):** los cambios de la fase están commiteados en **`3d597c9`** (`feat(auth): agregar registro y login de clientes`) y `main` está sincronizada con `origin/main`. No se hizo ningún commit ni push adicional durante el diagnóstico.

### 64.6 Cambios no documentados detectados al revisar la fase

| Cambio real | Estado en la documentación |
|---|---|
| `frontend/sw.js`: caché `tottus-scan-go-v11` → **`tottus-scan-go-v12`** | No figuraba en §64.3 ni en §64.4; añadido en esta revisión. |
| Cierre de §64 afirmaba “sin commit ni push” | Desactualizado: el trabajo ya está en `3d597c9` y sincronizado con `origin/main`; corregido en §64.5. |
| `frontend/sw.js` dentro de los archivos de la fase | Faltaba en la lista de §64.4; añadido. |

No se detectaron otros cambios de código de la Fase 5 fuera de la documentación: el resto del diff de `3d597c9` (controlador, modelo, rutas, migración, `app.js`, `index.html`, `styles.css` y `tobi-chat.js`) ya estaba descrito en §64.

---

## 65. 🔎 Fase 5 — Diagnóstico de registro/login (solo lectura)

**Rama:** `main` · **Fecha:** 2026-10-21 · **Alcance:** verificar el flujo real de `POST /api/clientes/registro` y `POST /api/clientes/login` **sin modificar código, sin ejecutar SQL, sin crear ni eliminar clientes, sin cambiar contraseñas y sin hacer peticiones POST**.

### 65.1 Estado de Git

| Comprobación | Resultado |
|---|---|
| `git status --short` | Al inicio del diagnóstico, sin salida: árbol de trabajo limpio. |
| `git branch --show-current` | `main` |
| `git diff --check` | Al inicio del diagnóstico, sin salida: sin errores de espacios. |
| HEAD | `3d597c9` — `feat(auth): agregar registro y login de clientes` (2026-10-21). |
| Remoto | `main...origin/main` sin *ahead/behind*: local y remoto sincronizados. |

### 65.2 Contrato verificado (revisión estática)

| Punto | Resultado |
|---|---|
| Campos del registro | `nombre`, `dni`, `correo`, `password`, `passwordConfirm` (opcional), `fechaNacimiento`. |
| Campos del login | `correo`, `password`. |
| Normalización | `correo` con `trim().toLowerCase()` en registro y login (backend y ambos formularios del frontend). La contraseña **no** se recorta en ninguno de los dos flujos, por lo que se compara exactamente lo enviado. |
| Generación del hash | `registrar()` ejecuta `bcrypt.hash(password, 10)` (`BCRYPT_ROUNDS = 10`). |
| Persistencia | `crearConPassword()` inserta el resultado en la columna `password_hash` (`$7` del `INSERT`). |
| Búsqueda del login | `buscarPorCorreoConPassword()` consulta `WHERE correo = $1` y recupera `password_hash`; el modelo lo expone como `passwordHash`. |
| Comparación | `iniciarSesion()` ejecuta `bcrypt.compare(password, cliente.passwordHash)`. |
| Respuesta 401 | Se devuelve el mismo mensaje genérico si la cuenta no existe, si `password_hash` es nulo/vacío o si la comparación falla. |
| Coincidencia de nombres | `password` (HTTP/controlador) → `passwordHash` (memoria) → `password_hash` (columna), sin cruces. `correo` es la columna canónica; `email` solo pertenece al flujo de Google. |
| Rutas y arranque | `backend/src/app.js` monta `/api/clientes`; `clienteRoutes.js` define `/registro` y `/login`; `package.json` inicia con `node src/app.js`. |

**Conclusión estática:** no hay incompatibilidad de nombres ni de contrato entre registro y login. El **409** al repetir el registro es el comportamiento esperado (correo ya existente). Un **401** solo puede deberse a: correo distinto/inexistente, `password_hash` nulo o contraseña distinta de la registrada.

### 65.3 Consulta agregada segura para Neon

Preparada para ejecución **manual** en el SQL Editor de Neon. Devuelve únicamente conteos; no selecciona correos, DNI, nombres ni hashes:

```sql
SELECT
    COUNT(*) AS total_clientes,
    COUNT(password_hash) AS clientes_con_hash,
    COUNT(*) FILTER (WHERE password_hash IS NULL) AS clientes_sin_hash,
    COUNT(*) FILTER (
        WHERE password_hash LIKE '$2a$%'
           OR password_hash LIKE '$2b$%'
           OR password_hash LIKE '$2y$%'
    ) AS hashes_con_formato_bcrypt
FROM public.cliente;
```

Interpretación:

- `clientes_con_hash = 0` → las cuentas existentes no tienen contraseña guardada (posible alta por DNI/Google o anterior a la migración 002).
- `clientes_con_hash > hashes_con_formato_bcrypt` → hay hashes nulos, truncados o con formato no bcrypt.
- `clientes_con_hash = hashes_con_formato_bcrypt > 0` → el registro guardó hashes válidos; el 401 apunta a un correo o contraseña distintos.
- `total_clientes = 0` → la fila que responde 409 no está en esa base (entorno distinto).

**Esta consulta no se ejecutó durante el diagnóstico.**

### 65.4 Comprobaciones en Render (sin ejecutar POST)

1. **Events:** el último despliegue debe corresponder al commit `3d597c9`.
2. **Build logs:** confirmar la instalación de `bcryptjs ^3.0.3` sin `npm ERR!` (dependencia declarada en `backend/package.json` y en `package-lock.json`; el *Root Directory* debe ser `backend`).
3. **Runtime logs:** sin `MODULE_NOT_FOUND` ni `Cannot find module 'bcryptjs'`; debe aparecer `[server] Servidor activo en puerto ...`.
4. **Rutas del despliegue nuevo:** los POST recientes del usuario deben verse en los logs con sus 401/409; `GET /` debe devolver el mensaje de backend activo y `GET /api/health` debe indicar `"database":"connected"`.
5. **Descarte de versión antigua:** el commit anterior (`d6804f8`) no definía `/registro` ni `/login`; un despliegue realmente antiguo habría respondido **404**, no 409/401. Por tanto, esos códigos confirman que las rutas nuevas están activas.

No se consultó ni mostró `DATABASE_URL` ni ninguna variable secreta.

### 65.5 Resultado y causa probable

- El **401 inicial** coincide con el uso de correos distintos entre registro y login (hecho observado en las capturas).
- El **409** al reintentar confirma que la cuenta con ese correo ya existe.
- Si el 401 persiste usando exactamente el mismo correo, la causa más probable es un `password_hash` nulo (cuenta creada por un flujo anterior); la consulta de §65.3 lo confirma o descarta.
- Sin el resultado de esa consulta no es posible distinguir entre cuenta sin hash, hash inválido y contraseña distinta. **Causa probable: no determinable todavía** (pendiente de la consulta agregada y del reintento con el mismo correo).

### 65.6 Confirmación de alcance

- No se modificó código de la aplicación, la base de datos ni la configuración.
- No se ejecutó SQL, no se creó ni eliminó ningún cliente y no se cambió ninguna contraseña.
- No se mostraron correos, DNI, contraseñas ni hashes.
- No se hicieron peticiones POST.
- No se hizo commit ni push.
- No se implementó recuperación de contraseña ni se inició la Fase 6.
- La única modificación de esta revisión es **este documento** (§64.3, §64.4, §64.5, §64.6 y §65), a pedido explícito.
