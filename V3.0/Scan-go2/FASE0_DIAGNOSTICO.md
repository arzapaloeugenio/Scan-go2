# FASE 0: INVENTARIO Y DIAGNÓSTICO - Scan-go2

## A. Resumen de la arquitectura actual

El proyecto Scan-go2 es una aplicación full-stack para "Scan & Go" (compras sin colas) con la siguiente arquitectura:

- **Frontend**: Aplicación HTML/CSS/JS estática con:
  - `index.html` - Estructura de vistas (login, catálogo, scanner, carrito, checkout, chat Tobi)
  - `app.js` - Lógica principal (catálogo, carrito, scanner Quagga2, pagos, modo demo/real)
  - `styles.css` - Estilos visuales
  - `tobi-*.js` - Módulos aditivos: allergens, chat, perfil, historial, recetas, descuentos
  - Recursos CDN: Quagga2 (scanner de códigos de barras), QRCode, Font Awesome
  - Servido por Nginx en Docker o Python SimpleHTTP temporal

- **Backend**: API REST con Node.js + Express:
  - `src/app.js` - Servidor Express, CORS, rutas, health check, manejo de errores
  - Rutas: `/api/products`, `/api/productos`, `/api/carrito`, `/api/ordenes`, `/api/descuentos`, `/api/historial`, `/api/auth`, `/api/clientes`
  - Controladores: cliente, producto, carrito, orden, descuento, historial, auth
  - Modelos: cliente, producto, carrito
  - Base de datos: PostgreSQL (configurada vía Docker Compose o variables DB_*)
  - Puerto 3000 exponuesto

- **Docker**: Composición con 3 servicios:
  - `db`: PostgreSQL 16 Alpine
  - `backend`: Node 22 Alpine, puerto 3000
  - `frontend`: Nginx Alpine, puerto 80 (expone 8000 en host)

- **Comunicación**: El frontend (puerto 8000) consume el backend (puerto 3000) vía API calls fetch(). No hay comunicación inversa.

- **Almacenamiento**: localStorage y sessionStorage para estado demo/real, carritos separados por modo.

## Árbol resumido del proyecto

```
scan-go2/
├── .git/
├── .gitignore
├── compose.yaml          # orquestación Docker
├── sonar-project.properties
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── config/
│   │   ├── db.js
│   │   └── google.js
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── clienteController.js
│   │   │   ├── carritoController.js
│   │   │   ├── clienteController.js
│   │   │   ├── descuentoController.js
│   │   │   ├── historialController.js
│   │   │   ├── productoController.js
│   │   │   └── (otros)
│   │   ├── models/
│   │   │   ├── clienteModel.js
│   │   │   ├── productoModel.js
│   │   │   └── carritoModel.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── clienteRoutes.js
│   │   │   ├── productoRoutes.js
│   │   │   ├── carritoRoutes.js
│   │   │   └── (otros)
│   │   └── config/
│   │       └── db.js
│   └── database/
│       ├── init/
│       │   ├── 01-create-tables.sql
│       │   ├── 02-insert-data.sql
│       │   └── migrations/
│       └── migrations/
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json  (NO EXISTE - es estático)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── img/
│   ├── sw.js
│   ├── manifest.json
│   └── tobi-*.js (7 archivos: allergens, chat, discounts, profile, history, recipes)
│   ├── scripts/ (docker-check.sh, docker-start.sh)
│   └── DOCUMENTACION-TECNICA*.md
├── database/
│   ├── data/
│   ├── init/
│   └── migrations/
└── scripts/
```

## Funciones críticas que no deben romperse

1. **addToCart(code, qty)** - Agregar productos al carrito (línea 630 de app.js). Validación de límite 40, restricciones +18, etiquetas de alergia.
2. **buscarProductoPorCodigo(codigo)** - Búsqueda de producto por código de barras (línea 135 de app.js). Modo demo/local y real/API.
3. **onScannedCode(finalCode)** - Manejo después de escanear un código (línea 1154 de app.js). No definida en el fragmento leído, pero se llama desde onScanSuccess.
4. **showView(name)** - Navegación entre vistas (línea 783 de app.js). Alternar visibilidad de vistas.
5. **identidadActiva()** - Identidad del cliente activo (línea 476 de app.js). Demo vs real.
6. **guardarSesionCliente(data)** - Guardar sesión de cliente en localStorage (línea 234 de app.js).
7. **TOBI chat functions** - getTobiReply, openTobiChat, sendMsg, etc. - Chat con asistente Tobi.
8. **tobiWrapAddToCart()** - Envoltorio que intercepta addToCart para verificar alergias (tobi-allergens.js).
9. **Quagga2 scanner initialization** - `isScannerLibAvailable()`, `startCamera()`, `handleQuaggaDetected()`.
10. **Database routes** - `/api/clientes/dni`, `/api/clientes/registro`, `/api/clientes/login` - Identificación y autenticación.

## D. Problemas confirmados (SonarQube + OWASP ZAP)

### SonarQube - 54 issues únicos

