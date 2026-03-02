const { mockQuery } = require('./server/mock_data');

async function test() {
    try {
        console.log('--- Testing INSERT history ---');
        const insertQuery = 'INSERT INTO lead_status_history (lead_id, estado_anterior, estado_nuevo, usuario_id, comentario) VALUES ($1, $2, $3, $4, $5)';
        const insertParams = ['lead-1', 'No Gestionado', 'Contactado', 'user-e1-uuid', 'Test comment'];
        await mockQuery(insertQuery, insertParams);

        console.log('--- Testing SELECT history ---');
        const selectQuery = 'SELECT h.*, u.nombre as changed_by_name FROM lead_status_history h LEFT JOIN usuarios_sistema u ON h.usuario_id = u.id WHERE h.lead_id = $1 ORDER BY h.created_at DESC';
        const selectParams = ['lead-1'];
        const result = await mockQuery(selectQuery, selectParams);
        console.log('Result:', JSON.stringify(result.rows, null, 2));

        if (result.rows.length > 0 && result.rows[0].comentario === 'Test comment') {
            console.log('\n✅ FIX VERIFIED!');
        } else {
            console.log('\n❌ FIX FAILED!');
        }
    } catch (err) {
        console.error('Test error:', err);
    }
}

test();
