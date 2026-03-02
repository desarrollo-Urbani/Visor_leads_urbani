const { Pool } = require('pg');
const pool = new Pool({
    user: 'admin_urbani',
    host: 'localhost',
    database: 'antigravity_db',
    password: 'password123',
    port: 5432
});

async function check() {
    try {
        const res = await pool.query('SELECT nombre, email, estado_gestion, notas_ejecutivo FROM leads ORDER BY created_at DESC LIMIT 5');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
