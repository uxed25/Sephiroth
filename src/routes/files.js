const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { UPLOADS_DIR } = require('../config');
const { statements } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function getUserUploadDir(userId) {
    return path.join(UPLOADS_DIR, `user_${userId}`);
}

function safeFilename(filename) {
    return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userDir = getUserUploadDir(req.session.userId);

        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${safeFilename(file.originalname)}`);
    }
});
const upload = multer({ storage });

router.post('/upload', requireAuth, upload.single('archivo_nube'), (req, res) => {
    if (req.file) {
        statements.createFile.run(
            req.session.userId,
            req.file.filename,
            req.file.originalname,
            req.file.size,
            req.file.mimetype
        );
    }

    res.redirect('/dashboard?uploaded=1');
});

router.get('/api/archivos', requireAuth, (req, res) => {
    const archivos = statements.listFilesByUser.all(req.session.userId).map((archivo) => ({
        id: archivo.id,
        nombre: archivo.original_name,
        nombreGuardado: archivo.stored_name,
        tamano: archivo.size,
        tipo: archivo.mime_type,
        fecha: archivo.created_at
    }));

    res.json(archivos);
});

router.post('/api/eliminar', requireAuth, (req, res) => {
    const { idArchivo } = req.body;
    const archivo = statements.findFileByIdAndUser.get(idArchivo, req.session.userId);

    if (!archivo) {
        return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
    }

    const rutaFinal = path.join(getUserUploadDir(req.session.userId), archivo.stored_name);

    if (fs.existsSync(rutaFinal)) {
        fs.unlinkSync(rutaFinal);
    }

    statements.deleteFileByIdAndUser.run(idArchivo, req.session.userId);
    res.json({ success: true });
});

router.get('/drive/:id', requireAuth, (req, res) => {
    const archivo = statements.findFileByIdAndUser.get(req.params.id, req.session.userId);

    if (!archivo) {
        return res.status(404).send('Archivo no encontrado');
    }

    const filePath = path.join(getUserUploadDir(req.session.userId), archivo.stored_name);
    res.download(filePath, archivo.original_name);
});

module.exports = router;
