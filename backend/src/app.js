require('dotenv').config();

const express = require('express');
const cors = require('cors');

const productoRoutes = require('./routes/productoRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const ordenRoutes = require('./routes/ordenRoutes');
const descuentoRoutes = require('./routes/descuentoRoutes');
const historialRoutes = require('./routes/historialRoutes');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');

const pool = require('../config/db');

const app = express();

// CORS: se permiten SOLO los origenes configurados por variables de entorno.
// No se usa origin: "*" ni credentials (en esta etapa no hay cookies de sesion).
// Ejemplos de configuracion:
//   FRONTEND_URL=https://tu-frontend.example.com
//   FRONTEND_URL_LOCAL=http://localhost:8000
const origenesPermitidos = [
  // Frontend publicado (Vercel); se conserva ademas la configuracion por entorno.
  'https://scan-go2-frontend.vercel.app',
  ...(process.env.FRONTEND_URL || '').split(','),
  ...(process.env.FRONTEND_URL_LOCAL || '').split(','),
]
  .map((origen) => origen.trim())
  .filter(Boolean);

// Origenes de desarrollo local: HTTP en el puerto 8000 desde loopback o IPv4 privada.
// No se admite cualquier origen de internet ni comodines.
function esOrigenLocalDesarrollo(origen) {
  const coincidencia = /^http:\/\/([^:/]+|\[[^\]]+\]):8000$/.exec(origen);
  if (!coincidencia) return false;
  const host = coincidencia[1];
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  const octetos = host.split(".").map(Number);
  if (octetos.length !== 4) return false;
  if (octetos.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  if (octetos[0] === 10) return true;
  if (octetos[0] === 192 && octetos[1] === 168) return true;
  return octetos[0] === 172 && octetos[1] >= 16 && octetos[1] <= 31;
}

app.use(
  cors({
    origin(origen, callback) {
      // Sin encabezado Origin (curl, health checks, mismo host): se permite.
      if (!origen) {
        return callback(null, true);
      }
      if (origenesPermitidos.includes(origen) || esOrigenLocalDesarrollo(origen)) {
        return callback(null, true);
      }
      // Origen no permitido: sin cabecera CORS (el navegador lo bloquea).
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend de Scan & Go funcionando correctamente',
  });
});

// Alias en ingles (/api/products) solicitado por el cliente; se conserva
// el prefijo en espanol (/api/productos) para no romper endpoints existentes.
app.use('/api/products', productoRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/descuentos', descuentoRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);

// Health check: valida la conexion a la base de datos sin exponer detalles.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    return res.status(200).json({
      success: true,
      service: 'scan-go2-backend',
      database: 'connected',
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      service: 'scan-go2-backend',
      database: 'disconnected',
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] Error interno del servidor.');
  const status = err && err.status ? err.status : 500;
  res.status(status).json({
    success: false,
    message: 'Error interno del servidor',
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Servidor activo en puerto ${PORT}`);
});

module.exports = app;
