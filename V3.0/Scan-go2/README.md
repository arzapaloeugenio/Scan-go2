# Scan & Go 2 — Arquitectura de microservicios V3.0

## 1. Descripción

Scan & Go 2 es una **aplicación académica** de compra rápida inspirada en un supermercado: el cliente escanea códigos de barras, arma un carrito, paga desde el navegador y consulta su historial. No existe afiliación oficial con ninguna cadena comercial; las marcas y nombres se usan solo como datos de demostración.

La versión V3.0 separa la aplicación en un frontend estático, un backend principal, dos microservicios extraídos de forma incremental y una base PostgreSQL compartida. Todo se orquesta con Docker Compose, y Nginx actúa como punto de entrada único y API Gateway básico.

## 2. Arquitectura

```text
Navegador
  → Nginx/frontend :8000
      → backend :3000
      → product-service :3001
      → order-service :3002
          → PostgreSQL :5432 (interno, no publicado)
```

El navegador solo conoce `http://localhost:8000`. Nginx conserva el prefijo `/api/` al reenviar cada petición y resuelve los destinos mediante el DNS interno de Docker Compose.

## 3. Servicios

| Servicio | Responsabilidad | Puerto host | Puerto interno | Health check | Acceso normal |
| --- | --- | --- | --- | --- | --- |
| `frontend` | Archivos estáticos y proxy inverso (Nginx) | `8000` | `80` | `GET /` | `http://localhost:8000` |
| `backend` | Clientes, registro, login, Google Auth, health general y rutas legacy | `3000` | `3000` | `GET /api/health` | Vía Nginx para el resto de `/api/*` |
| `product-service` | Catálogo, alias de productos y descuentos (solo lectura) | `3001` | `3001` | `GET /health` | Vía Nginx para `/api/products*` y `/api/descuentos*` |
| `order-service` | Carrito persistido, órdenes e historial | `3002` | `3002` | `GET /health` | Vía Nginx para `/api/carrito*`, `/api/ordenes*` y `/api/historial*` |
| `db` | PostgreSQL 16 (alpine) | — | `5432` | `pg_isready` | Solo red interna `scan-go2`, hostname `db` |

PostgreSQL **no está publicado en el host**: `compose.yaml` no define ninguna asignación de puerto para `db`. Los puertos `3000`, `3001` y `3002` sí están publicados para evidencia y diagnóstico; el uso normal de la aplicación no los necesita.

## 4. Enrutamiento mediante Nginx

| Ruta solicitada | Destino |
| --- | --- |
| `/api/products`, `/api/products/*` | `product-service:3001` |
| `/api/productos`, `/api/productos/*` | `product-service:3001` |
| `/api/descuentos`, `/api/descuentos/*` | `product-service:3001` |
| `/api/carrito`, `/api/carrito/*` | `order-service:3002` |
| `/api/ordenes`, `/api/ordenes/*` | `order-service:3002` |
| `/api/historial`, `/api/historial/*` | `order-service:3002` |
| El resto de `/api/*` | `backend:3000` |

Las ubicaciones específicas se declaran antes de `location /api/`. Cada `proxy_pass` apunta al servicio sin URI, de modo que la ruta completa `/api/...` llega intacta al destino.

`frontend/app.js` calcula `API_BASE_URL`: cuando la página se sirve en `localhost:8000` o `127.0.0.1:8000` usa el mismo origen (`""`). Por eso las llamadas normales son `http://localhost:8000/api/...` y el navegador no necesita conocer los puertos de los servicios.

## 5. Estructura del proyecto

```text
frontend/                 HTML, CSS, JS, imágenes y nginx.conf
backend/                  API Node.js/Express principal (rutas legacy como respaldo)
product-service/          Catálogo y descuentos de solo lectura
order-service/            Carrito, órdenes e historial
database/init/            Creación de tablas y datos iniciales
database/migrations/      Migraciones incrementales montadas en PostgreSQL
scripts/                  docker-start.sh y docker-check.sh
compose.yaml              Orquestación de los cinco servicios
```

Los tres servicios de API usan Node.js `22.22.3-alpine3.24`, Express `5.3.0`, pg `8.23.1` y dotenv `18.0.7`. El frontend usa Nginx `1.27.5-alpine3.21` y PostgreSQL es `16.15-alpine3.24`.

## 6. Inicio automatizado después de `git clone`

El script `./scripts/docker-start.sh` resuelve su propio directorio y ejecuta Compose desde la carpeta que contiene `compose.yaml`. Por eso la ruta depende de cómo se haya clonado el repositorio.

Si se clonó directamente el proyecto V3.0:

```bash
git clone <URL-DEL-REPOSITORIO>
cd Scan-go2
./scripts/docker-start.sh
```

Si se clonó el repositorio padre que contiene `V3.0/Scan-go2`:

```bash
git clone <URL-DEL-REPOSITORIO>
cd Scan-go2/V3.0/Scan-go2
./scripts/docker-start.sh
```

