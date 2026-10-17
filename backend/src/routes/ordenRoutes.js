// Rutas de ordenes. Montadas en /api/ordenes.

const express = require('express');
const carritoController = require('../controllers/carritoController');

const router = express.Router();

router.post('/', carritoController.registrarCompra);
router.get('/cliente/:idCliente', carritoController.listarOrdenes);
router.get('/:id', carritoController.obtenerOrden);

module.exports = router;
