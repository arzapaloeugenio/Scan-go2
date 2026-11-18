// Controlador de carrito y ordenes.
// - Carrito: compra en curso (estado 'activo') de un cliente.
// - Orden: carrito cuyo estado dejo de ser 'activo' (checkout).

const carritoModel = require('../models/carritoModel');
const productoModel = require('../models/productoModel');
const clienteModel = require('../models/clienteModel');

function responderError(res, error, contexto) {
  console.error(`[carrito] Error en ${contexto}: ${error.message}`);
  res.status(500).json({
    success: false,
    message: 'Error al procesar la solicitud del carrito',
  });
}

function parsearId(valor) {
  const id = Number.parseInt(valor, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function clienteValido(idCliente) {
  const cliente = await clienteModel.buscarPorId(idCliente);
  return Boolean(cliente);
}

// GET /api/carrito/cliente/:idCliente -> carrito activo del cliente
async function obtenerCarritoActivo(req, res) {
  try {
    const idCliente = parsearId(req.params.idCliente);
    if (idCliente === null) {
      return res
        .status(400)
        .json({ success: false, message: 'idCliente invalido' });
    }

    const carrito = await carritoModel.buscarActivoPorCliente(idCliente);
    return res.status(200).json({ success: true, data: carrito });
  } catch (error) {
    return responderError(res, error, 'obtenerCarritoActivo');
  }
}

// GET /api/carrito/:id -> carrito por id
async function obtenerCarrito(req, res) {
  try {
    const id = parsearId(req.params.id);
    if (id === null) {
      return res.status(400).json({ success: false, message: 'id invalido' });
    }

    const carrito = await carritoModel.buscarPorId(id);
    if (!carrito) {
      return res
        .status(404)
        .json({ success: false, message: 'Carrito no encontrado' });
    }

    return res.status(200).json({ success: true, data: carrito });
  } catch (error) {
    return responderError(res, error, 'obtenerCarrito');
  }
}

// POST /api/carrito  { idCliente }
async function crearCarrito(req, res) {
  try {
    const idCliente = parsearId(req.body.idCliente);
    if (idCliente === null) {
      return res
        .status(400)
        .json({ success: false, message: 'idCliente invalido' });
    }

    if (!(await clienteValido(idCliente))) {
      return res
        .status(404)
        .json({ success: false, message: 'Cliente no encontrado' });
    }

    const carrito = await carritoModel.crear(idCliente);
    return res.status(201).json({ success: true, data: carrito });
  } catch (error) {
    return responderError(res, error, 'crearCarrito');
  }
}

// POST /api/carrito/:id/productos  { codigoBarras, cantidad }
async function agregarProducto(req, res) {
  try {
    const id = parsearId(req.params.id);
    if (id === null) {
      return res.status(400).json({ success: false, message: 'id invalido' });
    }

    const codigoBarras = (req.body.codigoBarras || '').trim();
    const cantidad = Number.parseInt(req.body.cantidad, 10) || 1;

    if (codigoBarras === '') {
      return res
        .status(400)
        .json({ success: false, message: 'codigoBarras es obligatorio' });
    }
    if (cantidad < 1) {
      return res
        .status(400)
        .json({ success: false, message: 'cantidad debe ser mayor a 0' });
    }

    const carrito = await carritoModel.buscarPorId(id);
    if (!carrito) {
      return res
        .status(404)
        .json({ success: false, message: 'Carrito no encontrado' });
    }
    if (carrito.estado !== 'activo') {
      return res.status(409).json({
        success: false,
        message: 'El carrito no esta activo y no admite cambios',
      });
    }

    const producto = await productoModel.buscarPorCodigo(codigoBarras);
    if (!producto) {
      return res
        .status(404)
        .json({ success: false, message: 'Producto no encontrado' });
    }

    const subtotal = producto.precio * cantidad;
    const actualizado = await carritoModel.incrementarMonto(id, subtotal);

    return res.status(200).json({
      success: true,
      data: actualizado,
      detalle: { producto, cantidad, subtotal },
    });
  } catch (error) {
    return responderError(res, error, 'agregarProducto');
  }
}

// DELETE /api/carrito/:id/productos/:codigoBarras?cantidad=1
async function quitarProducto(req, res) {
  try {
    const id = parsearId(req.params.id);
    if (id === null) {
      return res.status(400).json({ success: false, message: 'id invalido' });
    }

    const codigoBarras = (req.params.codigoBarras || '').trim();
    const cantidad = Number.parseInt(req.query.cantidad, 10) || 1;

    if (codigoBarras === '') {
      return res
        .status(400)
        .json({ success: false, message: 'codigoBarras es obligatorio' });
    }

    const carrito = await carritoModel.buscarPorId(id);
    if (!carrito) {
      return res
        .status(404)
        .json({ success: false, message: 'Carrito no encontrado' });
    }
    if (carrito.estado !== 'activo') {
      return res.status(409).json({
        success: false,
        message: 'El carrito no esta activo y no admite cambios',
      });
    }

    const producto = await productoModel.buscarPorCodigo(codigoBarras);
    if (!producto) {
      return res
        .status(404)
        .json({ success: false, message: 'Producto no encontrado' });
    }

    const subtotal = producto.precio * cantidad;
    const actualizado = await carritoModel.incrementarMonto(id, -subtotal);

    return res.status(200).json({
      success: true,
      data: actualizado,
      detalle: { producto, cantidad, subtotal },
    });
  } catch (error) {
    return responderError(res, error, 'quitarProducto');
  }
}

// PUT /api/carrito/:id/confirmar  { estado }
async function confirmarCarrito(req, res) {
  try {
    const id = parsearId(req.params.id);
    if (id === null) {
      return res.status(400).json({ success: false, message: 'id invalido' });
    }

    const carrito = await carritoModel.buscarPorId(id);
    if (!carrito) {
      return res
        .status(404)
        .json({ success: false, message: 'Carrito no encontrado' });
    }
    if (carrito.estado !== 'activo') {
      return res
        .status(409)
        .json({ success: false, message: 'El carrito ya fue procesado' });
    }

    const estado = (req.body.estado || 'confirmado').trim() || 'confirmado';
    const orden = await carritoModel.actualizarEstado(id, estado);

    return res.status(200).json({ success: true, data: orden });
  } catch (error) {
    return responderError(res, error, 'confirmarCarrito');
  }
}

// GET /api/ordenes/cliente/:idCliente
async function listarOrdenes(req, res) {
  try {
    const idCliente = parsearId(req.params.idCliente);
    if (idCliente === null) {
      return res
        .status(400)
        .json({ success: false, message: 'idCliente invalido' });
    }

    const ordenes = await carritoModel.listarOrdenesPorCliente(idCliente);
    return res.status(200).json({ success: true, data: ordenes });
  } catch (error) {
    return responderError(res, error, 'listarOrdenes');
  }
}

// GET /api/ordenes/:id
async function obtenerOrden(req, res) {
  try {
    const id = parsearId(req.params.id);
    if (id === null) {
      return res.status(400).json({ success: false, message: 'id invalido' });
    }

    const orden = await carritoModel.buscarPorId(id);
    if (!orden || orden.estado === 'activo') {
      return res
        .status(404)
        .json({ success: false, message: 'Orden no encontrada' });
    }

    return res.status(200).json({ success: true, data: orden });
  } catch (error) {
    return responderError(res, error, 'obtenerOrden');
  }
}

// POST /api/ordenes
// Body: { idCliente | usuarioId, items: [{ codigoBarras, cantidad }] }
// Los precios, subtotales y total se calculan en el backend a partir de
// PostgreSQL; se ignora cualquier precio o total enviado por el cliente.
async function registrarCompra(req, res) {
  try {
    const body = req.body || {};

    const idCliente = parsearId(body.idCliente ?? body.usuarioId);
    if (idCliente === null) {
      return res
        .status(400)
        .json({ success: false, message: 'idCliente invalido' });
    }

    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La compra debe contener al menos un producto',
      });
    }

    // Valida cada item y agrupa codigos repetidos sumando cantidades.
    const agrupados = new Map();
    for (const item of items) {
      if (!item || typeof item !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Cada item debe ser un objeto valido',
        });
      }

      if (typeof item.codigoBarras !== 'string' || item.codigoBarras.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El codigo de barras es obligatorio',
        });
      }

      const { cantidad } = item;
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser un entero mayor que cero',
        });
      }

      const codigo = item.codigoBarras.trim();
      agrupados.set(codigo, (agrupados.get(codigo) || 0) + cantidad);
    }

    const normalizados = [...agrupados.entries()].map(
      ([codigoBarras, cantidad]) => ({ codigoBarras, cantidad })
    );

    const compra = await carritoModel.registrarCompra(idCliente, normalizados);

    return res.status(201).json({
      success: true,
      message: 'Compra registrada correctamente',
      data: {
        compraId: compra.id,
        total: compra.total,
        items: compra.items,
      },
    });
  } catch (error) {
    if (error instanceof carritoModel.ErrorDatos) {
      if (error.codigo === 'PRODUCTO_NO_ENCONTRADO') {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado',
          codigoBarras: error.codigoBarras,
        });
      }
      if (error.codigo === 'CLIENTE_NO_ENCONTRADO') {
        return res
          .status(404)
          .json({ success: false, message: 'Cliente no encontrado' });
      }
    }

    return responderError(res, error, 'registrarCompra');
  }
}

module.exports = {
  obtenerCarritoActivo,
  obtenerCarrito,
  crearCarrito,
  agregarProducto,
  quitarProducto,
  confirmarCarrito,
  listarOrdenes,
  obtenerOrden,
  registrarCompra,
};
