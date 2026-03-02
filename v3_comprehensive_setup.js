require('dotenv').config({ path: './server/.env' });
const db = require('./server/db');
const bcrypt = require('bcryptjs');

async function setup() {
    console.log("Setting up multi-user test data...");
    const passwordHash = bcrypt.hashSync('123', 10);

    try {
        // 1. Create Executives
        const u1 = await db.query(`
            INSERT INTO usuarios_sistema (nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            RETURNING id
        `, ['Ejecutivo 1', 'e1@urbani.cl', passwordHash, 'ejecutivo', true, false]);

        const u2 = await db.query(`
            INSERT INTO usuarios_sistema (nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            RETURNING id
        `, ['Ejecutivo 2', 'e2@urbani.cl', passwordHash, 'ejecutivo', true, false]);

        const id1 = u1.rows[0].id;
        const id2 = u2.rows[0].id;

        console.log(`Users created: ${id1}, ${id2}`);

        // 2. Create a Contact Event
        const event = await db.query(`
            INSERT INTO contact_events (description) VALUES ($1) RETURNING id
        `, ['Carga Prueba V3']);
        const eventId = event.rows[0].id;

        // 3. Create Leads for E1
        await db.query(`
            INSERT INTO leads (nombre, email, telefono, proyecto, asignado_a, contact_event_id, estado_gestion)
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7),
            ($8, $9, $10, $11, $12, $6, $13)
            ON CONFLICT (email, telefono, proyecto) DO NOTHING
        `, [
            'Juan Alpha', 'juan@alpha.cl', '56911', 'Proyecto Alpha', id1, eventId, 'No Gestionado',
            'Maria Beta', 'maria@beta.cl', '56922', 'Proyecto Beta', id1, eventId, 'No Gestionado'
        ]);

        // 4. Create Leads for E2
        await db.query(`
            INSERT INTO leads (nombre, email, telefono, proyecto, asignado_a, contact_event_id, estado_gestion)
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7),
            ($14, $15, $16, $17, $18, $6, $19)
            ON CONFLICT (email, telefono, proyecto) DO NOTHING
        `, [
            'Carlos Gamma', 'carlos@gamma.cl', '56933', 'Proyecto Alpha', id2, eventId, 'No Gestionado',
            'Ana Delta', 'ana@delta.cl', '56944', 'Proyecto Beta', id2, eventId, 'No Gestionado',
            'Carlos Gamma', 'carlos@gamma.cl', '56933', 'Proyecto Alpha', id2, eventId, 'No Gestionado', // Duplicate check
            'Ana Delta', 'ana@delta.cl', '56944', 'Proyecto Beta', id2, eventId, 'No Gestionado'
        ]);

        console.log("✅ Data setup complete.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Setup failed:", err);
        process.exit(1);
    }
}

setup();
