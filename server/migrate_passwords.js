/**
 * migrate_passwords.js
 * 
 * ONE-TIME migration script to bcrypt-hash all existing plain-text passwords
 * in the usuarios_sistema table.
 * 
 * Run once with: node migrate_passwords.js
 * Delete this file after running.
 */

const bcrypt = require('bcryptjs');
const db = require('./db');

const BCRYPT_ROUNDS = 10;

// Heuristic: a bcrypt hash always starts with "$2" and is 60 chars long
const isAlreadyHashed = (str) => typeof str === 'string' && str.startsWith('$2') && str.length === 60;

async function migrate() {
    console.log('[MIGRATE] Starting password hash migration...');

    const result = await db.query('SELECT id, email, password_hash FROM usuarios_sistema');
    const users = result.rows;

    console.log(`[MIGRATE] Found ${users.length} users to check.`);

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
        if (isAlreadyHashed(user.password_hash)) {
            console.log(`  [SKIP] ${user.email} — already hashed`);
            skipped++;
            continue;
        }

        const hashed = await bcrypt.hash(user.password_hash, BCRYPT_ROUNDS);
        await db.query('UPDATE usuarios_sistema SET password_hash = $1 WHERE id = $2', [hashed, user.id]);
        console.log(`  [OK] ${user.email} — password migrated`);
        migrated++;
    }

    console.log(`\n[MIGRATE] Done! Migrated: ${migrated}, Skipped (already hashed): ${skipped}`);
    process.exit(0);
}

migrate().catch(err => {
    console.error('[MIGRATE] Fatal error:', err);
    process.exit(1);
});
