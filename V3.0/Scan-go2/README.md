# Scan & Go 2

Aplicación de compra rápida tipo Scan & Go (Tottus) con frontend estático,
backend Node.js/Express y PostgreSQL.

## Estructura

```
frontend/          HTML, CSS, JS e imágenes (Nginx)
backend/           API Node.js/Express
database/init/     Creación de tablas y datos iniciales
database/migrations/ Migraciones incrementales
compose.yaml       Orquestación de db, backend y frontend
scripts/           Automatización de arranque y verificación
```

## Inicio automatizado después de `git clone`

```bash
git clone <URL-DEL-REPOSITORIO>
cd Scan-go2
./scripts/docker-start.sh
```

El script:

- comprueba Docker y Docker Compose;
- crea `.env.docker` a partir de `.env.docker.example` **solo si no existe**;
- nunca sobrescribe un `.env.docker` existente;
- no crea `backend/.env` (dentro de Docker las variables las provee `compose.yaml`);
- construye y levanta los servicios con `docker compose --env-file .env.docker up --build -d`.

La contraseña incluida en `.env.docker.example` es **solo para evaluación o
demostración local**. Cámbiala fuera de una prueba local y nunca guardes
secretos reales en archivos versionados.

## Inicio manual

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build -d
```

## URLs

| Servicio          | URL                                            |
| ----------------- | ---------------------------------------------- |
| Frontend          | http://localhost:8000                          |
| Backend           | http://localhost:3000                          |
| Health check      | http://localhost:3000/api/health               |
| Producto conocido | http://localhost:3000/api/products/7750123450013 |

PostgreSQL (`5432`) no se publica en el host: solo es accesible desde la red
interna de Compose mediante el hostname `db`.

## Verificación

```bash
./scripts/docker-check.sh
```

Comprueba el estado de los servicios, `/api/health` con `database=connected`,
el catálogo (`/api/products`), el producto `7750123450013` y el frontend en el
puerto `8000`. Devuelve `0` solo si todo funciona.

## Operación

```bash
# Estado
docker compose --env-file .env.docker ps

# Logs
docker compose --env-file .env.docker logs --tail=100

# Detener sin borrar datos
docker compose --env-file .env.docker down

# Reconstruir
docker compose --env-file .env.docker up --build -d
```

> **ADVERTENCIA:** `docker compose --env-file .env.docker down -v` elimina el
> volumen persistente y **todos los datos de PostgreSQL**. No lo uses si
> necesitas conservar la base de datos.

## Inicialización de PostgreSQL

Los scripts se montan como solo lectura en `/docker-entrypoint-initdb.d/`:

| Archivo del repositorio                              | Destino en el contenedor                    |
| ---------------------------------------------------- | ------------------------------------------- |
| `database/init/01-create-tables.sql`                 | `01-create-tables.sql`                      |
| `database/init/02-insert-data.sql`                   | `02-insert-data.sql`                        |
| `database/migrations/001-google-auth-clientes.sql`   | `03-google-auth-clientes.sql`               |
| `database/migrations/002-add-password-hash-clientes.sql` | `04-add-password-hash-clientes.sql`     |

PostgreSQL ejecuta esos archivos **solamente cuando inicializa un volumen de
datos vacío**. Si el volumen ya existe, no se vuelven a ejecutar. Para aplicar
cambios de esquema posteriores hay que hacerlo manualmente con `psql` (o
recrear el volumen, lo cual es destructivo).

> Si cambias `POSTGRES_PASSWORD` después de inicializar el volumen, PostgreSQL
> conserva la contraseña anterior. Actualízala dentro de la base o recrea el
> volumen (destructivo).

## Variables de entorno

- `.env.docker` es local, está ignorado por Git y contiene la contraseña de
  PostgreSQL usada por Compose (y, opcionalmente, `GOOGLE_CLIENT_ID`).
- El backend dentro de Docker recibe `DB_HOST=db`, `DB_PORT=5432`,
  `DB_NAME=tottus_scan_go`, `DB_USER=postgres`, `DB_PASSWORD` y `PORT=3000`
  directamente desde `compose.yaml`.
- `backend/.env` es solo para ejecutar el backend fuera de Docker y no se
  utiliza dentro de los contenedores.
- El login con Google es opcional. Para habilitarlo, define `GOOGLE_CLIENT_ID`
  (no es un secreto) en `.env.docker`; `compose.yaml` lo pasa al backend.

## Notas de seguridad

- No se copian archivos `.env` a ninguna imagen: `backend/.dockerignore` y
  `frontend/.dockerignore` los excluyen.
- Si alguna credencial real estuvo versionada, debe rotarse y eliminarse del
  historial de Git; añadirla a `.gitignore` no borra el historial.
