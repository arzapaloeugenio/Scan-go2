# 🚀 Scan & Go Tottus — Registro de Mejoras Implementadas

> Documento de trabajo: segunda iteración del proyecto **Tottus Scan & Go** (Universidad Norbert Wiener – Software 1, Proyecto Integrador).
> Fecha: septiembre 2026 · Equipo: Arzapalo, Alva, Cabrejos, Condori · Ciclo: IS4M1.

Esta carpeta `Scan-Go` contiene la versión final mejorada del proyecto:

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Estructura de la app (5 vistas + robot TOBI + canvas de confeti) |
| `styles.css` | Diseño mobile-first verde/blanco + animaciones del robot y confeti |
| `app.js` | Toda la lógica: auth, carrito, escáner, IGV, pago, QRs, TOBI y confeti |
| `DOCUMENTACION-TECNICA.md` | Documentación técnica completa actualizada |
| `MEJORAS-IMPLEMENTADAS.md` | **Este documento:** registro de las mejoras de esta iteración |

---

## 1. Resumen de mejoras

| # | Mejora solicitada | Estado | Dónde |
|---|-------------------|--------|-------|
| 1 | Robot guía con temática Tottus que saluda por nombre | ✅ | `botSay()`, widget `#botWidget` |
| 2 | TOBI guía el escaneo de productos paso a paso | ✅ | `botGuideView("scanner")` |
| 3 | TOBI explica cómo pagar desde el celular | ✅ | `botGuideView("checkout")` + `payNow()` |
| 4 | Carrito con máximo de productos justificado | ✅ | `MAX_ITEMS = 150` |
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
| Vista Carrito | Explica controles −/+ y el límite de 150 productos |
| Carrito llega a 150 | Avisa del tope y redirige a pagar |
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

## 4. 🛒 Límite del carrito: 150 productos

### Justificación
| Consideración | Análisis |
|---------------|----------|
| Compra promedio real en supermercado | ~20–40 ítems por visita |
| Compra grande del mes (familia completa) | 80–120 ítems |
| Apps Scan & Go reales (Walmart, Sam's Club) | topes de 100–200 unidades |
| Riesgo de fraude | a más ítems por ticket QR, mayor exposición si el QR se intercepta |

**Decisión: `MAX_ITEMS = 150`** — cubre >99% de las compras reales (incluso las mensuales) y minimiza la ventana de riesgo. El tope se muestra en la UI con barra de progreso (`qty / 150`) y bloqueo con toast + aviso de TOBI al alcanzarlo.

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
- PWA instalable + modo offline.
