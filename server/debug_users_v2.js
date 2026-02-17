const db = require('./db');

async function debugUsers() {
    console.log("Debugging Users Table...");
    try {
        const res = await db.query('SELECT count(*) FROM usuarios_sistema');
        console.log(`Row count: ${res.rows[0].count}`);

        const rows = await db.query('SELECT * FROM usuarios_sistema');
        console.log("Rows found:", rows.rows.length);
        if (rows.rows.length > 0) {
            console.log(JSON.stringify(rows.rows, null, 2));
        } else {
            console.log("Table is empty.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

debugUsers();
