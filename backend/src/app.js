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

const app = express();

// CORS: se permiten SOLO los origenes configurados por variables de entorno.
// No se usa origin: "*" ni credentials (en esta etapa no hay cookies de sesion).
// Ejemplos de configuracion:
//   FRONTEND_URL=https://tu-frontend.example.com
//   FRONTEND_URL_LOCAL=http://localhost:8000
const origenesPermitidos = [
  ...(process.env.FRONTEND_URL || '').split(','),
  ...(process.env.FRONTEND_URL_LOCAL || '').split(','),
]
  .map((origen) => origen.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origen, callback) {
      // Sin encabezado Origin (curl, health checks, mismo host): se permite.
      if (!origen) {
        return callback(null, true);
      }
      if (origenesPermitidos.includes(origen)) {
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

app.listen(PORT, () => {
  console.log(`[server] Servidor activo en puerto ${PORT}`);
});

module.exports = app;
