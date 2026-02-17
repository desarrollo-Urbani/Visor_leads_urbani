const db = require('./db');

async function checkSample() {
    try {
        const res = await db.query('SELECT id, nombre, email, asignado_a, estado_gestion FROM leads LIMIT 5');
        console.table(res.rows);
    } catch (err) {
        console.error("Error checking sample:", err.message);
    }
}

checkSample();