Lo que realmente hace el script: comprueba Docker, el plugin de Compose y el demonio; verifica que existan `compose.yaml` y `.env.docker.example`; crea `.env.docker` copiando el ejemplo **solo si no existe** (nunca lo sobrescribe, y le aplica permisos `600`); avisa si la contraseña sigue siendo la de demostración; ejecuta `docker compose --env-file .env.docker up --build -d`; muestra `ps` y una guía de URLs. No crea `backend/.env` porque las variables dentro de Docker las entrega Compose.

## 7. Inicio manual

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build -d
```

No sobrescribas un `.env.docker` ya configurado: la copia solo aplica si el archivo no existe. `.env.docker` es local y está ignorado por Git; no debe subirse. Las credenciales de ejemplo son únicamente para evaluación local: cámbialas fuera de una prueba local.

## 8. URLs

| Recurso | URL |
| --- | --- |
| Frontend | `http://localhost:8000` |
| Backend (directo) | `http://localhost:3000` |
| Backend health | `http://localhost:3000/api/health` |
| Product service health | `http://localhost:3001/health` |
| Product service catálogo | `http://localhost:3001/api/products` |
| Order service health | `http://localhost:3002/health` |
| Entrada catálogo por Nginx | `http://localhost:8000/api/products` |
| Entrada órdenes por Nginx | `http://localhost:8000/api/ordenes` |
| Entrada historial por Nginx | `http://localhost:8000/api/historial/cliente/1` |

Las URLs de los puertos `3000`, `3001` y `3002` son para diagnóstico. Durante el uso normal, todas las llamadas deben hacerse por Nginx en el puerto `8000`. El registro de órdenes es `POST /api/ordenes` y no es un enlace navegable.

## 9. Endpoints por servicio

### Backend

- `GET /api/health` — comprueba PostgreSQL con `SELECT NOW()`.
- Clientes: registro, login y consultas asociadas.
- `POST /api/auth/google` — autenticación con Google si está configurada.
- Otras rutas no extraídas, además de las rutas legacy de productos, carrito, órdenes e historial que se conservan como respaldo.

### Product-service

- `GET /health`
- `GET /api/products`
- `GET /api/products/:codigoBarras`
- `GET /api/productos`
- `GET /api/productos/:codigoBarras`
- `GET /api/descuentos`

### Order-service

- `GET /health`
- `GET /api/carrito/cliente/:idCliente`
- `POST /api/carrito`
- `GET /api/carrito/:id`
- `POST /api/carrito/:id/productos`
- `DELETE /api/carrito/:id/productos/:codigoBarras`
- `PUT /api/carrito/:id/confirmar`
- `POST /api/ordenes`
- `GET /api/ordenes/cliente/:idCliente`
- `GET /api/ordenes/:id`
- `GET /api/historial/cliente/:idCliente`

## 10. Verificación

```bash
./scripts/docker-check.sh
```

Hoy ese script valida **db, backend y frontend**: comprueba que estén en ejecución/sanos, que `GET /api/health` devuelva `success=true` y `database=connected`, que `/api/products` no esté vacío, que el producto `7750123450013` responda y que el frontend sirva `index.html`. **No valida aún product-service ni order-service**; no modifiques el script dentro de este alcance documental.

Comprobaciones manuales complementarias:

```bash
docker compose --env-file .env.docker ps
curl -fsS http://localhost:3000/api/health
curl -fsS http://localhost:3001/health
curl -fsS http://localhost:3002/health
curl -fsS http://localhost:8000/api/products
```

## 11. Operación

```bash
# Estado
docker compose --env-file .env.docker ps

# Logs generales
docker compose --env-file .env.docker logs --tail=100

# Logs por servicio
docker compose --env-file .env.docker logs --tail=100 product-service
docker compose --env-file .env.docker logs --tail=100 order-service

# Detener conservando volúmenes
docker compose --env-file .env.docker down

# Reconstruir y levantar
docker compose --env-file .env.docker up --build -d
```

> ## ADVERTENCIA — NO EJECUTAR SALVO BORRADO INTENCIONAL
>
> `docker compose --env-file .env.docker down -v`
>
> elimina el volumen `scan_go2_pgdata` y, con él, **todos los datos de PostgreSQL**. No lo uses si quieres conservar la base de datos.

## 12. Inicialización de PostgreSQL

Los scripts se montan como solo lectura en `/docker-entrypoint-initdb.d/`:

| Archivo del repositorio | Destino en el contenedor |
| --- | --- |
| `database/init/01-create-tables.sql` | `01-create-tables.sql` |
| `database/init/02-insert-data.sql` | `02-insert-data.sql` |
| `database/migrations/001-google-auth-clientes.sql` | `03-google-auth-clientes.sql` |
| `database/migrations/002-add-password-hash-clientes.sql` | `04-add-password-hash-clientes.sql` |

PostgreSQL ejecuta esos archivos **únicamente cuando inicializa un volumen de datos vacío**. Si el volumen `scan_go2_pgdata` ya existe, no se vuelven a ejecutar. Una migración nueva debe aplicarse manualmente con `psql` contra la base existente; no se ejecuta sola.

