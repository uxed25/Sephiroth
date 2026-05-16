const express = require('express');
const path = require('path');
const { PUBLIC_DIR } = require('../config');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

router.get('/registro', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'registro.html'));
});

router.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html'));
});

module.exports = router;
