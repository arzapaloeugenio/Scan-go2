// Configuracion del cliente de Google para verificar ID tokens.
// Sigue el patron de `config/db.js`: lee variables de entorno y exporta un
// recurso compartido. NO contiene valores por defecto ni credenciales reales.
//
// Variable requerida: GOOGLE_CLIENT_ID (identificador publico del cliente OAuth).

require('dotenv').config();

const { OAuth2Client } = require('google-auth-library');

let clienteCache = null;
let clientIdCache = null;

// Devuelve el Client ID configurado, o '' si no existe.
function obtenerClientId() {
  return (process.env.GOOGLE_CLIENT_ID || '').trim();
}

// Crea (y memoiza) el OAuth2Client usando process.env.GOOGLE_CLIENT_ID.
// Devuelve null si la variable no esta configurada: el llamador debe responder
// con un error controlado de configuracion, nunca con un valor ficticio.
function obtenerOAuth2Client() {
  const clientId = obtenerClientId();
  if (clientId === '') {
    return null;
  }
  if (!clienteCache || clientIdCache !== clientId) {
    clienteCache = new OAuth2Client(clientId);
    clientIdCache = clientId;
  }
  return clienteCache;
}

module.exports = {
  obtenerClientId,
  obtenerOAuth2Client,
};
