-- ============================================================
-- Migracion 003: alta de "Sublime Capuccino" y "Galleta san jorge".
-- ============================================================
--
-- Contexto (esquema real en database/init/01-create-tables.sql):
--   codigo_barras  TEXT           PRIMARY KEY, CHECK (codigo_barras <> '')
--   nombre         TEXT           NOT NULL
--   precio         NUMERIC(10,2)  NOT NULL
--   precio_antiguo NUMERIC(10,2)  NULL permitido
--   imagen         TEXT           NOT NULL
--   restringido    BOOLEAN        NOT NULL DEFAULT FALSE
--
-- Caracteristicas:
--   * Idempotente: INSERT ... ON CONFLICT (codigo_barras) DO UPDATE.
--   * No elimina ni modifica otros productos. Sin DROP, TRUNCATE ni DELETE.
--   * Los codigos de barras se escriben como TEXTO entre comillas: la columna
--     es TEXT, por lo que no hay conversion numerica ni perdida de digitos.
--   * Las imagenes NO se guardan en la base: solo la ruta publica servida por
--     el frontend (convencion del proyecto: "img/archivo.png", sin barra
--     inicial).
--
-- Uso: script MANUAL. El backend no ejecuta SQL al arrancar y PostgreSQL solo
-- aplica database/init/ al inicializar un volumen vacio. Para una base ya
-- existente (Neon o volumen Docker ya creado), ejecutar este archivo a mano.
--
--   psql -h <host> -p <port> -U <user> -d <db> -f database/migrations/003-add-productos-sublime-capuccino-galleta-san-jorge.sql
-- ============================================================

-- 1) Consulta previa: comprobar si ya existen antes de ejecutar el INSERT.
SELECT codigo_barras, nombre, precio, imagen, restringido
FROM producto
WHERE codigo_barras IN ('8445292635882', '7750106003094');

BEGIN;

-- 2) Alta idempotente.
INSERT INTO producto (
  codigo_barras,
  nombre,
  precio,
  precio_antiguo,
  imagen,
  restringido
)
VALUES
  (
    '8445292635882',
    'Sublime Capuccino',
    3.50,
    NULL,
    'img/sublimecapuccino.png',
    FALSE
  ),
  (
    '7750106003094',
    'Galleta san jorge',
    1.00,
    NULL,
    'img/galleta-soda-san-jorge.png',
    FALSE
  )
ON CONFLICT (codigo_barras) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  precio = EXCLUDED.precio,
  precio_antiguo = EXCLUDED.precio_antiguo,
  imagen = EXCLUDED.imagen,
  restringido = EXCLUDED.restringido;

COMMIT;

-- 3) Consulta de verificacion: resultado esperado = 2 filas.
SELECT codigo_barras, nombre, precio, imagen, restringido
FROM producto
WHERE codigo_barras IN ('8445292635882', '7750106003094')
ORDER BY codigo_barras;

-- Resultado esperado:
--   7750106003094 | Galleta san jorge | 1.00 | img/galleta-soda-san-jorge.png | false
--   8445292635882 | Sublime Capuccino | 3.50 | img/sublimecapuccino.png       | false
