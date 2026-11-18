// Controlador de historial de compras.
// Deriva el historial de `carrito_virtual`: carritos por cliente que ya
// no estan en estado 'activo' (confirmados, pagados, etc.).

const carritoModel = require('../models/carritoModel');

async function obtenerPorCliente(req, res) {
  try {
    const idCliente = Number.parseInt(req.params.idCliente, 10);
    if (!Number.isInteger(idCliente) || idCliente <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'idCliente invalido' });
    }

    const historial = await carritoModel.listarOrdenesPorCliente(idCliente);
    return res.status(200).json({ success: true, data: historial });
  } catch (error) {
    console.error(`[historial] Error en obtenerPorCliente: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de historial',
    });
  }
}

module.exports = { obtenerPorCliente };
