require('dotenv').config();

const express = require('express');

const carritoRoutes = require('./routes/carritoRoutes');
const ordenRoutes = require('./routes/ordenRoutes');
const historialRoutes = require('./routes/historialRoutes');

const pool = require('../config/db');

const app = express();
// No divulgar el framework en las respuestas HTTP.
app.disable('x-powered-by');

// Sin CORS abierto: el navegador entra por Nginx, en el mismo origen.
app.use(express.json());

// Solo las rutas reales extraidas del dominio de ordenes/carrito/historial.
app.use('/api/carrito', carritoRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/historial', historialRoutes);

// Health check: comprueba realmente la conexion a PostgreSQL.
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      success: true,
      service: 'scan-go2-order-service',
      database: 'connected',
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      service: 'scan-go2-order-service',
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

const PORT = process.env.PORT || 3002;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[order-service] Servidor activo en puerto ${PORT}`);
});

module.exports = app;
