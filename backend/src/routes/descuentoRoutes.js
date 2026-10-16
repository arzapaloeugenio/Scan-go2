// Rutas de descuentos. Montadas en /api/descuentos.

const express = require('express');
const descuentoController = require('../controllers/descuentoController');

const router = express.Router();

router.get('/', descuentoController.listar);

module.exports = router;
