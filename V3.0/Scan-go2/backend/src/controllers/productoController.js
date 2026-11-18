// Controlador de productos: listado y busqueda por codigo de barras.

const productoModel = require('../models/productoModel');

function responderError(res, error, contexto) {
  console.error(`[productos] Error en ${contexto}: ${error.message}`);
  res.status(500).json({
    success: false,
    message: 'Error al procesar la solicitud de productos',
  });
}

async function listar(req, res) {
  try {
    const productos = await productoModel.listar();
    res.status(200).json({ success: true, data: productos });
  } catch (error) {
    responderError(res, error, 'listar');
  }
}

async function buscarPorCodigoBarras(req, res) {
  try {
    const codigoBarras = (req.params.codigoBarras || '').trim();

    if (codigoBarras === '') {
      return res.status(400).json({
        success: false,
        message: 'El codigo de barras es obligatorio',
      });
    }

    const producto = await productoModel.buscarPorCodigo(codigoBarras);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    return res.status(200).json({ success: true, data: producto });
  } catch (error) {
    return responderError(res, error, 'buscarPorCodigoBarras');
  }
}

module.exports = {
  listar,
  buscarPorCodigoBarras,
};
