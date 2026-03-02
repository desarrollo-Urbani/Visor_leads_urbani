const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: 'admin_urbani',
    host: 'localhost',
    database: 'antigravity_db',
    password: 'password123',
    port: 5432
});

async function verifyExport() {
    try {
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

        fs.writeFileSync('test_export_output.csv', '\uFEFF' + csvContent, 'utf8');
        console.log("File saved as test_export_output.csv");

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

verifyExport();
