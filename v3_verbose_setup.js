const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

console.log("Starting verbose setup...");

try {
    const envPath = path.resolve(__dirname, 'server', '.env');
    console.log("Checking env path:", envPath);
    if (!fs.existsSync(envPath)) {
        console.error("Env file not found at", envPath);
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            process.env[key] = value;
        }
    });
    console.log("Env loaded. Host:", process.env.DB_HOST);
} catch (e) {
    console.error("Error loading env:", e);
    process.exit(1);
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function run() {
    let client;
    try {
        console.log("Connecting to pool...");
        client = await pool.connect();
        console.log("Connected to DB.");

        const passwordHash = bcrypt.hashSync('123', 10);
        console.log("Password hash generated.");

        // Insert Users
        const u1 = await client.query(`
            INSERT INTO public.usuarios_sistema (nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ('Ejecutivo Alpha', 'e1@urbani.cl', $1, 'ejecutivo', true, false)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            RETURNING id
        `, [passwordHash]);
        const id1 = u1.rows[0].id;
        console.log("User 1 ready:", id1);

        const u2 = await client.query(`
            INSERT INTO public.usuarios_sistema (nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ('Ejecutiva Beta', 'e2@urbani.cl', $2, 'ejecutivo', true, false)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            RETURNING id
        `, [passwordHash]);
        const id2 = u2.rows[0].id;
        console.log("User 2 ready:", id2);

        // Event
        const event = await client.query(`INSERT INTO public.contact_events (description) VALUES ('UX Expert Demo Event') RETURNING id`);
        const eventId = event.rows[0].id;
        console.log("Event ready:", eventId);

        // Leads
        await client.query(`
            INSERT INTO public.leads (nombre, email, telefono, proyecto, asignado_a, contact_event_id, estado_gestion)
            VALUES 
            ('Juan UX', 'juan@ux.cl', '111', 'Proyecto UX', $1, $2, 'No Gestionado'),
            ('Maria IX', 'maria@ix.cl', '222', 'Proyecto IX', $1, $2, 'No Gestionado'),
            ('Carlos V3', 'carlos@v3.cl', '333', 'V3 Demo', $3, $2, 'No Gestionado'),
            ('Ana V3', 'ana@v3.cl', '444', 'V3 Demo', $3, $2, 'No Gestionado')
            ON CONFLICT (email, telefono, proyecto) DO NOTHING
        `, [id1, eventId, id2]);
        console.log("Leads inserted.");

        console.log("✅ SETUP SUCCESSFUL");
    } catch (err) {
        console.error("❌ ERROR IN SCRIPT:", err);
    } finally {
        if (client) client.release();
        await pool.end();
        process.exit(0);
    }
}

run();

