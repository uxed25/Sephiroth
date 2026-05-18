# Documentacion del TFG: Sephiroth Cloud

## 1. Resumen

Sephiroth Cloud es una aplicacion web de almacenamiento de archivos desarrollada con Node.js, Express y SQLite. El sistema permite registrar usuarios, iniciar sesion, subir archivos, listar los archivos almacenados, descargarlos y eliminarlos. La aplicacion incluye una interfaz web sencilla con tematica visual inspirada en Sephiroth y una zona de subida con seleccion tradicional de archivos y soporte de drag and drop.

El objetivo principal del proyecto es construir una solucion funcional de tipo nube privada basica, aplicando conceptos de desarrollo web backend, gestion de sesiones, persistencia de datos, subida segura de archivos y separacion de responsabilidades dentro del codigo.

## 2. Objetivos del proyecto

### 2.1 Objetivo general

Desarrollar una aplicacion web que permita a usuarios autenticados gestionar sus propios archivos en un entorno privado, persistente y accesible desde el navegador.

### 2.2 Objetivos especificos

- Implementar registro e inicio de sesion de usuarios.
- Mantener sesiones de usuario mediante cookies de sesion.
- Permitir la subida de archivos al servidor.
- Asociar cada archivo al usuario que lo ha subido.
- Guardar metadatos de usuarios y archivos en una base de datos SQLite.
- Permitir la descarga de archivos propios.
- Permitir la eliminacion de archivos propios.
- Proteger las rutas privadas mediante middleware de autenticacion.
- Crear una interfaz web simple para login, registro y panel de archivos.
- Incorporar una experiencia de subida mejorada con drag and drop.

## 3. Alcance

La aplicacion cubre las funcionalidades esenciales de un sistema de almacenamiento privado:

- Alta de usuarios.
- Autenticacion.
- Panel privado.
- Subida de archivos.
- Listado de archivos.
- Descarga de archivos.
- Eliminacion de archivos.
- Persistencia con SQLite.
- Almacenamiento fisico por usuario en el sistema de archivos.

Quedan fuera del alcance de esta version:

- Comparticion publica de archivos.
- Roles de usuario avanzados.
- Recuperacion de contrasenas.
- Cifrado de archivos en reposo.
- Previsualizacion avanzada de documentos.
- Limites de cuota por usuario.
- Despliegue en produccion con HTTPS y proxy inverso.

## 4. Tecnologias utilizadas

### 4.1 Backend

- Node.js: entorno de ejecucion JavaScript en servidor.
- Express: framework web para crear rutas HTTP y middleware.
- express-session: gestion de sesiones de usuario.
- multer: gestion de subida de archivos multipart/form-data.
- node:sqlite: modulo nativo de Node.js para trabajar con SQLite.

### 4.2 Frontend

- HTML5.
- CSS3.
- JavaScript en navegador.
- Formularios HTML para autenticacion y subida de archivos.
- API Fetch para cargar archivos, eliminar archivos y consultar el usuario actual.

### 4.3 Persistencia

- SQLite: base de datos local almacenada en `data/sephiroth.sqlite`.
- Sistema de archivos: almacenamiento real de los archivos subidos en `uploads/`.

### 4.4 Gestion del proyecto

- pnpm: gestor de paquetes.
- nodemon: herramienta de desarrollo para reiniciar el servidor automaticamente.
- Git: control de versiones.

## 5. Estructura del proyecto

```text
Sephiroth/
├── data/
│   └── sephiroth.sqlite
├── Instrucciones/
│   ├── Instrucciones
│   └── Documentacion_TFG.md
├── public/
│   ├── dashboard.html
│   ├── login.html
│   └── registro.html
├── src/
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── files.js
│   │   └── pages.js
│   ├── config.js
│   ├── db.js
│   └── passwords.js
├── uploads/
├── index.js
├── package.json
├── pnpm-lock.yaml
└── usuarios.json
```

## 6. Descripcion de modulos

### 6.1 `index.js`

