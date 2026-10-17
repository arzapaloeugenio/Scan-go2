// Controlador de autenticacion con Google.
//
// Flujo: el frontend envia UNICAMENTE el ID token de Google Identity Services
// (`credential`). El backend verifica la FIRMA y la AUDIENCIA del token con la
// libreria oficial google-auth-library ANTES de leer cualquier dato. El nombre,
// email, foto_url y google_id SIEMPRE provienen del payload verificado; nunca
// se aceptan como datos de confianza enviados por el cliente.
//
// NOTA (Etapa 2): esta ruta VERIFICA la identidad de Google y devuelve el
// cliente, pero NO establece una sesion persistente (no hay JWT ni cookies en
// el backend). Las rutas protegidas necesitaran su propio mecanismo de sesion.

const { obtenerOAuth2Client, obtenerClientId } = require('../../config/google');
const clienteModel = require('../models/clienteModel');

function respuestaError(res, status, message) {
  return res.status(status).json({ ok: false, success: false, message });
}

async function loginConGoogle(req, res) {
  try {
    // 1) La credencial debe venir en el body como string no vacio.
    const credential =
      req.body && typeof req.body.credential === 'string'
        ? req.body.credential.trim()
        : '';

    if (credential === '') {
      return respuestaError(
        res,
        400,
        'Falta la credencial de Google (campo "credential").'
      );
    }

    // 2) Configuracion del servidor: sin Client ID no se puede verificar.
    const oauthClient = obtenerOAuth2Client();
    const clientId = obtenerClientId();
    if (!oauthClient || clientId === '') {
      console.error(
        '[auth] GOOGLE_CLIENT_ID no esta configurado; no se puede verificar el token.'
      );
      return respuestaError(
        res,
        500,
        'La autenticacion con Google no esta configurada en el servidor.'
      );
    }

    // 3) Verificacion real del ID token (firma + audiencia + caducidad).
    //    No se decodifica manualmente ni se registra el token en consola.
    let ticket;
    try {
      ticket = await oauthClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
    } catch (_verifyError) {
      return respuestaError(
        res,
        401,
        'Credencial de Google invalida o vencida.'
      );
    }

    const payload = ticket && ticket.getPayload ? ticket.getPayload() : null;
    if (!payload) {
      return respuestaError(
        res,
        401,
        'No se pudo obtener la informacion del token de Google.'
      );
    }

    // 4) Datos SOLO del payload verificado.
    const googleId = payload.sub;
    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    const emailVerified = payload.email_verified === true;
    const nombreToken = typeof payload.name === 'string' ? payload.name.trim() : '';
    const fotoUrl =
      typeof payload.picture === 'string' && payload.picture.trim() !== ''
        ? payload.picture.trim()
        : null;

    if (!googleId) {
      return respuestaError(res, 401, 'El token de Google no contiene un identificador valido.');
    }
    if (email === '') {
      return respuestaError(res, 401, 'El token de Google no contiene un correo valido.');
    }
    if (!emailVerified) {
      return respuestaError(res, 401, 'El correo de Google no esta verificado.');
    }

    // `nombre` es NOT NULL en la tabla: si Google no lo entrega, se usa la
    // parte local del email verificado (nunca un valor enviado por el cliente).
    const nombre = nombreToken !== '' ? nombreToken : email.split('@')[0];

    // 5) Buscar / vincular / registrar con datos verificados (transaccional).
    const { cliente, creado } = await clienteModel.autenticarConGoogle({
      googleId,
      email,
      nombre,
      fotoUrl,
    });

    const status = creado ? 201 : 200;
    const message = creado
      ? 'Cliente registrado con Google'
      : 'Inicio de sesion con Google correcto';

    return res.status(status).json({
      ok: true,
      success: true,
      message,
      cliente: clienteModel.aPublico(cliente),
    });
  } catch (error) {
    if (error instanceof clienteModel.ErrorAutenticacion) {
      // Conflictos de asociacion: 409 con mensaje seguro.
      return respuestaError(res, 409, error.message);
    }
    // Error interno: no se filtra ningun detalle de PostgreSQL ni del token.
    console.error(`[auth] Error en loginConGoogle: ${error.message}`);
    return respuestaError(res, 500, 'Error interno al procesar la autenticacion.');
  }
}

module.exports = { loginConGoogle };
