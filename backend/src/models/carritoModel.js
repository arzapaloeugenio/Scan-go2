// Modelo de la tabla `carrito_virtual`.
// Un carrito activo representa la compra en curso; al cambiar su estado
// (por ejemplo 'confirmado') pasa a comportarse como una orden/historial.
// Nota: el esquema no define una tabla de lineas de detalle, por lo que el
// estado persistente del carrito es `monto_total` + `estado`.

const pool = require('../../config/db');

const COLUMNAS = 'id, id_cliente, fecha, monto_total, estado';

function normalizar(fila) {
  if (!fila) {
    return null;
  }
  return {
    id: fila.id,
    idCliente: fila.id_cliente,
    fecha: fila.fecha,
    montoTotal: Number(fila.monto_total),
    estado: fila.estado,
  };
}

async function crear(idCliente) {
  const { rows } = await pool.query(
    `INSERT INTO carrito_virtual (id_cliente) VALUES ($1)
     RETURNING ${COLUMNAS}`,
    [idCliente]
  );
  return normalizar(rows[0]);
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM carrito_virtual WHERE id = $1`,
    [id]
  );
  return normalizar(rows[0]);
}

async function buscarActivoPorCliente(idCliente) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM carrito_virtual
     WHERE id_cliente = $1 AND estado = 'activo'
     ORDER BY fecha DESC
     LIMIT 1`,
    [idCliente]
  );
  return normalizar(rows[0]);
}

async function listarPorCliente(idCliente) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM carrito_virtual
     WHERE id_cliente = $1
     ORDER BY fecha DESC`,
    [idCliente]
  );
  return rows.map(normalizar);
}

// Ordenes/historial: carritos que dejaron de estar activos.
async function listarOrdenesPorCliente(idCliente) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM carrito_virtual
     WHERE id_cliente = $1 AND estado <> 'activo'
     ORDER BY fecha DESC`,
    [idCliente]
  );
  return rows.map(normalizar);
}

async function actualizarMonto(id, montoTotal) {
  const { rows } = await pool.query(
    `UPDATE carrito_virtual SET monto_total = $1 WHERE id = $2
     RETURNING ${COLUMNAS}`,
    [montoTotal, id]
  );
  return normalizar(rows[0]);
}

// Suma (o resta, con delta negativo) al monto sin bajar de cero.
async function incrementarMonto(id, delta) {
  const { rows } = await pool.query(
    `UPDATE carrito_virtual SET monto_total = GREATEST(monto_total + $1, 0)
     WHERE id = $2
     RETURNING ${COLUMNAS}`,
    [delta, id]
  );
  return normalizar(rows[0]);
}

async function actualizarEstado(id, estado) {
  const { rows } = await pool.query(
    `UPDATE carrito_virtual SET estado = $1 WHERE id = $2
     RETURNING ${COLUMNAS}`,
    [estado, id]
  );
  return normalizar(rows[0]);
}

module.exports = {
  crear,
  buscarPorId,
  buscarActivoPorCliente,
  listarPorCliente,
  listarOrdenesPorCliente,
  actualizarMonto,
  incrementarMonto,
  actualizarEstado,
};
