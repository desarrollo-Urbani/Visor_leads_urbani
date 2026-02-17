const db = require('./db');

async function listUsers() {
    try {
        const users = await db.query('SELECT id, nombre, email, password_hash, role FROM usuarios_sistema');
        console.log("--- USERS START ---");
        users.rows.forEach(u => {
            console.log(`Email: ${u.email} | Pass: ${u.password_hash} | Role: ${u.role}`);
        });
        console.log("--- USERS END ---");
    } catch (err) {
        console.error(err);
    }
}

listUsers();
