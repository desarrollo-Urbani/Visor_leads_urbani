const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: 'admin_urbani',
    host: 'localhost',
    database: 'antigravity_db',
    password: 'password123',
    port: 5432
});

async function setup() {
    console.log("Setting up database with test data...");
    const passwordHash = bcrypt.hashSync('Urbani2024!', 10);

    try {
        // 1. Ensure table schema exists (running the SQL script)
        // I'll skip this if tables exist or just run inserts

        // 2. Clear existing data
        await pool.query('DELETE FROM lead_status_history');
        await pool.query('DELETE FROM leads');
        await pool.query('DELETE FROM contact_events');
        await pool.query('DELETE FROM usuarios_sistema');

        // 3. Create Users
        const admin = await pool.query(`
            INSERT INTO public.usuarios_sistema (nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ('Felipe Admin', 'felipe@urbani.cl', $1, 'admin', true, false)
            RETURNING id
        `, [passwordHash]);

        const e1 = await pool.query(`
            INSERT INTO public.usuarios_sistema (nombre, email, password_hash, role, activo, must_reset_password)
            VALUES ('Ejecutivo Alpha', 'e1@urbani.cl', $1, 'ejecutivo', true, false)
            RETURNING id
        `, [passwordHash]);

        console.log("Users created.");

        // 4. Create Contact Event
        const event = await pool.query(`INSERT INTO public.contact_events (description) VALUES ($1) RETURNING id`, ['Carga Inicial de Prueba']);
        const eventId = event.rows[0].id;

        // 5. Create Leads
        await pool.query(`
            INSERT INTO public.leads (nombre, email, telefono, proyecto, asignado_a, contact_event_id, estado_gestion, notas_ejecutivo)
            VALUES 
            ('Juan Pérez', 'juan@example.com', '56911111111', 'Proyecto Urbani A', $1, $2, 'No Gestionado', 'Interesado en dpto 2D'),
            ('María García', 'maria@example.com', '56922222222', 'Proyecto Urbani B', $1, $2, 'No Gestionado', NULL),
            ('Carlos Soto', 'csoto@test.cl', '56933333333', 'Proyecto Urbani A', $1, $2, 'No Gestionado', NULL)
        `, [e1.rows[0].id, eventId]);

        console.log("✅ Database initialized successfully.");
    } catch (err) {
        console.error("❌ Setup failed:", err);
    } finally {
        await pool.end();
    }
}

setup();