**Seguridad (20 issues):**
- Variables posiblemente asignadas sin declaración explícita (tobi-allergens.js)
- Promesas sin manejar en varios módulos
- Regex con posible backtracking no lineal (tobi-chat.js)
- Uso global de NaN e isNaN (app.js)
- Regex con rendimiento superlineal (clienteController.js - regex `/^(\d{4})-(\d{2})-(\d{2})$/`)
- Possible divulgación de versión del framework (app.js - X-Powered-By)
- Copia recursiva en Dockerfile frontal
- Información sensible potencial en Dockerfile

**Reliability (33 issues):**
- Promesas sin manejar múltiples ubicaciones
- Regex costosas
- Number.NaN / Number.isNaN simultáneo en confiabilidad y mantenibilidad
- Errores de manejo en Quagga2/Scanner
- Errores de parsing en fechas, DNI, correo

**Maintainability (5 impacts):**
- Duplicación de código (0.6%)
- Four NaN/isNaN findings

**Problemas de mezcla original:**
- Lista original de 74 issues mezclaba 54 de Scan-go2 + 20 de "Paulista Rail Lab". Trabajar solo con Scan-go2.

### OWASP ZAP - Análisis en http://10.0.2.15:8000 y http://10.0.2.15:3000

**Alertas medias (3):**
1. Content Security Policy Header Not Set - 4 instancias (/, /favicon.ico, /robots.txt, /sitemap.xml)
2. Missing Anti-clickjacking Header - 1 instancia (página principal)
3. Sub Resource Integrity Attribute Missing - 3 recursos (Font Awesome 6.5.2, Quagga2 1.8.2, QRCode 1.5.3)

**Alertas bajas (3):**
1. JavaScript cargado desde dominios externos
2. Divulgación de versión SimpleHTTP/Python
3. Falta de X-Content-Type-Options: nosniff

**Alertas informativas (2):**
1. Comentarios sospechosos en archivos JavaScript
2. Modern Web Application

**NOTA OBLIGATORIA DE ZAP:**
- "Modern Web Application" NO es vulnerabilidad
- Divulgación SimpleHTTP/Pertenece al servidor temporal de prueba, no necesariamente al servidor definitivo
- Encabezados CSP, anti-clickjacking y nosniff no pueden corregirse verdaderamente dentro de un HTML estático servido con python -m http.server
- Deben configurarse en el servidor real (Nginx, Express, contenedor Docker)

## E. Problemas no confirmados

Los siguientes hallazgos requieren verificación antes de actuar:

1. **Variable addToCart sin declaración explícita** (tobi-allergens.js): El análisis sugiere verificar alcance y dependencias antes de declarar con let o const. No está confirmado que falte declaración - la variable `addToCart` viene del backend y es reasignada en `tobiWrapAddToCart()`.

2. **Promesas sin manejar** (varios archivos): Necesita inspección cuál realmente no tiene catch/manejo apropiado vs. las que sí lo tienen.

3. **Regex con backtracking no lineal** (tobi-chat.js): Las regex en `getTobiReply` y `tobiCanon` son relativamente simples; el backtracking podría ser preocupante solo con entradas especialmente diseñadas.

4. **SRI hashes para recursos CDN**: ZAP reporta SRI missing, pero verificar hashes exactos sin Internet es imposible. Se debe descargar los archivos y calcular hashes reales, o servirlos localmente.

5. **Divulgación SimpleHTTP/Python**: Pertenece al servidor temporal de prueba (python -m http.server), no al servidor de producción definitivo.

6. **Comentarios sospechosos**: No se deben borrar automáticamente; evaluar contenido antes.

7. **X-Powered-By en Express**: Revisar si está activado; no es default en Express 5.x pero podría haber configuración previa.

## F. Hallazgos posiblemente innecesarios o falsos positivos

1. **Math.random en app.js**: El reporte dice "PRNG en contextos que SonarQube considera sensibles". Pero Math.random se usa para:
   - Efectos visuales (confeti)
   - Datos demo ( IDs generados)
   - No para lógica crítica o seguridad
   
   **No cambiar Math.random** si solo se usa para efectos visuales, datos demo o identificadores no sensibles.

2. **Comentarios en código**: ZAP reporta "suspicious comments". Muchos comentarios son documentación académica legítima. No borrar sin evaluar.

3. **Cobertura 0.0%**: Probablemente porque no hay un framework de pruebas configurado y el proyecto es mayormente código de negocio sin tests unitarios. No es necesariamente un defecto de código.

4. **Duplicación 0.6%**: Bajo nivel; podría ser patrones de uso similares (mismos estilos de nomenclatura, estructuras de error repetidas) en lugar de código copiado.

## G. Recomendación entre opción A, B o C

**Recomendación: OPCIÓN A - Mantener arquitectura actual y hacer correcciones puntuales**

Justificación:
- Scan-go2 es un proyecto pequeño/mediano (≈7.9K líneas)
- La arquitectura actual ya funciona y separa claramente frontend/backend
- No hay evidencia de necesidad de microservicios (únicamente endpoints de catálogo, carrito, órdenes, clientes)
- Los problemas son principalmente de calidad (SonarQube) y seguridad de cabecera (ZAP), no de arquitectura
- Aplicar arquitectura hexagonal traería complejidad desproporcionada para el beneficio
- Migrar a microservicios no aporta valor real para estos dominios (catálogo, carrito, autenticación son funciones únicas)

