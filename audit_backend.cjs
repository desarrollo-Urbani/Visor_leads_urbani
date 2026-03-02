const { mockQuery } = require('./server/mock_data');
const fs = require('fs');
const path = require('path');

async function auditBackend() {
    console.log('=== STARTING BACKEND AUDIT ===\n');
    let results = [];

    // 1. Audit Lead Upload & Conflict Handling
    try {
        console.log('Testing Lead Upload (Conflict Handling)...');
        const insertQuery = `INSERT INTO leads (nombre, email, renta, proyecto, telefono, estado_gestion, contact_event_id, asignado_a) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email, telefono, proyecto) DO UPDATE SET nombre = EXCLUDED.nombre`;
        const params = ['Audit User', 'audit@test.cl', '1000000', 'Project Alpha', '56900000000', 'No Gestionado', 'evt-1', 'user-e1-uuid'];

        await mockQuery(insertQuery, params);
        const check = await mockQuery('SELECT * FROM leads WHERE email = $1', ['audit@test.cl']);

        if (check.rows.length > 0) {
            console.log('✅ Lead Upload: SUCCESS');
            results.push({ feature: 'Lead Upload', status: 'PASS' });
        } else {
            console.log('❌ Lead Upload: FAILED');
            results.push({ feature: 'Lead Upload', status: 'FAIL' });
        }
    } catch (e) {
        console.error('Audit Lead Upload error:', e);
        results.push({ feature: 'Lead Upload', status: 'ERROR' });
    }

    // 2. Audit Lead History
    try {
        console.log('\nTesting Lead History Persistence...');
        const histInsert = 'INSERT INTO lead_status_history (lead_id, estado_anterior, estado_nuevo, usuario_id, comentario) VALUES ($1, $2, $3, $4, $5)';
        await mockQuery(histInsert, ['lead-1', 'No Gestionado', 'Contactado', 'user-e1-uuid', 'Audit History']);

        const histCheck = await mockQuery('SELECT * FROM lead_status_history WHERE lead_id = $1', ['lead-1']);
        if (histCheck.rows.some(h => h.comentario === 'Audit History')) {
            console.log('✅ Lead History: SUCCESS');
            results.push({ feature: 'Lead History', status: 'PASS' });
        } else {
            console.log('❌ Lead History: FAILED');
            results.push({ feature: 'Lead History', status: 'FAIL' });
        }
    } catch (e) {
        console.error('Audit Lead History error:', e);
        results.push({ feature: 'Lead History', status: 'ERROR' });
    }

    // 3. Audit Lead Management (Update)
    try {
        console.log('\nTesting Lead Status Update...');
        const updateQuery = 'UPDATE leads SET estado_gestion = $1, notas_ejecutivo = $2 WHERE id = $3';
        await mockQuery(updateQuery, ['Contactado', 'Audit Note', 'lead-1']);

        const updateCheck = await mockQuery('SELECT * FROM leads WHERE id = $1', ['lead-1']);
        if (updateCheck.rows[0].estado_gestion === 'Contactado') {
            console.log('✅ Lead Management: SUCCESS');
            results.push({ feature: 'Lead Management', status: 'PASS' });
        } else {
            console.log('❌ Lead Management: FAILED');
            results.push({ feature: 'Lead Management', status: 'FAIL' });
        }
    } catch (e) {
        console.error('Audit Lead Management error:', e);
        results.push({ feature: 'Lead Management', status: 'ERROR' });
    }

    // Summary
    console.log('\n=== AUDIT SUMMARY ===');
    console.table(results);
}

auditBackend();
