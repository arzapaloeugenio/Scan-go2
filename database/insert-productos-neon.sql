-- Scan & Go: alta de dos productos en la base ONLINE (Neon).
--
-- Proposito: cargar "Sublime Capuccino" y "Galleta san jorge" en la tabla
-- `producto` de Neon. Es un script MANUAL para el SQL Editor de Neon; el
-- backend no ejecuta scripts SQL al arrancar (ver database/README.md).
--
-- Seguridad / idempotencia:
--   * INSERT ... ON CONFLICT (codigo_barras) DO UPDATE:
--     inserta si no existen, actualiza si ya existen, nunca duplica.
--   * No elimina ni modifica otros productos. No vacia la tabla.
--   * No ejecuta DROP, TRUNCATE ni DELETE.
--   * Los codigos de barras se escriben como TEXTO entre comillas: la columna
--     `codigo_barras` es TEXT y PRIMARY KEY (ver 01-create-tables.sql).
--
-- Esquema real verificado (database/init/01-create-tables.sql):
--   codigo_barras  TEXT           PRIMARY KEY, CHECK (codigo_barras <> '')
--   nombre         TEXT           NOT NULL
--   precio         NUMERIC(10,2)  NOT NULL
--   precio_antiguo NUMERIC(10,2)  NULL permitido
--   imagen         TEXT           NOT NULL
--   restringido    BOOLEAN        NOT NULL DEFAULT FALSE
--
-- Las imagenes NO se guardan en Neon: solo la ruta publica servida por Vercel
-- (convencion del proyecto: "img/archivo.png", sin barra inicial).

-- ------------------------------------------------------------------
-- 1) Consulta previa (comprobar si ya existen antes de ejecutar el INSERT)
-- ------------------------------------------------------------------
SELECT codigo_barras, nombre, precio, imagen, restringido
FROM producto
WHERE codigo_barras IN ('8445292635882', '7750106003094');

-- ------------------------------------------------------------------
-- 2) Alta idempotente
-- ------------------------------------------------------------------
BEGIN;

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
        false
    ),
    (
        '7750106003094',
        'Galleta san jorge',
        1.00,
        NULL,
        'img/galleta-soda-san-jorge.png',
        false
    )
ON CONFLICT (codigo_barras)
DO UPDATE SET
    nombre = EXCLUDED.nombre,
    precio = EXCLUDED.precio,
    precio_antiguo = EXCLUDED.precio_antiguo,
    imagen = EXCLUDED.imagen,
    restringido = EXCLUDED.restringido;

COMMIT;

-- ------------------------------------------------------------------
-- 3) Consulta de verificacion (resultado esperado: 2 filas)
-- ------------------------------------------------------------------
SELECT codigo_barras, nombre, precio, imagen, restringido
FROM producto
WHERE codigo_barras IN ('8445292635882', '7750106003094')
ORDER BY codigo_barras;

-- Resultado esperado:
--   8445292635882 | Sublime Capuccino | 3.50 | img/sublimecapuccino.png        | false
--   7750106003094 | Galleta san jorge | 1.00 | img/galleta-soda-san-jorge.png  | false
