require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./db');

async function migrate() {
    console.log('[MIGRATION] Starting UX enhancements migration...');
    try {
        await db.query('BEGIN');

        console.log('[MIGRATION] Adding rut column...');
        await db.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS rut TEXT');

        console.log('[MIGRATION] Adding es_ia column...');
        await db.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS es_ia BOOLEAN DEFAULT false');

        console.log('[MIGRATION] Adding es_caliente column...');
        await db.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS es_caliente BOOLEAN DEFAULT false');

        await db.query('COMMIT');
        console.log('[MIGRATION] Success! Database updated.');
        process.exit(0);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[MIGRATION] FAILED:', err.message);
        process.exit(1);
    }
}

migrate();
