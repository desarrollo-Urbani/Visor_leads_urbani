const db = require('./db');
const crypto = require('crypto');

async function seedUsers() {
    console.log("Seeding Users...");

    const users = [
        { nombre: 'Admin Urbani', email: 'admin@urbani.com', role: 'admin' },
        { nombre: 'Juan Pérez', email: 'juan.perez@urbani.com', role: 'ejecutivo' },
        { nombre: 'Alexandra', email: 'alexandra@urbani.com', role: 'ejecutivo' },
        { nombre: 'Maria González', email: 'maria.gonzalez@urbani.com', role: 'ejecutivo' }
    ];

    for (const u of users) {
        try {
            // Check if exists
            const check = await db.query('SELECT id FROM usuarios_sistema WHERE email = $1', [u.email]);
            if (check.rows.length === 0) {
                const password = '123';
                await db.query(
                    'INSERT INTO usuarios_sistema (nombre, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                    [u.nombre, u.email, password, u.role]
                );
                console.log(`✅ Created user: ${u.nombre}`);
            } else {
                console.log(`ℹ️ User already exists: ${u.nombre}`);
            }
        } catch (err) {
            console.error(`❌ Error creating ${u.nombre}:`, err.message);
        }
    }
    console.log("Seeding complete.");
}

seedUsers();
