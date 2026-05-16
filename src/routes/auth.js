const express = require('express');
const { statements } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { hashPassword, isHashedPassword, verifyPassword } = require('../passwords');

const router = express.Router();

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

router.post('/register', (req, res) => {
    const { nuevo_user, nueva_pass } = req.body;

    if (!nuevo_user || !nueva_pass) {
        return res.status(400).send('<h1>Error</h1><p>Faltan credenciales.</p><a href="/registro">Volver</a>');
    }

    if (statements.findUserByUsername.get(nuevo_user)) {
        return res.send('<h1>Error</h1><p>El guerrero ya existe.</p><a href="/registro">Volver</a>');
    }

    statements.createUser.run(nuevo_user, hashPassword(nueva_pass));
    res.redirect('/');
});

router.post('/login', (req, res) => {
    const { user, pass } = req.body;

    if (!user || !pass) {
        return res.status(400).send('<h1>Error</h1><p>Faltan credenciales.</p><a href="/">Volver</a>');
    }

    const encontrado = statements.findUserByUsername.get(user);
    const loginValido = encontrado && (
        verifyPassword(pass, encontrado.password) ||
        encontrado.password === pass
    );

    if (loginValido) {
        if (!isHashedPassword(encontrado.password)) {
            statements.updateUserPassword.run(hashPassword(pass), encontrado.id);
        }

        req.session.userId = encontrado.id;
        req.session.usuarioLogueado = encontrado.username;
        return res.redirect('/dashboard');
    }

    res.send('<h1>Acceso Denegado</h1><a href="/">Reintentar</a>');
});

router.get('/api/usuario-actual', requireAuth, (req, res) => {
    const usuario = statements.findUserById.get(req.session.userId);

    if (!usuario) {
        return res.status(401).json({ user: 'Desconocido' });
    }

    res.json({ user: usuario.username });
});

module.exports = router;
