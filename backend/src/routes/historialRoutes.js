// Rutas de historial. Montadas en /api/historial.

const express = require('express');
const historialController = require('../controllers/historialController');

const router = express.Router();

router.get('/cliente/:idCliente', historialController.obtenerPorCliente);

module.exports = router;
