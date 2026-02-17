const db = require('./db');

async function debugQuery() {
    console.log("Debugging Leads Query...");
    const query = `
            SELECT l.*, u.nombre as nombre_ejecutivo 
            FROM leads l 
            LEFT JOIN usuarios_sistema u ON l.asignado_a = u.id 
            ORDER BY l.created_at DESC
            LIMIT 5
        `;
    try {
        const res = await db.query(query);
        console.log(`Query successful. Rows: ${res.rows.length}`);
        if (res.rows.length > 0) {
            console.log("First row keys:", Object.keys(res.rows[0]));
            console.log("First row ID:", res.rows[0].id);
        }
    } catch (err) {
        console.error("Query failed:", err.message);
        // Maybe try SELECT * FROM leads LIMIT 1 to check columns
        try {
            console.log("Trying simple SELECT *...");
            const res2 = await db.query('SELECT * FROM leads LIMIT 1');
            console.log("Simple select keys:", Object.keys(res2.rows[0]));
        } catch (e2) {
            console.error("Simple select failed:", e2.message);
        }
    }
}

debugQuery();
