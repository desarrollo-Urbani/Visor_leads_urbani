const db = require('./db');

async function listUsers() {
    try {
        const res = await db.query('SELECT id, nombre, email, role FROM usuarios_sistema');
        console.table(res.rows);
    } catch (err) {
        console.error("Error listing users:", err.message);
    }
}

listUsers();
