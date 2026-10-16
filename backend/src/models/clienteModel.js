// Modelo de la tabla `cliente`.
// Usa la conexion compartida (config/db.js) y consultas parametrizadas.

const pool = require('../../config/db');

const COLUMNAS = 'id, dni, nombre, correo, fecha_nacimiento, edad, es_adulto';

function normalizar(fila) {
  if (!fila) {
    return null;
  }
  return {
    id: fila.id,
    dni: fila.dni,
    nombre: fila.nombre,
    correo: fila.correo,
    fechaNacimiento: fila.fecha_nacimiento,
    edad: fila.edad,
    esAdulto: fila.es_adulto,
  };
}

async function crear({
  dni,
  nombre,
  correo,
  fechaNacimiento = null,
  edad = null,
  esAdulto = false,
}) {
  const { rows } = await pool.query(
    `INSERT INTO cliente (dni, nombre, correo, fecha_nacimiento, edad, es_adulto)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNAS}`,
    [dni, nombre, correo, fechaNacimiento, edad, esAdulto]
  );
  return normalizar(rows[0]);
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM cliente WHERE id = $1`,
    [id]
  );
  return normalizar(rows[0]);
}

async function buscarPorDni(dni) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM cliente WHERE dni = $1`,
    [dni]
  );
  return normalizar(rows[0]);
}

async function listar() {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM cliente ORDER BY id`
  );
  return rows.map(normalizar);
}

module.exports = {
  crear,
  buscarPorId,
  buscarPorDni,
  listar,
};
