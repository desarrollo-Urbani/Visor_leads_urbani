const { Pool } = require('pg');

const pool = new Pool({
    user: 'admin_urbani',
    host: 'localhost',
    database: 'antigravity_db',
    password: 'password123',
    port: 5432
});

async function verifyExport() {
    try {
        console.log("Simulating CSV Export...");
        const query = `
            SELECT l.nombre, l.email, l.telefono, l.proyecto, l.estado_gestion, 
                   l.notas_ejecutivo, l.renta, l.fecha_proximo_contacto, l.created_at,
                   u.nombre as nombre_ejecutivo 
            FROM leads l 
            LEFT JOIN usuarios_sistema u ON l.asignado_a = u.id
            ORDER BY l.created_at DESC
        `;
        const result = await pool.query(query);
        const rows = result.rows;

        if (rows.length === 0) {
            console.log("No data found.");
            return;
        }

        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => headers.map(header => {
                const val = row[header];
                if (val === null || val === undefined) return '';
                const str = String(val).replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
                return `"${str}"`;
            }).join(','))
        ].join('\n');

        const filename = `gestion_leads_${new Date().toISOString().split('T')[0]}.csv`;
        console.log(`\nFILENAME: ${filename}`);
        console.log("\nCSV CONTENT PREVIEW (First 3 rows):");
        const lines = csvContent.split('\n');
        console.log(lines.slice(0, 4).join('\n'));

        // Verify integrity of "Juan Pérez"
        const juan = rows.find(r => r.nombre === 'Juan Pérez');
        if (juan) {
            console.log("\nINTEGRITY CHECK [Juan Pérez]:");
            console.log(`- Status: ${juan.estado_gestion}`);
            console.log(`- Notes: ${juan.notas_ejecutivo}`);
            if (juan.estado_gestion !== 'No Gestionado' || juan.notas_ejecutivo !== null) {
                console.log("✅ Data is integral and reflects recent management.");
            } else {
                console.log("ℹ️ Juan Pérez is present but has default 'No Gestionado' status.");
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

verifyExport();
