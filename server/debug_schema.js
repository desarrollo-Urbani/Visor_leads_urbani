const db = require('./db');

async function debugSchema() {
    console.log("Inspecting 'usuarios_sistema' table...");
    try {
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios_sistema'
        `);
        console.table(res.rows);
    } catch (e) {
        console.error("Error inspecting schema:", e.message);
    }
}

debugSchema();
