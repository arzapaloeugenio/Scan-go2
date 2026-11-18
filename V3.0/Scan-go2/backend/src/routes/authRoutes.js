// Rutas de autenticacion. Montadas en /api/auth.

const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/google  { credential: "ID_TOKEN_DE_GOOGLE" }
router.post('/google', authController.loginConGoogle);

module.exports = router;
