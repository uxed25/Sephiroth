const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3000;
const USUARIOS_FILE = 'usuarios.json';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const session = require('express-session');

// Configuración de la sesión (La "Memoria" de Sephiroth)
app.use(session({
    secret: 'el_despertar_de_jenova', // Una frase secreta para encriptar
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // La sesión dura 1 hora
}));

// --- 1. PREPARACIÓN DE LA CORRIENTE VITAL ---
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// --- 2. CONFIGURACIÓN DE ALMACENAMIENTO (MULTER) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Creamos la ruta: uploads/nombre_usuario
        const userDir = path.join(UPLOADS_DIR, req.session.usuarioLogueado);
        
        // Si la carpeta del usuario no existe, la creamos al vuelo
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- 3. MIDDLEWARES (EL ORDEN ES VITAL) ---
// Primero activamos la lectura de JSON para el botón eliminar
app.use(express.json()); 
// Luego la lectura de formularios para Login/Registro
app.use(express.urlencoded({ extended: true }));
// Servimos la carpeta public para el CSS/HTML
app.use(express.static('public'));
// Servimos la carpeta uploads para poder descargar/ver archivos
app.use('/drive', express.static('uploads'));

// --- 4. RUTAS DE NAVEGACIÓN ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

app.get('/dashboard', (req, res) => {
    // Si no hay nadie en la sesión, lo expulsamos al login
    if (!req.session.usuarioLogueado) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy(); // Borramos la sesión
    res.redirect('/');
});
// LISTAR ARCHIVOS PRIVADOS
app.get('/api/archivos', (req, res) => {
    const usuario = req.session.usuarioLogueado;
    const userDir = path.join(UPLOADS_DIR, usuario);

    if (!fs.existsSync(userDir)) return res.json([]);

    fs.readdir(userDir, (err, files) => {
        if (err) return res.status(500).json([]);
        res.json(files);
    });
});

// ELIMINAR ARCHIVO PRIVADO
app.post('/api/eliminar', (req, res) => {
    const { nombreArchivo } = req.body;
    const usuario = req.session.usuarioLogueado;
    
    // Ruta absoluta a la carpeta del usuario específico
    const rutaFinal = path.join(UPLOADS_DIR, usuario, nombreArchivo);

    if (fs.existsSync(rutaFinal)) {
        fs.unlinkSync(rutaFinal);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});
app.get('/drive/:file', (req, res) => {
    if (!req.session.usuarioLogueado) return res.status(403).send("No autorizado");
    
    const filePath = path.join(UPLOADS_DIR, req.session.usuarioLogueado, req.params.file);
    res.download(filePath); // Esto fuerza la descarga del archivo correcto
});

// --- 5. LÓGICA DE USUARIOS (REGISTRO Y LOGIN) ---
app.post('/register', (req, res) => {
    const { nuevo_user, nueva_pass } = req.body;
    let usuarios = [];
    if (fs.existsSync(USUARIOS_FILE)) {
        usuarios = JSON.parse(fs.readFileSync(USUARIOS_FILE));
    }

    if (usuarios.find(u => u.user === nuevo_user)) {
        return res.send('<h1>Error</h1><p>El guerrero ya existe.</p><a href="/registro">Volver</a>');
    }

    usuarios.push({ user: nuevo_user, pass: nueva_pass });
    fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2));
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (fs.existsSync(USUARIOS_FILE)) {
        const usuarios = JSON.parse(fs.readFileSync(USUARIOS_FILE));
        const encontrado = usuarios.find(u => u.user === user && u.pass === pass);
        
        if (encontrado) {
            // ¡ESTO ES LO NUEVO! Guardamos al usuario en la sesión
            req.session.usuarioLogueado = user; 
            res.redirect('/dashboard');
        } else {
            res.send('<h1>Acceso Denegado</h1><a href="/">Reintentar</a>');
        }
    }
});

// --- 6. GESTIÓN DE ARCHIVOS (SUBIR, LISTAR Y ELIMINAR) ---

// Subir archivo
app.post('/upload', upload.single('archivo_nube'), (req, res) => {
    console.log("Archivo recibido:", req.file ? req.file.originalname : "Ninguno");
    res.redirect('/dashboard');
});

// Listar archivos (API para el Dashboard)
app.get('/api/archivos', (req, res) => {
    fs.readdir(UPLOADS_DIR, (err, files) => {
        if (err) return res.status(500).json([]);
        res.json(files);
    });
});

// Ruta para saber quién es el usuario actual
app.get('/api/usuario-actual', (req, res) => {
    if (req.session.usuarioLogueado) {
        res.json({ user: req.session.usuarioLogueado });
    } else {
        res.status(401).json({ user: 'Desconocido' });
    }
});

// ELIMINAR ARCHIVO (RUTA DEFINITIVA)
app.post('/api/eliminar', (req, res) => {
    const { nombreArchivo } = req.body;
    
    if (!nombreArchivo) {
        console.log("Error: No se recibió nombre de archivo en el servidor.");
        return res.status(400).json({ success: false, message: "Nombre no recibido" });
    }

    // Usamos ruta absoluta para evitar errores de ubicación
    const rutaFinal = path.join(UPLOADS_DIR, nombreArchivo);

    console.log("Intentando borrar objeto:", nombreArchivo);

    if (fs.existsSync(rutaFinal)) {
        try {
            fs.unlinkSync(rutaFinal);
            console.log("¡Éxito! Archivo borrado del disco.");
            res.json({ success: true });
        } catch (error) {
            console.error("Error al borrar el archivo físico:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    } else {
        console.log("El archivo no existe en la ruta:", rutaFinal);
        res.status(404).json({ success: false, message: "Archivo no encontrado" });
    }
});

// --- 7. ARRANQUE DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`
    ===========================================
    SEPHIROTH DRIVE ACTIVADO
    URL: http://localhost:${PORT}
    ===========================================
    `);
});