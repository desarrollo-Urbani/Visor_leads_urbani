require('dotenv').config({ path: './server/.env' });
const db = require('./server/db');

async function debug() {
    const userId = '1871b7f0-3643-4e67-9dfa-844500e3b59e';
    const params = [userId];
    const query = `
            SELECT l.*, u.nombre as nombre_ejecutivo 
            FROM leads l 
            LEFT JOIN usuarios_sistema u ON l.asignado_a = u.id
            WHERE l.asignado_a = $1
    `;

    try {
        const res = await db.query(query, params);
        console.log("Results with string UUID:", res.rows.length);
        console.log("SQL:", query);
        console.log("Params:", params);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

debug();
