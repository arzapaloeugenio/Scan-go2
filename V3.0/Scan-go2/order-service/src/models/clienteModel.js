// Proyeccion de solo lectura de `cliente` usada para validar la existencia
// del comprador. Sin operaciones de escritura ni datos de autenticacion.

const pool = require('../../config/db');

const COLUMNAS =
  'id, dni, nombre, correo, email, foto_url, google_id, fecha_nacimiento, edad, es_adulto';

function normalizar(fila) {
  if (!fila) {
    return null;
  }
  return {
    id: fila.id,
    dni: fila.dni,
    nombre: fila.nombre,
    correo: fila.correo,
    email: fila.email,
    fotoUrl: fila.foto_url,
    googleId: fila.google_id,
    fechaNacimiento: fila.fecha_nacimiento,
    edad: fila.edad,
    esAdulto: fila.es_adulto,
  };
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM cliente WHERE id = $1`,
    [id]
  );
  return normalizar(rows[0]);
}

module.exports = { buscarPorId };
