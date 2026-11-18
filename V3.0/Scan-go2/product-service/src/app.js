require('dotenv').config();

const express = require('express');

const productoRoutes = require('./routes/productoRoutes');
const descuentoRoutes = require('./routes/descuentoRoutes');

const pool = require('../config/db');

const app = express();
// No divulgar el framework en las respuestas HTTP.
app.disable('x-powered-by');

// Solo se exponen las rutas de catalogo y descuentos. Sin CORS abierto:
// el navegador accede a traves de Nginx, en el mismo origen.

// Alias en ingles y prefijo en espanol, igual que el backend original.
app.use('/api/products', productoRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/descuentos', descuentoRoutes);

// Health check: comprueba realmente la conexion a PostgreSQL.
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      success: true,
      service: 'scan-go2-product-service',
      database: 'connected',
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      service: 'scan-go2-product-service',
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[product-service] Servidor activo en puerto ${PORT}`);
});

module.exports = app;