Es el punto de entrada de la aplicacion. Sus responsabilidades principales son:

- Crear la instancia de Express.
- Inicializar la migracion de usuarios desde `usuarios.json`.
- Configurar sesiones con `express-session`.
- Activar los parsers de JSON y formularios.
- Servir archivos estaticos desde `public/`.
- Registrar las rutas de paginas, autenticacion y archivos.
- Arrancar el servidor en el puerto configurado.

### 6.2 `src/config.js`

Centraliza rutas y variables de configuracion:

- `PORT`: puerto del servidor.
- `SESSION_SECRET`: secreto de sesion.
- `DATA_DIR`: carpeta de datos.
- `DB_FILE`: ruta de la base de datos SQLite.
- `USUARIOS_FILE`: ruta del archivo JSON inicial de usuarios.
- `UPLOADS_DIR`: carpeta de archivos subidos.
- `PUBLIC_DIR`: carpeta de recursos publicos.

### 6.3 `src/db.js`

Gestiona la base de datos. Crea las tablas si no existen y prepara consultas reutilizables.

Tablas principales:

- `users`: almacena usuarios registrados.
- `files`: almacena metadatos de archivos subidos.

Tambien incluye la funcion `migrateUsuariosJson`, que permite migrar usuarios antiguos desde `usuarios.json` a SQLite.

### 6.4 `src/passwords.js`

Contiene la logica relacionada con contrasenas:

- Creacion de hashes.
- Verificacion de contrasenas.
- Deteccion de contrasenas ya hasheadas.

Este modulo evita guardar contrasenas nuevas en texto plano.

### 6.5 `src/middleware/auth.js`

Incluye el middleware `requireAuth`, usado para proteger rutas privadas. Si no existe un usuario en sesion, redirige al login.

### 6.6 `src/routes/pages.js`

Define las rutas que devuelven paginas HTML:

- `GET /`: pagina de login.
- `GET /registro`: pagina de registro.
- `GET /dashboard`: panel privado, protegido por autenticacion.

### 6.7 `src/routes/auth.js`

Gestiona autenticacion y sesiones:

- `POST /register`: registra un nuevo usuario.
- `POST /login`: valida credenciales e inicia sesion.
- `GET /logout`: destruye la sesion.
- `GET /api/usuario-actual`: devuelve el usuario autenticado.

### 6.8 `src/routes/files.js`

Gestiona los archivos:

- `POST /upload`: sube un archivo.
- `GET /api/archivos`: lista los archivos del usuario actual.
- `POST /api/eliminar`: elimina un archivo del usuario actual.
- `GET /drive/:id`: descarga un archivo del usuario actual.

El modulo usa `multer` para procesar archivos recibidos desde formularios.

## 7. Base de datos

### 7.1 Tabla `users`

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Campos:

- `id`: identificador unico del usuario.
- `username`: nombre de usuario unico.
- `password`: contrasena almacenada como hash.
- `created_at`: fecha de creacion.

### 7.2 Tabla `files`

```sql
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
```

Campos:

- `id`: identificador unico del archivo.
- `user_id`: usuario propietario.
- `stored_name`: nombre fisico guardado en el servidor.
- `original_name`: nombre original del archivo.
- `size`: tamano en bytes.
- `mime_type`: tipo MIME del archivo.
- `created_at`: fecha de subida.

## 8. Flujo de funcionamiento

### 8.1 Registro

1. El usuario accede a `/registro`.
2. Introduce nombre de usuario y contrasena.
3. El servidor comprueba que no exista otro usuario con el mismo nombre.
4. Se guarda el usuario en SQLite.
5. El usuario vuelve a la pantalla de login.

### 8.2 Inicio de sesion

1. El usuario accede a `/`.
2. Introduce credenciales.
3. El servidor verifica la contrasena.
4. Si las credenciales son correctas, se guarda el identificador del usuario en sesion.
5. El usuario es redirigido a `/dashboard`.

### 8.3 Subida de archivos

