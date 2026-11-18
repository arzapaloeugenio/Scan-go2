-- Scan & Go: datos iniciales (Etapa 1 - reorganizacion de la base de datos).
-- Fuente original: backend/database/init.sql (movido a database/init/).
--
-- Requiere que 01-create-tables.sql se haya ejecutado antes.
-- Es idempotente (puede ejecutarse varias veces sin duplicar datos):
--   * producto usa ON CONFLICT (codigo_barras) DO UPDATE -> refresca el catalogo.
--   * cliente  usa ON CONFLICT (dni) DO NOTHING         -> no duplica el demo.

BEGIN;

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
-- Cliente de demostracion
-- Requerido por carrito_virtual.id_cliente (NOT NULL, FK).
-- Carga repetible: ON CONFLICT evita duplicar por dni/correo.
-- id esperado: 1 (el frontend usa USUARIO_DEMO_ID = 1).
-- ============================================================
INSERT INTO cliente (dni, nombre, correo) VALUES
  ('99999999', 'Cliente Demo', 'demo@scan-go.local')
ON CONFLICT (dni) DO NOTHING;

-- ============================================================
-- Consultas de comprobacion (no exponen informacion sensible)
-- ============================================================
SELECT COUNT(*) AS total_productos FROM producto;
SELECT codigo_barras, nombre, precio, precio_antiguo, imagen, restringido FROM producto ORDER BY codigo_barras;

COMMIT;
