const db = require('./db');

async function testAuth() {
    console.log("Testing Database Connection...");
    try {
        const time = await db.query('SELECT NOW()');
        console.log("DB Connection OK:", time.rows[0]);
    } catch (e) {
        console.error("DB Connection FAILED:", e.message);
        return;
    }

    console.log("Checking Admin User...");
    const email = 'admin@urbani.com';
    try {
        const res = await db.query('SELECT * FROM usuarios_sistema WHERE email = $1', [email]);
        if (res.rows.length === 0) {
            console.error("User NOT FOUND. Did you run fix_schema.sql?");
        } else {
            console.log("User Found:", res.rows[0]);
            console.log("Stored Hash:", res.rows[0].password_hash);
        }
    } catch (e) {
        console.error("Query FAILED. Table 'usuarios_sistema' might be missing.", e.message);
    }
}

testAuth();
