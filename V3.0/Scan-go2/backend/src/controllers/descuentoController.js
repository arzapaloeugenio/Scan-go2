// Controlador de descuentos.
// Deriva los descuentos del catalogo: productos cuyo `precio_antiguo`
// es mayor al `precio` vigente.

const productoModel = require('../models/productoModel');

async function listar(req, res) {
  try {
    const descuentos = await productoModel.listarConDescuento();
    res.status(200).json({ success: true, data: descuentos });
  } catch (error) {
    console.error(`[descuentos] Error en listar: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de descuentos',
    });
  }
}

module.exports = { listar };
