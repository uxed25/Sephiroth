const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const { DATA_DIR, DB_FILE, USUARIOS_FILE, UPLOADS_DIR } = require('./config');
const { hashPassword } = require('./passwords');

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

const statements = {
    findUserByUsername: db.prepare('SELECT id, username, password FROM users WHERE username = ?'),
    findUserById: db.prepare('SELECT id, username FROM users WHERE id = ?'),
    createUser: db.prepare('INSERT INTO users (username, password) VALUES (?, ?)'),
    updateUserPassword: db.prepare('UPDATE users SET password = ? WHERE id = ?'),
    listFilesByUser: db.prepare(`
        SELECT id, stored_name, original_name, size, mime_type, created_at
        FROM files
        WHERE user_id = ?
        ORDER BY created_at DESC
    `),
    findFileByIdAndUser: db.prepare(`
        SELECT id, stored_name, original_name
        FROM files
        WHERE id = ? AND user_id = ?
    `),
    createFile: db.prepare(`
        INSERT INTO files (user_id, stored_name, original_name, size, mime_type)
        VALUES (?, ?, ?, ?, ?)
    `),
    deleteFileByIdAndUser: db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?')
};

function migrateUsuariosJson() {
    if (!fs.existsSync(USUARIOS_FILE)) {
        return;
    }

    try {
        const usuarios = JSON.parse(fs.readFileSync(USUARIOS_FILE, 'utf8'));

        for (const usuario of usuarios) {
            if (!usuario.user || !usuario.pass || statements.findUserByUsername.get(usuario.user)) {
                continue;
            }

            statements.createUser.run(usuario.user, hashPassword(usuario.pass));
        }
    } catch (error) {
        console.error('No se pudo migrar usuarios.json a SQLite:', error.message);
    }
}

module.exports = {
    db,
    statements,
    migrateUsuariosJson
};
