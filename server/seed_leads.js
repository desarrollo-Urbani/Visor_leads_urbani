const db = require('./db');

async function seedLeads() {
    console.log("Seeding initial leads...");

    // Check if leads exist
    try {
        const check = await db.query('SELECT COUNT(*) FROM leads');
        if (parseInt(check.rows[0].count) > 0) {
            console.log("Leads table already has data. Skipping seed.");
            return;
        }

        // Insert sample data
        await db.query(`
            INSERT INTO leads (nombre, email, renta_real, nom_proyecto, estado_gestion, created_at)
            VALUES 
            ('Juan Pérez', 'juan.perez@example.com', '1500000', 'Pinamar', 'Pendiente', NOW()),
            ('María González', 'maria.gonzalez@example.com', '2500000', 'Pinamar', 'Contactado', NOW() - INTERVAL '1 day'),
            ('Carlos Ruiz', 'carlos.ruiz@example.com', '1800000', 'Pinamar', 'Interesado', NOW() - INTERVAL '2 days')
        `);
        console.log("✅ Seed data inserted successfully (3 leads).");

    } catch (err) {
        console.error("Error seeding leads:", err.message);
    }
}

seedLeads();
