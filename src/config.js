const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'cambia_este_secreto_en_env';
const DATA_DIR = path.resolve(ROOT_DIR, process.env.DATA_DIR || 'data');
const DB_FILE = path.join(DATA_DIR, process.env.DB_NAME || 'sephiroth.sqlite');
const USUARIOS_FILE = path.join(ROOT_DIR, 'usuarios.json');
const UPLOADS_DIR = path.resolve(ROOT_DIR, process.env.UPLOADS_DIR || 'uploads');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

module.exports = {
    ROOT_DIR,
    PORT,
    SESSION_SECRET,
    DATA_DIR,
    DB_FILE,
    USUARIOS_FILE,
    UPLOADS_DIR,
    PUBLIC_DIR
};
