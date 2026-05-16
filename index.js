const express = require('express');
const session = require('express-session');
const { PORT, SESSION_SECRET, PUBLIC_DIR, DB_FILE } = require('./src/config');
const { migrateUsuariosJson } = require('./src/db');
const pageRoutes = require('./src/routes/pages');
const authRoutes = require('./src/routes/auth');
const fileRoutes = require('./src/routes/files');

const app = express();

migrateUsuariosJson();

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

app.use(pageRoutes);
app.use(authRoutes);
app.use(fileRoutes);

app.listen(PORT, () => {
    console.log(`
    ===========================================
    SEPHIROTH DRIVE ACTIVADO
    URL: http://localhost:${PORT}
    SQLite: ${DB_FILE}
    ===========================================
    `);
});
