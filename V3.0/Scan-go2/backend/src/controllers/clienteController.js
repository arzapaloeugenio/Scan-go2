// Controlador de clientes.
// Etapa 3: identificacion del cliente por DNI dentro del prototipo academico.
//
// IMPORTANTE: esto es IDENTIFICACION, no autenticacion de alta seguridad.
// El DNI por si solo no es un factor seguro; aqui solo permite encontrar al
// cliente ya registrado para continuar el flujo de Scan & Go. No expone
// datos sensibles (solo id, nombre y dni).

const bcrypt = require('bcryptjs');
const clienteModel = require('../models/clienteModel');

const BCRYPT_ROUNDS = 10;
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Respuesta publica minima del cliente identificado.
function clientePublico(cliente) {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    dni: cliente.dni,
  };
}

// Proyeccion publica para registro/login. Nunca incluye password_hash.
function clienteSesionPublico(cliente) {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    correo: cliente.correo,
    dni: cliente.dni,
    fechaNacimiento: formatearFecha(cliente.fechaNacimiento),
    edad: cliente.edad,
    esAdulto: cliente.esAdulto,
  };
}

// Normaliza una fecha DATE (Date de pg o texto) a YYYY-MM-DD.
function formatearFecha(valor) {
  if (!valor) {
    return null;
  }
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }
  return String(valor).slice(0, 10);
}

// Valida una fecha YYYY-MM-DD real y devuelve sus componentes.
function parsearFechaNacimiento(texto) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!coincidencia) {
    return null;
  }
  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() + 1 !== mes ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  const hoy = new Date();
  const anioHoy = hoy.getFullYear();
  const mesHoy = hoy.getMonth() + 1;
  const diaHoy = hoy.getDate();
  const esFutura =
    anio > anioHoy ||
    (anio === anioHoy && mes > mesHoy) ||
    (anio === anioHoy && mes === mesHoy && dia > diaHoy);

  let edad = anioHoy - anio;
  if (mesHoy < mes || (mesHoy === mes && diaHoy < dia)) {
    edad -= 1;
  }

  return {
    fecha: `${coincidencia[1]}-${coincidencia[2]}-${coincidencia[3]}`,
    edad,
    esFutura,
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

// POST /api/clientes/registro
// { nombre, dni, correo, password, passwordConfirm?, fechaNacimiento }
async function registrar(req, res) {
  try {
    const body = req.body || {};
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const dni = typeof body.dni === 'string' ? body.dni.trim() : '';
    const correo =
      typeof body.correo === 'string' ? body.correo.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const fechaTexto =
      typeof body.fechaNacimiento === 'string'
        ? body.fechaNacimiento.trim()
        : '';

    if (nombre === '') {
      return res
        .status(400)
        .json({ success: false, message: 'El nombre es obligatorio.' });
    }
    if (nombre.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 3 caracteres.',
      });
    }
    if (dni === '') {
      return res
        .status(400)
        .json({ success: false, message: 'El DNI es obligatorio.' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'El DNI debe tener exactamente 8 digitos.',
      });
    }
    if (correo === '') {
      return res
        .status(400)
        .json({ success: false, message: 'El correo es obligatorio.' });
    }
    if (!RE_CORREO.test(correo)) {
      return res
        .status(400)
        .json({ success: false, message: 'El correo no es valido.' });
    }
    if (password === '') {
      return res
        .status(400)
        .json({ success: false, message: 'La contrasena es obligatoria.' });
    }
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'La contrasena debe tener al menos 4 caracteres.',
      });
    }
    if (body.passwordConfirm !== undefined) {
      if (
        typeof body.passwordConfirm !== 'string' ||
        body.passwordConfirm !== password
      ) {
        return res.status(400).json({
          success: false,
          message: 'Las contrasenas no coinciden.',
        });
      }
    }
    if (fechaTexto === '') {
      return res.status(400).json({
        success: false,
        message: 'La fecha de nacimiento es obligatoria.',
      });
    }
    const fecha = parsearFechaNacimiento(fechaTexto);
    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de nacimiento no es valida.',
      });
    }
    if (fecha.esFutura) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de nacimiento no puede ser futura.',
      });
    }

    // Duplicados: no se devuelven datos del cliente existente.
    const existenteCorreo = await clienteModel.buscarPorCorreo(correo);
    if (existenteCorreo) {
      return res
        .status(409)
        .json({ success: false, message: 'El correo ya esta registrado.' });
    }
    const existenteDni = await clienteModel.buscarPorDni(dni);
    if (existenteDni) {
      return res
        .status(409)
        .json({ success: false, message: 'El DNI ya esta registrado.' });
    }

    // Solo se almacena el hash; nunca la contrasena original.
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const cliente = await clienteModel.crearConPassword({
      dni,
      nombre,
      correo,
      fechaNacimiento: fecha.fecha,
      edad: fecha.edad,
      esAdulto: fecha.edad >= 18,
      passwordHash,
    });

    return res
      .status(201)
      .json({ success: true, data: clienteSesionPublico(cliente) });
  } catch (error) {
    // Violacion UNIQUE bajo concurrencia (23505): conflicto controlado.
    if (error && error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El correo o DNI ya esta registrado.',
      });
    }
    console.error(`[clientes] Error en registrar: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar el cliente.',
    });
  }
}

// POST /api/clientes/login  { correo, password }
async function iniciarSesion(req, res) {
  const mensajeCredenciales = 'Correo o contraseña incorrectos.';

  try {
    const body = req.body || {};
    const correo =
      typeof body.correo === 'string' ? body.correo.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (correo === '' || password === '') {
      return res.status(400).json({
        success: false,
        message: 'El correo y la contraseña son obligatorios.',
      });
    }

    // Busqueda exclusiva por la columna canonica `correo`.
    const cliente = await clienteModel.buscarPorCorreoConPassword(correo);

    // Misma respuesta si no existe, no tiene contrasena o no coincide.
    if (!cliente || !cliente.passwordHash) {
      return res
        .status(401)
        .json({ success: false, message: mensajeCredenciales });
    }

    const coincide = await bcrypt.compare(password, cliente.passwordHash);
    if (!coincide) {
      return res
        .status(401)
        .json({ success: false, message: mensajeCredenciales });
    }

    return res
      .status(200)
      .json({ success: true, data: clienteSesionPublico(cliente) });
  } catch (error) {
    console.error(`[clientes] Error en iniciarSesion: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesion.',
    });
  }
}

module.exports = { identificarPorDni, registrar, iniciarSesion };
