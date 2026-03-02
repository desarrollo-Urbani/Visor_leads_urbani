const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    user: 'admin_urbani',
    host: '127.0.0.1',
    database: 'antigravity_db',
    password: 'password123',
    port: 5432
});

async function run() {
    try {
        console.log('--- INICIANDO CARGA CRÍTICA ---');
        const content = fs.readFileSync('c:\\proyectos\\Leads\\salida\\archivo_carga_csv\\archivo_carga_csv.csv', 'latin1');
        const lines = content.split(/\r?\n/).filter(l => l.trim());

        console.log(`Líneas leídas: ${lines.length}`);
        if (lines.length < 2) {
            console.log('El archivo está vacío o solo tiene cabecera.');
            return;
        }

        const resUsers = await pool.query("SELECT id FROM usuarios_sistema WHERE role = 'ejecutivo' LIMIT 1");
        if (resUsers.rows.length === 0) {
            throw new Error('No se encontró ningún ejecutivo en la base de datos.');
        }
        const ejecutivoId = resUsers.rows[0].id;
        console.log(`Asignando leads al ejecutivo ID: ${ejecutivoId}`);

        let count = 0;
        // Empezamos en 1 para saltar la cabecera
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';');
            if (values.length < 5) continue;

            let observacion = values[5] || '';
            // Limpia comillas dobles al inicio y final que a veces pone Excel/CSV
            observacion = observacion.replace(/^"|"$/g, '');

            const row = [
                values[0] || 'Sin Nombre',
                values[1] || '',
                values[2] || '',
                values[3] || 'Sin proyecto',
                values[4] || '',
                observacion,
                values[6] || '',
                values[7] === 'true',
                values[8] || 'Sin Clasificacion',
                ejecutivoId
            ];

            await pool.query(
                `INSERT INTO leads (nombre, email, renta, proyecto, telefono, observacion, rut, es_ia, clasificacion, asignado_a) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                row
            );
            count++;
            if (count % 50 === 0) console.log(`Progreso: ${count} leads...`);
        }

        console.log(`✅ EXITO: Se han cargado ${count} leads a la base de datos real.`);
    } catch (e) {
        console.error('❌ ERROR DURANTE LA CARGA:');
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
