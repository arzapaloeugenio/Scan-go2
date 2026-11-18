// Rutas de carrito. Montadas en /api/carrito.

const express = require('express');
const carritoController = require('../controllers/carritoController');

const router = express.Router();

router.get('/cliente/:idCliente', carritoController.obtenerCarritoActivo);
router.post('/', carritoController.crearCarrito);
router.get('/:id', carritoController.obtenerCarrito);
router.post('/:id/productos', carritoController.agregarProducto);
router.delete('/:id/productos/:codigoBarras', carritoController.quitarProducto);
router.put('/:id/confirmar', carritoController.confirmarCarrito);

module.exports = router;
