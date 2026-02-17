const db = require('./db');
(async () => {
    try {
        await db.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS renta VARCHAR(255)');
        await db.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS proyecto VARCHAR(255)');
        await db.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS telefono VARCHAR(255)');
        console.log('Columns added successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
