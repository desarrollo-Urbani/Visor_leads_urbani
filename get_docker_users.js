
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: '127.0.0.1',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function listUsers() {
    try {
        const res = await pool.query('SELECT id, nombre, email, role, activo FROM usuarios_sistema');
        console.log('--- USUARIOS EN BASE DE DATOS (DOCKER) ---');
        console.table(res.rows);
    } catch (err) {
        console.error('Error consultando usuarios:', err.message);
    } finally {
        await pool.end();
    }
}

listUsers();
