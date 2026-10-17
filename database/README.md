# Base de datos — Scan & Go

Directorio central de la base de datos PostgreSQL del proyecto. Reemplaza a la
antigua carpeta `backend/database/` (que solo contenía `init.sql`).

```
database/
├── init/
│   ├── 01-create-tables.sql   # Creación de tablas, restricciones e índices
│   └── 02-insert-data.sql     # Datos iniciales (productos y cliente demo)
├── migrations/
│   └── 001-google-auth-clientes.sql   # Preparación de `cliente` para Google OAuth
├── data/
│   └── .gitkeep               # Reservado para dumps/backups locales (no versionados)
└── README.md
```

## Requisitos

- PostgreSQL 12 o superior (usa `ADD COLUMN IF NOT EXISTS`, disponible desde 9.6).
- No requiere extensiones adicionales: `SERIAL`, `NUMERIC` y `TIMESTAMPTZ` son nativos.
- No crea ni elimina bases de datos. La base destino debe existir (en este
  proyecto: `tottus_scan_go`, configurada en `backend/.env`).

## Puesta en marcha desde cero

```powershell
# 1) Crear tablas
psql -h localhost -p 5432 -U postgres -d tottus_scan_go -f database/init/01-create-tables.sql

# 2) Insertar datos iniciales
psql -h localhost -p 5432 -U postgres -d tottus_scan_go -f database/init/02-insert-data.sql
```

Ambos scripts son **idempotentes**: pueden ejecutarse varias veces sin errores
ni duplicación de datos (`CREATE ... IF NOT EXISTS`, `ON CONFLICT ...`).

## Actualizar una base ya existente

Si la base ya estaba creada con el antiguo `backend/database/init.sql`, aplica
las migraciones en orden:

```powershell
psql -h localhost -p 5432 -U postgres -d tottus_scan_go -f database/migrations/001-google-auth-clientes.sql
```

Las migraciones también son idempotentes y no destructivas.

## Estructura de la tabla `cliente`

| Columna            | Tipo          | Restricciones                     | Notas                                            |
| ------------------ | ------------- | --------------------------------- | ------------------------------------------------ |
| `id`               | SERIAL        | PK                                |                                                  |
| `dni`              | TEXT          | UNIQUE, `CHECK (dni <> '')`       | **Opcional (NULL)** para cuentas de Google       |
| `nombre`           | TEXT          | NOT NULL, `CHECK (nombre <> '')`  |                                                  |
| `correo`           | TEXT          | NOT NULL, UNIQUE                  | Campo actual del backend (`clienteModel.js`)     |
| `fecha_nacimiento` | DATE          |                                   |                                                  |
| `edad`             | INTEGER       | `CHECK (edad >= 0)`               | Derivado de `fecha_nacimiento`                   |
| `es_adulto`        | BOOLEAN       | NOT NULL DEFAULT FALSE            | Derivado de `fecha_nacimiento`                   |
| `email`            | VARCHAR(150)  | UNIQUE                            | Nuevo (Google OAuth)                            |
| `foto_url`         | TEXT          |                                   | Nuevo (foto de perfil de Google)                |
| `google_id`        | VARCHAR(255)  | UNIQUE                            | Nuevo (identificador "sub" de Google)           |

## Adaptaciones respecto a las instrucciones originales

1. **Nombre de tabla:** las instrucciones mencionaban `clientes`; la tabla real
   es `cliente` (singular). Se conserva `cliente` para no romper el backend.
2. **Correo existente:** la columna actual es `correo` (UNIQUE, NOT NULL). Se
   **conserva** y además se agrega `email` como pidieron las instrucciones.
   Existe redundancia controlada entre ambas. Recomendación para una etapa
   posterior: unificar en un único campo (renombrar `correo` → `email`),
   actualizando `backend/src/models/clienteModel.js` en el mismo cambio.
3. **`dni` opcional:** `dni` no es clave primaria (la PK es `id`), por lo que
   se puede hacer nullable de forma segura, conservando su `UNIQUE` y `CHECK`.

## Aclaración importante

El backend **no** ejecuta ningún script SQL de forma automática al arrancar
(`backend/src/app.js` solo levanta Express y usa el `Pool` de `backend/config/db.js`).
Estos scripts son de inicialización/migración **manual**. Por eso no se añadió
una ejecución automática al iniciar el servidor.
