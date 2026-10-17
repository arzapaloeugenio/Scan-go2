-- Scan & Go: creacion de tablas (Etapa 1 - reorganizacion de la base de datos).
-- Fuente original: backend/database/init.sql (movido a database/init/).
--
-- Este script crea la estructura completa desde cero. Es idempotente:
-- todas las sentencias usan IF NOT EXISTS, por lo que puede ejecutarse
-- varias veces sin errores ni perdida de datos.
--
-- Orden de creacion respetando claves foraneas:
--   1) cliente            2) producto
--   3) carrito_virtual    4) sesion_web      (dependen de cliente)
--   5) orden_detalle      (depende de carrito_virtual y producto)
--
-- No crea ni elimina bases de datos. No requiere extensiones adicionales:
-- SERIAL, NUMERIC y TIMESTAMPTZ son tipos nativos de PostgreSQL.
-- Los datos iniciales viven en 02-insert-data.sql.

BEGIN;

-- ============================================================
-- Tabla: cliente
-- ============================================================
-- Se conservan TODAS las columnas y restricciones originales.
-- Cambios para la Etapa 1 (preparacion de autenticacion con Google):
--   * dni pasa a ser OPCIONAL (NULL permitido) para cuentas creadas via
--     Google. No es clave primaria (la PK real es `id`), por lo que quitar
--     NOT NULL es seguro y no destructivo. Se conserva el CHECK original
--     (dni <> ''): en SQL, NULL no incumple ese CHECK.
--   * Se agregan email, foto_url y google_id para Google OAuth (Etapa 2).
--     NOTA: la tabla ya tiene `correo` (UNIQUE, NOT NULL), usado por el
--     backend actual (src/models/clienteModel.js). `email` se agrega segun
--     lo solicitado; ver database/README.md para la recomendacion de unificar
--     `correo` y `email` en una etapa posterior.
CREATE TABLE IF NOT EXISTS cliente (
  id SERIAL PRIMARY KEY,
  dni TEXT UNIQUE CHECK (dni <> ''),
  nombre TEXT NOT NULL CHECK (nombre <> ''),
  correo TEXT NOT NULL UNIQUE CHECK (correo <> ''),
  fecha_nacimiento DATE,
  edad INTEGER CHECK (edad IS NULL OR edad >= 0),
  es_adulto BOOLEAN NOT NULL DEFAULT FALSE,
  -- Columnas nuevas para autenticacion con Google (Etapa 2):
  email VARCHAR(150) UNIQUE,
  foto_url TEXT,
  google_id VARCHAR(255) UNIQUE
);

-- edad y es_adulto son datos derivados de fecha_nacimiento y deberan
-- mantenerse sincronizados desde la logica del backend o mediante
-- una estrategia posterior.

-- ============================================================
-- Tabla: producto
-- ============================================================
CREATE TABLE IF NOT EXISTS producto (
  codigo_barras TEXT PRIMARY KEY CHECK (codigo_barras <> ''),
  nombre TEXT NOT NULL CHECK (nombre <> ''),
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  precio_antiguo NUMERIC(10,2) CHECK (precio_antiguo IS NULL OR precio_antiguo >= 0),
  imagen TEXT NOT NULL CHECK (imagen <> ''),
  restringido BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================
-- Tabla: carrito_virtual
-- ============================================================
CREATE TABLE IF NOT EXISTS carrito_virtual (
  id SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES cliente (id) ON DELETE RESTRICT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  monto_total NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (monto_total >= 0),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado <> '')
);

-- ============================================================
-- Tabla: sesion_web
-- ============================================================
CREATE TABLE IF NOT EXISTS sesion_web (
  id SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES cliente (id) ON DELETE RESTRICT,
  id_dispositivo TEXT NOT NULL CHECK (id_dispositivo <> ''),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabla: orden_detalle
-- Lineas de detalle de una compra. `carrito_virtual` actua como
-- cabecera (id, id_cliente, fecha, monto_total, estado); aqui se
-- guarda cada producto con su precio real y subtotal calculado.
-- ============================================================
CREATE TABLE IF NOT EXISTS orden_detalle (
  id SERIAL PRIMARY KEY,
  id_carrito INTEGER NOT NULL REFERENCES carrito_virtual (id) ON DELETE CASCADE,
  codigo_barras TEXT NOT NULL REFERENCES producto (codigo_barras) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0)
);

-- ============================================================
-- Indices para llaves foraneas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_carrito_virtual_id_cliente ON carrito_virtual (id_cliente);
CREATE INDEX IF NOT EXISTS idx_sesion_web_id_cliente ON sesion_web (id_cliente);
CREATE INDEX IF NOT EXISTS idx_orden_detalle_id_carrito ON orden_detalle (id_carrito);
CREATE INDEX IF NOT EXISTS idx_orden_detalle_codigo_barras ON orden_detalle (codigo_barras);

COMMIT;