Si se cambia `POSTGRES_PASSWORD` en el archivo de entorno, PostgreSQL **conserva la contraseña anterior** del volumen ya inicializado. Cambiar el archivo no modifica automáticamente la autenticación de un volumen existente.

## 13. Variables de entorno

Solo se enumeran nombres, no valores.

- `db` recibe `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD`.
- `backend`, `product-service` y `order-service` reciben `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `PORT`. Los tres usan la misma base PostgreSQL de forma temporal.
- El backend también recibe `FRONTEND_URL_LOCAL` para su lista de orígenes permitidos y `GOOGLE_CLIENT_ID`, que es opcional y no es un secreto.
- Los servicios de API definen además `NODE_ENV`.

`.env.docker` es local, está ignorado por Git y no debe versionarse. `backend/.env` solo aplica cuando el backend se ejecuta fuera de Docker; dentro de los contenedores las variables las inyecta `compose.yaml`.

## 14. Seguridad

- Los secretos se mantienen fuera de Git; `.dockerignore` impide copiar archivos de entorno a las imágenes.
- Nginx aplica `server_tokens off`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(self)` y `Content-Security-Policy-Report-Only`. No hay CSP bloqueante todavía.
- Los tres servicios Express usan `app.disable("x-powered-by")`. No se configuró CORS abierto en los microservicios: el navegador entra por Nginx, en el mismo origen.
- Las consultas SQL son parametrizadas. `product-service` solo ejecuta `SELECT`. `order-service` conserva la transacción `BEGIN`/`COMMIT`/`ROLLBACK` y libera la conexión con `client.release()`.
- PostgreSQL no se publica en el host.
- Evita `down -v`: el volumen contiene los datos.
- No existe autenticación JWT entre servicios, ni rate limiting, ni bases de datos separadas. No se describen medidas que no están implementadas.

## 15. Decisiones de arquitectura y deuda técnica

La migración es **incremental y académica**. Se extrajeron primero las lecturas del catálogo y después el dominio de órdenes, manteniendo el backend original intacto como mecanismo de rollback. Nginx actúa como un API Gateway básico y el DNS de Docker proporciona el descubrimiento de servicios.

Deuda técnica conocida:

- Base PostgreSQL compartida por los tres servicios de API; migración incremental con base compartida.
- No hay propiedad exclusiva de tablas por servicio.
- Código parcialmente duplicado entre el backend y los microservicios.
- El backend conserva las rutas legacy de productos, carrito, órdenes e historial.
- No existen bases independientes por servicio.
- No hay mensajería asíncrona: no se usan Kafka ni RabbitMQ.
- No se usa Kubernetes ni service mesh.
- No hay autenticación interna entre servicios.
- La separación de datos podría realizarse en una fase futura.

La ausencia de esas tecnologías es deliberada: el alcance es académico y privilegia contratos verificables sobre infraestructura adicional.

## 16. Pruebas realizadas

Evidencia confirmada durante la implementación:

- Los cinco servicios (`frontend`, `backend`, `db`, `product-service`, `order-service`) estuvieron healthy.
- `nginx -t` finalizó correctamente.
- Catálogo de 14 productos con `precio` numérico y `restringido` booleano.
- `product-service` produjo JSON idéntico al backend para `/api/products` y `/api/descuentos` (comparación con `jq -S` y `diff`).
- `order-service` produjo JSON idéntico al backend en los GET comparados de carrito, órdenes e historial.
- Validaciones inválidas devolvieron los códigos 400 y 404 esperados sin cambiar el número de órdenes.
- Una compra controlada de cantidad 1 para el Cliente Demo: HTTP 201, total coherente y una sola orden nueva.
- Transacción, subtotales y total preservados; cabeceras de seguridad presentes en respuestas 200 y 404.
- No aparecieron respuestas 502 durante las pruebas reportadas.

No hay evidencia posterior en navegador de scanner, QR, Tobi, login, carrito visual ni flujos visuales: esos puntos requieren comprobación manual.

## 17. Evidencia para demostración

```bash
# Cinco servicios
docker compose --env-file .env.docker ps

# Tres health checks de API
curl -fsS http://localhost:3000/api/health
curl -fsS http://localhost:3001/health
curl -fsS http://localhost:3002/health

# Catálogo por Nginx
curl -fsS http://localhost:8000/api/products

# Historial del Cliente Demo
curl -fsS http://localhost:8000/api/historial/cliente/1

# Cabeceras del frontend
curl -sSI http://localhost:8000/
```

## 18. Rollback

Las rutas legacy de productos, carrito, órdenes e historial siguen vivas en el backend. Para volver atrás basta con que Nginx apunte nuevamente esas ubicaciones a `backend:3000` y se detengan los contenedores de los microservicios, sin eliminar PostgreSQL.

No fue necesario revertir datos ni ejecutar migraciones inversas: no se cambió el esquema. Una orden creada durante las pruebas es un dato válido y debe permanecer; no existe un rollback SQL para borrarla.

## 19. Licencia o alcance académico

El repositorio no contiene archivo de licencia, por lo que no se declara ninguna. El proyecto se presenta exclusivamente como trabajo académico de demostración.
