const db = require('./db');

async function manualUpdate() {
    const leadId = 'b56015e1-f913-4cae-a968-a36a356f9277';
    const userId = '0d475fbb-1f50-4e46-acf0-466e586f9194';

    console.log(`Updating lead ${leadId} -> user ${userId}`);

    try {
        const res = await db.query(
            'UPDATE leads SET asignado_a = $1 WHERE id = $2 RETURNING *',
            [userId, leadId]
        );
        console.log("Update result:", res.rows[0]);
    } catch (err) {
        console.error("Update failed:", err.message);
    }
}

manualUpdate();
