// Producto de solo lectura para el carrito persistido.
// El precio usado en la compra se consulta dentro de la transaccion directamente
// en PostgreSQL (carritoModel.registrarCompra), igual que en el backend.

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

async function buscarPorCodigo(codigoBarras) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM producto WHERE codigo_barras = $1`,
    [codigoBarras]
  );
  return normalizar(rows[0]);
}

module.exports = { buscarPorCodigo };
