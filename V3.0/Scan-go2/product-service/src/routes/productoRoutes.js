// Rutas de productos. Montadas en /api/products y /api/productos.

const express = require('express');
const productoController = require('../controllers/productoController');

const router = express.Router();

router.get('/', productoController.listar);
router.get('/:codigoBarras', productoController.buscarPorCodigoBarras);

module.exports = router;
