const db = require('./db');

async function checkCount() {
    try {
        const res = await db.query('SELECT count(*) FROM leads');
        console.log("Current leads count:", res.rows[0].count);
    } catch (err) {
        console.error("Error checking count:", err.message);
    }
}

checkCount();
