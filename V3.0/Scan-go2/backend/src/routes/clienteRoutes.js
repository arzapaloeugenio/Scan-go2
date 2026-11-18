// Rutas de clientes. Montadas en /api/clientes.

const express = require('express');
const clienteController = require('../controllers/clienteController');

const router = express.Router();

// POST /api/clientes/dni  { dni }  -> identifica al cliente por DNI.
router.post('/dni', clienteController.identificarPorDni);

// POST /api/clientes/registro  { nombre, dni, correo, password, fechaNacimiento }
router.post('/registro', clienteController.registrar);

// POST /api/clientes/login  { correo, password }
router.post('/login', clienteController.iniciarSesion);

module.exports = router;
