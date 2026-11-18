// Modelo de la tabla `carrito_virtual`.
// Un carrito activo representa la compra en curso; al cambiar su estado
// (por ejemplo 'confirmado') pasa a comportarse como una orden/historial.
// Las lineas de detalle viven en `orden_detalle` (id_carrito ->
// carrito_virtual.id, codigo_barras -> producto.codigo_barras).

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

// Ordenes/historial: carritos que dejaron de estar activos, con sus productos.
// Evita el problema N+1: 1 consulta para las cabeceras + 1 consulta de detalles
// para todos los id_carrito del cliente (JOIN a `producto`), agrupando en memoria.
async function listarOrdenesPorCliente(idCliente) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM carrito_virtual
     WHERE id_cliente = $1 AND estado <> 'activo'
     ORDER BY fecha DESC, id DESC`,
    [idCliente]
  );
  if (rows.length === 0) {
    return [];
  }

  const idsCarrito = rows.map((fila) => fila.id);
  const detalles = await pool.query(
    `SELECT d.id_carrito, d.codigo_barras, p.nombre, d.cantidad,
            d.precio_unitario, d.subtotal
     FROM orden_detalle d
     JOIN producto p ON p.codigo_barras = d.codigo_barras
     WHERE d.id_carrito = ANY($1::int[])
     ORDER BY d.id`,
    [idsCarrito]
  );

  const itemsPorCarrito = new Map();
  for (const fila of detalles.rows) {
    const items = itemsPorCarrito.get(fila.id_carrito) || [];
    items.push({
      codigoBarras: fila.codigo_barras,
      nombre: fila.nombre,
      cantidad: fila.cantidad,
      precioUnitario: Number(fila.precio_unitario),
      subtotal: Number(fila.subtotal),
    });
    itemsPorCarrito.set(fila.id_carrito, items);
  }

  return rows.map((fila) => ({
    compraId: fila.id,
    idCliente: fila.id_cliente,
    fecha: fila.fecha,
    total: Number(fila.monto_total),
    estado: fila.estado,
    items: itemsPorCarrito.get(fila.id) || [],
  }));
}

async function actualizarMonto(id, montoTotal) {
  const { rows } = await pool.query(
    `UPDATE carrito_virtual SET monto_total = $1 WHERE id = $2
     RETURNING ${COLUMNAS}`,
    [montoTotal, id]
  );
  return normalizar(rows[0]);
}

// Error de negocio controlado: permite mapear a 400/404 en el controlador
// sin exponer detalles internos de PostgreSQL.
class ErrorDatos extends Error {
  constructor(codigo, mensaje, extra = {}) {
    super(mensaje);
    this.name = 'ErrorDatos';
    this.codigo = codigo;
    Object.assign(this, extra);
  }
}

// Registra una compra completa dentro de una unica transaccion SQL.
// `items` ya viene normalizado: [{ codigoBarras, cantidad }].
// Flujo: BEGIN -> validar cliente -> crear cabecera -> insertar detalles
// -> calcular total en SQL -> COMMIT. Ante cualquier error: ROLLBACK.
async function registrarCompra(idCliente, items, estado = 'confirmado') {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cliente = await client.query(
      'SELECT id FROM cliente WHERE id = $1',
      [idCliente]
    );
    if (cliente.rowCount === 0) {
      throw new ErrorDatos('CLIENTE_NO_ENCONTRADO', 'Cliente no encontrado');
    }

    // Cabecera de la compra en la tabla existente `carrito_virtual`.
    const cabecera = await client.query(
      `INSERT INTO carrito_virtual (id_cliente, monto_total, estado)
       VALUES ($1, 0, $2)
       RETURNING id, id_cliente, fecha, monto_total, estado`,
      [idCliente, estado]
    );
    const idCarrito = cabecera.rows[0].id;

    for (const item of items) {
      const producto = await client.query(
        'SELECT codigo_barras, precio FROM producto WHERE codigo_barras = $1',
        [item.codigoBarras]
      );
      if (producto.rowCount === 0) {
        throw new ErrorDatos(
          'PRODUCTO_NO_ENCONTRADO',
          'Producto no encontrado',
          { codigoBarras: item.codigoBarras }
        );
      }

      // El precio confiable es el de PostgreSQL (NUMERIC). El subtotal se
      // calcula en SQL con aritmetica decimal exacta.
      await client.query(
        `INSERT INTO orden_detalle
           (id_carrito, codigo_barras, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $4::numeric * $3::integer)`,
        [idCarrito, item.codigoBarras, item.cantidad, producto.rows[0].precio]
      );
    }

    // Total exacto: suma de subtotales ya persistidos.
    const total = await client.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS total
       FROM orden_detalle WHERE id_carrito = $1`,
      [idCarrito]
    );

    await client.query(
      'UPDATE carrito_virtual SET monto_total = $1 WHERE id = $2',
      [total.rows[0].total, idCarrito]
    );

    const detalles = await client.query(
      `SELECT d.codigo_barras, p.nombre, d.cantidad, d.precio_unitario, d.subtotal
       FROM orden_detalle d
       JOIN producto p ON p.codigo_barras = d.codigo_barras
       WHERE d.id_carrito = $1
       ORDER BY d.id`,
      [idCarrito]
    );

    await client.query('COMMIT');

    return {
      id: idCarrito,
      idCliente,
      fecha: cabecera.rows[0].fecha,
      estado,
      total: Number(total.rows[0].total),
      items: detalles.rows.map((fila) => ({
        codigoBarras: fila.codigo_barras,
        nombre: fila.nombre,
        cantidad: fila.cantidad,
        precioUnitario: Number(fila.precio_unitario),
        subtotal: Number(fila.subtotal),
      })),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
  ErrorDatos,
  crear,
  buscarPorId,
  buscarActivoPorCliente,
  listarPorCliente,
  listarOrdenesPorCliente,
  actualizarMonto,
  incrementarMonto,
  actualizarEstado,
  registrarCompra,
};
