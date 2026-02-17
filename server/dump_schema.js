const db = require('./db');
const fs = require('fs');
(async () => {
    try {
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'leads'");
        const columns = res.rows.map(c => c.column_name).join('\n');
        fs.writeFileSync('schema_full.txt', columns);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
})();
