// Rutas de clientes. Montadas en /api/clientes.

const express = require('express');
const clienteController = require('../controllers/clienteController');

const router = express.Router();

// POST /api/clientes/dni  { dni }  -> identifica al cliente por DNI.
router.post('/dni', clienteController.identificarPorDni);

module.exports = router;
