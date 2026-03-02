const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables manually if needed, or assume they are in server/.env
const envPath = path.resolve(__dirname, 'server', '.env');
const envConfig = fs.readFileSync(envPath, 'utf8').split('\n');
envConfig.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function setup() {
    console.log("Directing multi-user test setup...");
    const passwordHash = bcrypt.hashSync('123', 10);

    try {
        // Create Executives
        const u1 = await pool.query(`
            INSERT INTO public.usuarios_sistema (nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            RETURNING id
        `, ['Ejecutivo 1', 'e1@urbani.cl', passwordHash, 'ejecutivo', true, false]);

        const u2 = await pool.query(`
            INSERT INTO public.usuarios_sistema (nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            RETURNING id
        `, ['Ejecutivo 2', 'e2@urbani.cl', passwordHash, 'ejecutivo', true, false]);

        const id1 = u1.rows[0].id;
        const id2 = u2.rows[0].id;

        console.log(`Users ready: ${id1}, ${id2}`);

        // Contact Event
        const event = await pool.query(`INSERT INTO public.contact_events (description) VALUES ($1) RETURNING id`, ['Expert UX Test Event']);
        const eventId = event.rows[0].id;

        // Leads for E1
        await pool.query(`
            INSERT INTO public.leads (nombre, email, telefono, proyecto, asignado_a, contact_event_id, estado_gestion)
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7),
            ($8, $9, $10, $11, $12, $6, $13)
            ON CONFLICT (email, telefono, proyecto) DO NOTHING
        `, [
            'Juan Experto', 'juan@expert.cl', '911', 'Lujo Alpha', id1, eventId, 'No Gestionado',
            'Maria Experta', 'maria@expert.cl', '922', 'Lujo Beta', id1, eventId, 'No Gestionado'
        ]);

        // Leads for E2
        await pool.query(`
            INSERT INTO public.leads (nombre, email, telefono, proyecto, asignado_a, contact_event_id, estado_gestion)
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7),
            ($8, $9, $10, $11, $12, $6, $13)
            ON CONFLICT (email, telefono, proyecto) DO NOTHING
        `, [
            'Carlos V3', 'carlos@v3.cl', '933', 'Lujo Alpha', id2, eventId, 'No Gestionado',
            'Ana V3', 'ana@v3.cl', '944', 'Lujo Beta', id2, eventId, 'No Gestionado'
        ]);

        console.log("✅ Data setup successfully completed via direct pool.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Setup failed:", err);
        process.exit(1);
    }
}

setup();
