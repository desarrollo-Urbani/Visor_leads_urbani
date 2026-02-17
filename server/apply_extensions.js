const fs = require('fs');
const path = require('path');
const db = require('./db');

async function applyExtensions() {
    console.log("Applying Schema Extensions...");
    try {
        const sqlPath = path.join(__dirname, 'schema_extensions.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing SQL...");
        await db.query(sql);

        console.log("✅ Schema extensions applied successfully!");
    } catch (err) {
        console.error("❌ Error applying extensions:", err);
    }
}

applyExtensions();
