
const { Pool } = require('pg');
const path = require('path');
// Carga forzada del .env desde la carpeta server usando ruta absoluta
require('dotenv').config({ path: 'C:/proyectos/visor_leads/server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'admin_urbani',
    host: '127.0.0.1',
    database: process.env.DB_NAME || 'antigravity_db',
    password: process.env.DB_PASSWORD || 'password123',
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function listUsers() {
    try {
        const res = await pool.query('SELECT nombre, email, role, activo FROM public.usuarios_sistema');
        console.log('\n--- USUARIOS REALES EN DOCKER ---');
        res.rows.forEach(u => {
            console.log(`- ${u.nombre.padEnd(20)} | ${u.email.padEnd(25)} | Rol: ${u.role}`);
        });
        console.log('---------------------------------\n');
    } catch (err) {
        console.error('Error:', err.message);
        console.log('Asegurate de que Docker esté corriendo y la DB iniciada.');
    } finally {
        await pool.end();
    }
}

listUsers();
