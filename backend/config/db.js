require('dotenv').config();

const { Pool } = require('pg');

const REQUIRED_VARS = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME'];

const missing = REQUIRED_VARS.filter((key) => {
  const value = process.env[key];
  return value === undefined || value === '';
});

if (missing.length > 0) {
  console.error(`[db] Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
}

const port = Number.parseInt(process.env.DB_PORT, 10);

if (Number.isNaN(port)) {
  console.error('[db] DB_PORT debe ser un valor numerico.');
  throw new Error('DB_PORT debe ser un valor numerico.');
}

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port,
  database: process.env.DB_NAME,
});

pool.on('error', (err) => {
  console.error('[db] Error inesperado en el Pool de PostgreSQL:', err.message);
});

console.log(
  `[db] Pool configurado para ${process.env.DB_USER}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}`
);

module.exports = pool;