1. El usuario entra en el panel privado.
2. Selecciona un archivo o lo arrastra sobre la zona de subida.
3. El formulario envia el archivo a `POST /upload`.
4. `multer` guarda el archivo en la carpeta del usuario.
5. Se registran los metadatos en SQLite.
6. El usuario vuelve al panel con un mensaje de confirmacion.

### 8.4 Listado de archivos

1. El panel ejecuta una peticion a `GET /api/archivos`.
2. El backend consulta los archivos asociados al usuario en sesion.
3. La interfaz renderiza nombre, tamano, tipo, fecha y acciones disponibles.

### 8.5 Descarga

1. El usuario pulsa "Descargar".
2. Se solicita `GET /drive/:id`.
3. El backend comprueba que el archivo pertenezca al usuario.
4. Se descarga el archivo con su nombre original.

### 8.6 Eliminacion

1. El usuario pulsa "Eliminar".
2. La interfaz pide confirmacion.
3. Se envia una peticion a `POST /api/eliminar`.
4. El backend comprueba propiedad, borra el archivo fisico y elimina el registro de SQLite.
5. La lista se actualiza en el panel.

## 9. Seguridad

### 9.1 Medidas implementadas

- Rutas privadas protegidas con `requireAuth`.
- Sesiones de usuario gestionadas con `express-session`.
- Separacion de archivos por usuario en carpetas independientes.
- Comprobacion de propiedad antes de listar, descargar o eliminar archivos.
- Sanitizacion del nombre fisico de los archivos con `safeFilename`.
- Uso de nombres unicos para evitar colisiones entre archivos.
- Hash de contrasenas para nuevos usuarios.
- Configuracion de `SESSION_SECRET` mediante variable de entorno.

### 9.2 Riesgos y mejoras pendientes

- Activar HTTPS en despliegue real.
- Configurar cookies `secure`, `httpOnly` y `sameSite` de forma estricta en produccion.
- Anadir limite de tamano de archivo en `multer`.
- Validar extensiones o tipos MIME permitidos.
- Implementar proteccion CSRF para formularios y peticiones POST.
- Anadir rate limiting en login y registro.
- Evitar mensajes de error que puedan facilitar enumeracion de usuarios.
- Cifrar archivos sensibles en reposo si el caso de uso lo requiere.

## 10. Interfaz de usuario

La aplicacion tiene tres pantallas principales:

- Login: acceso de usuarios existentes.
- Registro: creacion de nuevos usuarios.
- Dashboard: gestion de archivos del usuario autenticado.

El dashboard incluye:

- Nombre del usuario autenticado.
- Zona de subida.
- Soporte para seleccionar archivo desde el explorador.
- Soporte para arrastrar y soltar archivos.
- Resumen del numero de archivos y tamano total.
- Lista de archivos con acciones de descarga y eliminacion.
- Mensajes de exito y error.

## 11. Instalacion

### 11.1 Requisitos previos

- Node.js instalado.
- pnpm instalado.
- Git instalado.

Comprobacion:

```bash
node -v
pnpm -v
git --version
```

### 11.2 Instalacion de dependencias

```bash
pnpm install
```

### 11.3 Configuracion de entorno

Copiar `.env.example` a `.env` y establecer un secreto privado:

```bash
cp .env.example .env
```

Ejemplo:

```env
PORT=3000
SESSION_SECRET=valor_privado_largo_y_seguro
```

### 11.4 Arranque en desarrollo

```bash
pnpm dev
```

### 11.5 Arranque normal

```bash
pnpm start
```

La aplicacion queda disponible en:

```text
http://localhost:3000
```

## 12. Pruebas funcionales

### 12.1 Registro

Caso de prueba:

1. Acceder a `/registro`.
2. Crear un usuario nuevo.
3. Verificar que vuelve al login.
4. Confirmar que el usuario queda registrado en SQLite.

Resultado esperado:

- El usuario se crea correctamente.
- No se permite duplicar el mismo nombre de usuario.

