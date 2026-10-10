require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend de Scan & Go funcionando correctamente',
  });
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

app.listen(PORT, () => {
  console.log(`[server] Servidor activo en puerto ${PORT}`);
});

module.exports = app;
