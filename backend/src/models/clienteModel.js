// Modelo de la tabla `cliente`.
// Usa la conexion compartida (config/db.js) y consultas parametrizadas.
//
// Etapa 2: se agregan las operaciones de autenticacion con Google
// (`autenticarConGoogle`). Se CONSERVAN intactas las funciones del flujo
// actual por DNI (`crear`, `buscarPorDni`, `buscarPorId`, `listar`).
//
// Columnas reales de `cliente` (ver database/init/01-create-tables.sql):
//   id (PK), dni (NULL permitido, UNIQUE), nombre, correo (UNIQUE, NOT NULL),
//   fecha_nacimiento, edad, es_adulto, email (UNIQUE), foto_url, google_id (UNIQUE).
//
// NOTA: `correo` es el correo canonico actual del backend. Para las cuentas
// creadas con Google se guarda el mismo valor en `correo` y en `email`, de modo
// que ambas columnas quedan consistentes.

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

// Error de negocio controlado para la autenticacion con Google.
// Permite mapear a 409 (conflicto) en el controlador sin exponer detalles de PG.
class ErrorAutenticacion extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = 'ErrorAutenticacion';
    this.codigo = codigo;
  }
}

// Proyeccion publica segura: solo los campos que el cliente puede ver.
// No expone datos internos y usa la clave primaria real (`id`).
function aPublico(cliente) {
  if (!cliente) {
    return null;
  }
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    dni: cliente.dni,
    email: cliente.email,
    foto_url: cliente.fotoUrl,
    google_id: cliente.googleId,
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

async function buscarPorGoogleId(googleId) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM cliente WHERE google_id = $1`,
    [googleId]
  );
  return normalizar(rows[0]);
}

// Busca por `email` o por el `correo` legado (clientes anteriores a Google
// tienen email NULL y su correo en `correo`). Devuelve todas las coincidencias
// para poder detectar ambiguedad.
async function buscarPorEmail(email) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS}
       FROM cliente
      WHERE email::text = $1 OR correo = $1
      ORDER BY id`,
    [email]
  );
  return rows.map(normalizar);
}

// Busca o registra al cliente usando SOLO los datos del token ya verificado.
// Devuelve { cliente, creado }. Lanza ErrorAutenticacion en caso de conflicto.
// Todo el flujo corre dentro de una transaccion para ser seguro ante
// solicitudes simultaneas y respetar las restricciones UNIQUE de email/google_id.
async function autenticarConGoogle({ googleId, email, nombre, fotoUrl }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Ya existe por google_id -> actualiza perfil con los datos verificados.
    const porGoogle = await client.query(
      `SELECT ${COLUMNAS} FROM cliente WHERE google_id = $1`,
      [googleId]
    );
    if (porGoogle.rowCount > 0) {
      const actualizado = await client.query(
        `UPDATE cliente
            SET nombre = $2, email = $3, foto_url = $4
          WHERE id = $1
          RETURNING ${COLUMNAS}`,
        [porGoogle.rows[0].id, nombre, email, fotoUrl]
      );
      await client.query('COMMIT');
      return { cliente: normalizar(actualizado.rows[0]), creado: false };
    }

    // 2) Existe por email/correo -> vincula google_id conservando dni y demas.
    const porEmail = await client.query(
      `SELECT ${COLUMNAS}
         FROM cliente
        WHERE email::text = $1 OR correo = $1
        ORDER BY id`,
      [email]
    );
    if (porEmail.rowCount > 1) {
      throw new ErrorAutenticacion(
        'CONFLICTO_EMAIL',
        'El correo esta asociado a mas de un cliente.'
      );
    }
    if (porEmail.rowCount === 1) {
      const existente = porEmail.rows[0];
      if (existente.googleId && existente.googleId !== googleId) {
        throw new ErrorAutenticacion(
          'CONFLICTO_GOOGLE_ID',
          'La cuenta ya esta vinculada a otra identidad de Google.'
        );
      }
      const vinculado = await client.query(
        `UPDATE cliente
            SET google_id = $2, email = $3, nombre = $4, foto_url = $5
          WHERE id = $1 AND (google_id IS NULL OR google_id = $2)
          RETURNING ${COLUMNAS}`,
        [existente.id, googleId, email, nombre, fotoUrl]
      );
      if (vinculado.rowCount === 0) {
        throw new ErrorAutenticacion(
          'CONFLICTO_GOOGLE_ID',
          'La cuenta ya esta vinculada a otra identidad de Google.'
        );
      }
      await client.query('COMMIT');
      return { cliente: normalizar(vinculado.rows[0]), creado: false };
    }

    // 3) No existe -> crea un cliente nuevo. dni queda NULL (la columna lo
    //    permite); `correo` es NOT NULL, por eso se replica el email verificado.
    const creado = await client.query(
      `INSERT INTO cliente (dni, nombre, correo, email, foto_url, google_id)
       VALUES (NULL, $1, $2::text, $2::text, $3, $4)
       RETURNING ${COLUMNAS}`,
      [nombre, email, fotoUrl, googleId]
    );
    await client.query('COMMIT');
    return { cliente: normalizar(creado.rows[0]), creado: true };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // Si el ROLLBACK falla, se propaga el error original.
    }

    if (error instanceof ErrorAutenticacion) {
      throw error;
    }
    // Violacion de UNIQUE bajo concurrencia (23505): se traduce a conflicto.
    if (error && error.code === '23505') {
      const detalle = String(error.detail || '');
      if (detalle.includes('google_id')) {
        throw new ErrorAutenticacion(
          'CONFLICTO_GOOGLE_ID',
          'La cuenta ya esta vinculada a otra identidad de Google.'
        );
      }
      throw new ErrorAutenticacion(
        'CONFLICTO_EMAIL',
        'El correo ya esta registrado.'
      );
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  ErrorAutenticacion,
  aPublico,
  crear,
  buscarPorId,
  buscarPorDni,
  listar,
  buscarPorGoogleId,
  buscarPorEmail,
  autenticarConGoogle,
};