### 12.2 Login

Caso de prueba:

1. Acceder a `/`.
2. Introducir credenciales validas.
3. Comprobar redireccion a `/dashboard`.

Resultado esperado:

- El usuario entra al panel privado.
- Las credenciales invalidas muestran acceso denegado.

### 12.3 Subida de archivo

Caso de prueba:

1. Entrar al dashboard.
2. Seleccionar un archivo.
3. Pulsar el boton de subida.

Resultado esperado:

- El archivo se guarda en `uploads/user_ID/`.
- El archivo aparece en la lista del dashboard.

### 12.4 Drag and drop

Caso de prueba:

1. Entrar al dashboard.
2. Arrastrar un archivo sobre la zona de subida.
3. Comprobar que la zona se resalta.
4. Soltar el archivo.
5. Pulsar el boton de subida.

Resultado esperado:

- El nombre del archivo aparece en la interfaz.
- El boton de subida se habilita.
- El archivo se sube correctamente.

### 12.5 Descarga

Caso de prueba:

1. Subir un archivo.
2. Pulsar "Descargar".

Resultado esperado:

- El navegador descarga el archivo con su nombre original.

### 12.6 Eliminacion

Caso de prueba:

1. Subir un archivo.
2. Pulsar "Eliminar".
3. Confirmar la accion.

Resultado esperado:

- El archivo desaparece de la lista.
- El archivo fisico se elimina del servidor.
- El registro se elimina de SQLite.

## 13. Validaciones tecnicas recomendadas

Comprobar sintaxis de archivos JavaScript:

```bash
node --check index.js
node --check src/routes/auth.js
node --check src/routes/files.js
node --check src/routes/pages.js
node --check src/db.js
node --check src/config.js
node --check src/middleware/auth.js
```

Revisar cambios antes de commit:

```bash
git status
git diff
```

## 14. Despliegue

Para un despliegue real se recomienda:

- Usar un servidor Linux.
- Ejecutar la aplicacion con un gestor de procesos como PM2 o systemd.
- Colocar Nginx o Apache como proxy inverso.
- Activar HTTPS con Certbot.
- Configurar variables de entorno reales.
- Proteger la carpeta de datos y subidas con permisos adecuados.
- Realizar copias de seguridad periodicas de `data/` y `uploads/`.

Ejemplo de arranque:

```bash
pnpm install --prod
pnpm start
```

## 15. Mantenimiento

Tareas recomendadas:

- Revisar logs del servidor.
- Hacer copias de seguridad de la base de datos SQLite.
- Hacer copias de seguridad de los archivos subidos.
- Actualizar dependencias de forma controlada.
- Comprobar permisos de `uploads/` y `data/`.
- Revisar el crecimiento de almacenamiento.

## 16. Posibles mejoras futuras

- Cuotas de almacenamiento por usuario.
- Busqueda de archivos por nombre.
- Ordenacion y filtros.
- Previsualizacion de imagenes o PDFs.
- Recuperacion de contrasena.
- Verificacion de email.
- Comparticion temporal mediante enlaces.
- Panel de administracion.
- Logs de actividad.
- Papelera de reciclaje.
- Subida multiple.
- Barra de progreso durante la subida.
- Tests automatizados de backend.
- Tests end-to-end con Playwright.
- Dockerizacion de la aplicacion.

## 17. Conclusion

Sephiroth Cloud cumple los objetivos planteados para una aplicacion web de almacenamiento privado basico. El proyecto integra backend con Express, persistencia con SQLite, gestion de sesiones, subida de archivos con multer y una interfaz web funcional. La separacion de rutas, configuracion, base de datos y middleware facilita la comprension del sistema y permite ampliar la aplicacion en futuras iteraciones.

El resultado es una base solida para explicar en un TFG los fundamentos de una aplicacion web completa: autenticacion, gestion de estado, almacenamiento persistente, seguridad basica, interaccion cliente-servidor y organizacion de un proyecto Node.js.
