const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sephiroth.sqlite');
const USUARIOS_FILE = path.join(__dirname, 'usuarios.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_FILE);

db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        stored_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL DEFAULT 0,
        mime_type TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (user_id, stored_name)
    );
`);

const findUserByUsername = db.prepare('SELECT id, username, password FROM users WHERE username = ?');
const findUserById = db.prepare('SELECT id, username FROM users WHERE id = ?');
const createUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
const listFilesByUser = db.prepare(`
    SELECT id, stored_name, original_name, size, mime_type, created_at
    FROM files
    WHERE user_id = ?
    ORDER BY created_at DESC
`);
const findFileByIdAndUser = db.prepare(`
    SELECT id, stored_name, original_name
    FROM files
    WHERE id = ? AND user_id = ?
`);
const createFile = db.prepare(`
    INSERT INTO files (user_id, stored_name, original_name, size, mime_type)
    VALUES (?, ?, ?, ?, ?)
`);
const deleteFileByIdAndUser = db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?');

function migrateUsuariosJson() {
    if (!fs.existsSync(USUARIOS_FILE)) {
        return;
    }

    try {
        const usuarios = JSON.parse(fs.readFileSync(USUARIOS_FILE, 'utf8'));

        for (const usuario of usuarios) {
            if (!usuario.user || !usuario.pass || findUserByUsername.get(usuario.user)) {
                continue;
            }

            createUser.run(usuario.user, usuario.pass);
        }
    } catch (error) {
        console.error('No se pudo migrar usuarios.json a SQLite:', error.message);
    }
}

function getUserUploadDir(userId) {
    return path.join(UPLOADS_DIR, `user_${userId}`);
}

function safeFilename(filename) {
    return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    next();
}

migrateUsuariosJson();

app.use(session({
    secret: 'el_despertar_de_jenova',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.post('/register', (req, res) => {
    const { nuevo_user, nueva_pass } = req.body;

    if (!nuevo_user || !nueva_pass) {
        return res.status(400).send('<h1>Error</h1><p>Faltan credenciales.</p><a href="/registro">Volver</a>');
    }

    if (findUserByUsername.get(nuevo_user)) {
        return res.send('<h1>Error</h1><p>El guerrero ya existe.</p><a href="/registro">Volver</a>');
    }

    createUser.run(nuevo_user, nueva_pass);
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    const encontrado = findUserByUsername.get(user);

    if (encontrado && encontrado.password === pass) {
        req.session.userId = encontrado.id;
        req.session.usuarioLogueado = encontrado.username;
        return res.redirect('/dashboard');
    }

    res.send('<h1>Acceso Denegado</h1><a href="/">Reintentar</a>');
});

app.post('/upload', requireAuth, upload.single('archivo_nube'), (req, res) => {
    if (req.file) {
        createFile.run(
            req.session.userId,
            req.file.filename,
            req.file.originalname,
            req.file.size,
            req.file.mimetype
        );
    }

    res.redirect('/dashboard');
});

app.get('/api/archivos', requireAuth, (req, res) => {
    const archivos = listFilesByUser.all(req.session.userId).map((archivo) => ({
        id: archivo.id,
        nombre: archivo.original_name,
        nombreGuardado: archivo.stored_name,
        tamano: archivo.size,
        tipo: archivo.mime_type,
        fecha: archivo.created_at
    }));

    res.json(archivos);
});

app.post('/api/eliminar', requireAuth, (req, res) => {
    const { idArchivo } = req.body;
    const archivo = findFileByIdAndUser.get(idArchivo, req.session.userId);

    if (!archivo) {
        return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
    }

    const rutaFinal = path.join(getUserUploadDir(req.session.userId), archivo.stored_name);

    if (fs.existsSync(rutaFinal)) {
        fs.unlinkSync(rutaFinal);
    }

    deleteFileByIdAndUser.run(idArchivo, req.session.userId);
    res.json({ success: true });
});

app.get('/drive/:id', requireAuth, (req, res) => {
    const archivo = findFileByIdAndUser.get(req.params.id, req.session.userId);

    if (!archivo) {
        return res.status(404).send('Archivo no encontrado');
    }

    const filePath = path.join(getUserUploadDir(req.session.userId), archivo.stored_name);
    res.download(filePath, archivo.original_name);
});

app.get('/api/usuario-actual', requireAuth, (req, res) => {
    const usuario = findUserById.get(req.session.userId);

    if (!usuario) {
        return res.status(401).json({ user: 'Desconocido' });
    }

    res.json({ user: usuario.username });
});

app.listen(PORT, () => {
    console.log(`
    ===========================================
    SEPHIROTH DRIVE ACTIVADO
    URL: http://localhost:${PORT}
    SQLite: ${DB_FILE}
    ===========================================
    `);
});
