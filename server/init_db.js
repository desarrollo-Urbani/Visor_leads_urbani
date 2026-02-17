const db = require('./db');
const fs = require('fs');
const path = require('path');

async function initDB() {
    console.log("Initializing Database...");

    // Read the fix_schema.sql file
    const schemaPath = path.join(__dirname, 'fix_schema.sql');
    try {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log("Executing schema script...");

        // Execute the SQL
        await db.query(schemaSql);
        console.log("✅ Schema applied successfully.");

    } catch (err) {
        console.error("Critical Error applying schema:", err.message);
    }
}

initDB();
