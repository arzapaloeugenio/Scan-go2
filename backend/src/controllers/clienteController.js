// Controlador de clientes.
// Etapa 3: identificacion del cliente por DNI dentro del prototipo academico.
//
// IMPORTANTE: esto es IDENTIFICACION, no autenticacion de alta seguridad.
// El DNI por si solo no es un factor seguro; aqui solo permite encontrar al
// cliente ya registrado para continuar el flujo de Scan & Go. No expone
// datos sensibles (solo id, nombre y dni).

const clienteModel = require('../models/clienteModel');

// Respuesta publica minima del cliente identificado.
function clientePublico(cliente) {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    dni: cliente.dni,
  };
}

// POST /api/clientes/dni  { dni }
async function identificarPorDni(req, res) {
  try {
    const dni =
      req.body && typeof req.body.dni === 'string' ? req.body.dni.trim() : '';

    if (dni === '') {
      return res
        .status(400)
        .json({ success: false, message: 'El DNI es obligatorio.' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res
        .status(400)
        .json({ success: false, message: 'El DNI debe tener exactamente 8 digitos.' });
    }

    const cliente = await clienteModel.buscarPorDni(dni);
    if (!cliente) {
      return res
        .status(404)
        .json({ success: false, message: 'El DNI no esta registrado.' });
    }

    return res.status(200).json({ success: true, data: clientePublico(cliente) });
  } catch (error) {
    console.error(`[clientes] Error en identificarPorDni: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la identificacion.',
    });
  }
}

module.exports = { identificarPorDni };
