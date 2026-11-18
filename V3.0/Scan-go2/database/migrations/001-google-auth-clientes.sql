-- ============================================================
-- Migracion 001: preparar la tabla `cliente` para autenticacion con Google.
-- ============================================================
--
-- Contexto (verificado contra la base real en Etapa 1):
--   * La tabla existente se llama `cliente` (singular). Las instrucciones
--     hablaban de `clientes`; se adapta al nombre real para no romper el
--     backend (src/models/clienteModel.js usa `cliente`).
--   * La clave primaria es `id` (SERIAL). `dni` NO es clave primaria:
--     es `TEXT NOT NULL UNIQUE` con CHECK (dni <> ''). Por lo tanto se puede
--     quitar NOT NULL de forma SEGURA y NO destructiva (no hay que recrear
--     la tabla ni borrar registros). En PostgreSQL varias filas pueden tener
--     dni NULL y el UNIQUE sigue aplicando a los valores no nulos.
--   * La tabla ya tiene `correo` (TEXT NOT NULL UNIQUE), usada por el backend
--     actual. Las instrucciones piden ademas `email`; se agrega como columna
--     nueva. Recomendacion para una etapa posterior: unificar `correo` y
--     `email` en un solo campo (ver database/README.md).
--
-- Caracteristicas de esta migracion:
--   * Idempotente: puede ejecutarse varias veces sin fallar ni duplicar.
--   * No elimina ni modifica datos existentes.
--   * No recrea la tabla.
--   * Solo DDL aditivo + un DROP NOT NULL seguro.
--
-- Ejecucion (desde la raiz del proyecto, con psql):
--   psql -h <host> -p <port> -U <user> -d <db> -f database/migrations/001-google-auth-clientes.sql
-- ============================================================

BEGIN;

-- 1) email: correo del usuario autenticado con Google.
--    Se agrega si no existe, con restriccion UNIQUE (permite NULL en filas
--    antiguas; Google garantiza un email por cuenta).
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS email VARCHAR(150) UNIQUE;
-- Red de seguridad: garantiza el UNIQUE aunque la columna ya existiera sin el.
CREATE UNIQUE INDEX IF NOT EXISTS cliente_email_key ON cliente (email);

-- 2) foto_url: URL de la foto de perfil de Google.
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 3) google_id: identificador unico ("sub") que devuelve Google OAuth.
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS cliente_google_id_key ON cliente (google_id);

-- 4) dni opcional para cuentas creadas via Google.
--    `id` es la PK real, por lo que quitar NOT NULL es seguro y no rompe
--    ninguna ruta: el backend sigue leyendo dni cuando existe (buscarPorDni),
--    y las rutas actuales pasan dni en los INSERT de terceros, no en este DDL.
--    El CHECK original (dni <> '') se conserva: NULL no lo incumple.
--    Idempotente: si ya es nullable, PostgreSQL lo trata como no-op.
ALTER TABLE cliente ALTER COLUMN dni DROP NOT NULL;

COMMIT;

-- ============================================================
-- Verificacion sugerida despues de aplicar la migracion:
--   SELECT column_name, data_type, character_maximum_length, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'cliente'
--   ORDER BY ordinal_position;
-- ============================================================
