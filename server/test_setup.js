require('dotenv').config({ path: './.env' });
const db = require('./db');
const bcrypt = require('bcryptjs');

async function run() {
    console.log("Starting server-local setup...");
    try {
        const passwordHash = bcrypt.hashSync('123', 10);

        // Insert Executives with FIXED IDs
        const id1 = 'e1111111-1111-1111-1111-111111111111';
        const id2 = 'e2222222-2222-2222-2222-222222222222';

        await db.query(`
            INSERT INTO usuarios_sistema (id, nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, password_hash = EXCLUDED.password_hash
        `, [id1, 'Ejecutivo Alpha', 'e1@urbani.cl', passwordHash, 'ejecutivo', true, false]);

        await db.query(`
            INSERT INTO usuarios_sistema (id, nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, password_hash = EXCLUDED.password_hash
        `, [id2, 'Ejecutiva Beta', 'e2@urbani.cl', passwordHash, 'ejecutivo', true, false]);

        console.log(`Users with fixed IDs: ${id1}, ${id2}`);

        // Event
        const event = await db.query(`INSERT INTO contact_events (description) VALUES ($1) RETURNING id`, ['UX Expert Demo']);
        const eventId = event.rows[0].id;

        // Leads
        await db.query(`
            INSERT INTO leads (nombre, email, telefono, proyecto, asignado_a, contact_event_id, estado_gestion)
            VALUES 
            ('Juan UX', 'juan@ux.cl', '111', 'Proyecto UX', $1, $2, 'No Gestionado'),
            ('Maria IX', 'maria@ix.cl', '222', 'Proyecto IX', $1, $2, 'No Gestionado'),
            ('Carlos V3', 'carlos@v3.cl', '333', 'V3 Demo', $3, $2, 'No Gestionado'),
            ('Ana V3', 'ana@v3.cl', '444', 'V3 Demo', $3, $2, 'No Gestionado')
            ON CONFLICT (email, telefono, proyecto) DO NOTHING
        `, [id1, eventId, id2]);

        console.log("✅ SUCCESS");
    } catch (err) {
        console.error("❌ ERROR:", err);
    } finally {
        process.exit(0);
    }
}

run();