**Por qué no la Opción B (monolito hexagonal):**
- Escaparría el proyecto; beneficio marginal para 7.9K líneas
- Requiere mapear todos los archivos existentes hacia la nueva estructura (tarea grande para poco ganancia)
- Los "beneficios reales" de hexagonal (fronteras claras, testabilidad) ya se logran parcialmente con la separación actual frontend/backend

**Por qué no la Opción C (microservicios):**
- No hay separación real de dominios que justifique microservicios
- Los dominios potenciales (usuarios/auth, clientes, catálogo, carrito, pedidos) están interconectados
- Infraestructura desproporcionada (Kafka, service mesh, etc.) para proyecto de este tamaño
- Requerimiento académico formal no es suficiente causa técnica

## H. Estimación en horas por fase

| Fase | Horas Estimadas | Comentario |
|------|----------------|------------|
| FASE 0 (Diagnóstico) | 4 hrs | Análisis completado |
| FASE 1 (Especificaciones SDD) | 2 hrs | Crear specs pequeñas y verificables |
| FASE 2 (Correcciones críticas mínimas) | 6 hrs | Variables, Docker, versión backend |
| FASE 3 (Promesas y Regex) | 4 hrs | Manejo intencional, simplificación |
| FASE 4 (Seguridad Web y ZAP) | 4 hrs | Headers en servidor real, SRI |
| FASE 5 (Arquitectura Hexagonal incremental) | 3 hrs | Pilot pequeño solo backend |
| FASE 6 (Evaluación microservicio) | 2 hrs | Decisión documentada |
| FASE 7 (Pruebas, cobertura, reescaneo) | 3 hrs | ReSonar, reZAP |
| **TOTAL** | **28 hrs** | **Aproximadamente 3.5 días laborables** |

## I. Lista de archivos que deberían tocarse

1. `frontend/app.js` - Corregir NaN/isNaN global, revisar promesas, regex costosas (consolidar, no reescribir todas)
2. `frontend/tobi-allergens.js` - Verificar/declarar variable addToCart con let/const después de verificar alcance
3. `frontend/tobi-chat.js` - Revisar llamadas con argumentos adicionales (líneas ~1122, 1149), regex optimization
4. `frontend/index.html` - Agregar labels a controles, SRI resources (después de verificar hashes)
5. `frontend/Dockerfile` - Revisar .dockerignore, no root, capa superior
6. `backend/src/app.js` - Verificar X-Powered-By, quitar divulgación versión
7. `backend/src/controllers/clienteController.js` - Regex `/^(\d{4})-(\d{2})-(\d{2})$/` performance

## J. Lista de archivos que NO necesitan cambios

1. `frontend/tobi-discounts.js` - Lógica de descuentos, solo aditivo, datos locales
2. `frontend/tobi-profile.js` - Guardado local de perfil, lógica de alergias/productos frecuentes
3. `frontend/tobi-history.js` - Guardado de conversaciones en localStorage
4. `frontend/tobi-recipes.js` - Base local de recetas con filtros de alergias
5. `frontend/tobi-allergens.js` (parcial) - Etnas de alergias ya definidas, solo envoltorio
6. `backend/src/controllers/productoController.js` - Lógica de listado/búsqueda, sin regex problemática aparente
7. `backend/src/routes/*.js` - Definiciones de rutas, sin modificaciones necesarias
8. `backend/src/models/*.js` - Modelos de datos, sin modificar
9. `compose.yaml` - Orquestación Docker, configuración correcta
10. `frontend/.dockerignore` - Ya excluye lo necesario
11. `backend/.dockerignore` - Ya excluye lo necesario

## K. Riesgos principales

1. **Romper flujo de carrito**: Cualquier cambio en `addToCart` o `PRODUCTS` afecta toda la experiencia de compra.
2. **Romper scanner Quagga2**: Cambios en configuración o lógica de detección pueden inutilizar el escáner de códigos.
3. **Romper modo demo/real**: La toggle `demoMode` afecta catálogo, carrito, historial, pagos. Cambios en la lógica de modo deben ser extremadamente cuidadosos.
4. **SRI hashes incorrectos**: Agregar SRI con hashes inventados rompería la carga de recursos desde CDN. Debe verificarse o descargarse localmente.
5. **CSP estricta romper scripts inline**: El proyecto usa `onerror` handlers y eventos inline; una CSP demasiado bloquearía funciones.
6. **Regex changes en clienteController**: El regex de fecha `/\^(\d{4})-(\d{2})-(\d{2})$/` es simple y cambiarlo requiere validar todas las validaciones de fecha.
7. **Promesa desatendida**: Agregar catch vacío o silenciar errores podría ocultar problemas reales en flujos de API.

---
**FASE 0 COMPLETADA. ESPERANDO AUTORIZACIÓN PARA CREAR LAS ESPECIFICACIONES SDD.**

---
*Diagnóstico completado el: Tue Nov 10 2026*