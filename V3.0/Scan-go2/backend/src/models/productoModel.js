// Modelo de la tabla `producto`.
// Usa la conexion compartida (config/db.js) y consultas parametrizadas.

const pool = require('../../config/db');

const COLUMNAS = 'codigo_barras, nombre, precio, precio_antiguo, imagen, restringido';

function normalizar(fila) {
  if (!fila) {
    return null;
  }
  return {
    codigoBarras: fila.codigo_barras,
    nombre: fila.nombre,
    precio: Number(fila.precio),
    precioAntiguo:
      fila.precio_antiguo === null ? null : Number(fila.precio_antiguo),
    imagen: fila.imagen,
    restringido: fila.restringido,
  };
}

async function listar() {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM producto ORDER BY nombre`
  );
  return rows.map(normalizar);
}

async function buscarPorCodigo(codigoBarras) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM producto WHERE codigo_barras = $1`,
    [codigoBarras]
  );
  return normalizar(rows[0]);
}

// Productos con descuento vigente: precio_antiguo informado y mayor al actual.
async function listarConDescuento() {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS},
            (precio_antiguo - precio) AS ahorro,
            ROUND(((precio_antiguo - precio) / precio_antiguo) * 100) AS descuento
     FROM producto
     WHERE precio_antiguo IS NOT NULL AND precio_antiguo > precio
     ORDER BY descuento DESC, nombre`
  );
  return rows.map((fila) => ({
    ...normalizar(fila),
    ahorro: Number(fila.ahorro),
    descuento: Number(fila.descuento),
  }));
}

module.exports = {
  listar,
  buscarPorCodigo,
  listarConDescuento,
};
