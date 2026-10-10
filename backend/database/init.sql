-- Scan & Go: script SQL inicial (FASE 4A).
-- Crea las tablas base cliente, producto, carrito_virtual y sesion_web,
-- e inserta el catalogo inicial de 14 productos del frontend.
-- Compatible con PostgreSQL. No crea ni elimina bases de datos.

BEGIN;

-- ============================================================
-- Tabla: cliente
-- ============================================================
CREATE TABLE IF NOT EXISTS cliente (
  id SERIAL PRIMARY KEY,
  dni TEXT NOT NULL UNIQUE CHECK (dni <> ''),
  nombre TEXT NOT NULL CHECK (nombre <> ''),
  correo TEXT NOT NULL UNIQUE CHECK (correo <> ''),
  fecha_nacimiento DATE,
  edad INTEGER CHECK (edad IS NULL OR edad >= 0),
  es_adulto BOOLEAN NOT NULL DEFAULT FALSE
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
-- Indices para llaves foraneas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_carrito_virtual_id_cliente ON carrito_virtual (id_cliente);
CREATE INDEX IF NOT EXISTS idx_sesion_web_id_cliente ON sesion_web (id_cliente);

-- ============================================================
-- Catalogo inicial: 14 productos desde ../frontend/app.js
-- Fuente de verdad: PRODUCTS (code, name, price, oldPrice, image, restricted).
-- Carga repetible: ON CONFLICT actualiza sin duplicar ni borrar.
-- ============================================================
INSERT INTO producto (codigo_barras, nombre, precio, precio_antiguo, imagen, restringido) VALUES
  ('7750123450013', 'Leche Gloria Entera 1L', 5.20, 5.90, 'img/LecheGloriaEntera1L.png', FALSE),
  ('7750123450020', 'Pan de Molde Blanco 650g', 7.50, NULL, 'img/Bimbo.png', FALSE),
  ('7750123450037', 'Arroz Superior 5kg', 22.90, 26.90, 'img/Costeño.png', FALSE),
  ('7750123450044', 'Aceite Vegetal 1L', 9.80, NULL, 'img/Primor.png', FALSE),
  ('7750123450051', 'Pollo Entero x kg', 12.90, 14.50, 'img/PolloTottus.png', FALSE),
  ('7750123450068', 'Gaseosa Inca Kola 2L', 8.50, 9.50, 'img/IncaKola.png', FALSE),
  ('7750123450075', 'Fideos Spaghetti 500g', 3.80, NULL, 'img/don-vittorio-spaguetti-x-500-gr.png', FALSE),
  ('7750123450082', 'Detergente 2kg', 24.90, 32.90, 'img/Ariel.png', FALSE),
  ('7750123450099', 'Manzana Gala x kg', 6.90, NULL, 'img/TottusFresco.png', FALSE),
  ('7750123450105', 'Chocolate Sublime 40g', 2.50, 3.00, 'img/NestléSublime.png', FALSE),
  ('7750123450112', 'Café Instantáneo 200g', 19.90, 23.90, 'img/Nescafé.png', FALSE),
  ('7750123450129', 'Papel Higiénico 24 rollos', 27.50, NULL, 'img/Suave.png', FALSE),
  ('7750123450136', 'Cerveza Cristal Six Pack 355ml', 24.90, 29.90, 'img/CRISTAL-SIX-PACK-LATA.png', TRUE),
  ('7750123450143', 'Vino Tinto Borgoña 750ml', 32.50, NULL, 'img/Tabernero.png', TRUE)
ON CONFLICT (codigo_barras) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  precio = EXCLUDED.precio,
  precio_antiguo = EXCLUDED.precio_antiguo,
  imagen = EXCLUDED.imagen,
  restringido = EXCLUDED.restringido;

-- ============================================================
-- Consultas de comprobacion (no exponen informacion sensible)
-- ============================================================
SELECT COUNT(*) AS total_productos FROM producto;
SELECT codigo_barras, nombre, precio, precio_antiguo, imagen, restringido FROM producto ORDER BY codigo_barras;

COMMIT;
