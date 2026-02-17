const db = require('./db');

async function debug() {
    console.log("=== Debugging Login & Filter ===");

    try {
        // 1. Check Users
        console.log("\n1. Checking Users:");
        const users = await db.query('SELECT id, nombre, email, password_hash, role FROM usuarios_sistema');
        users.rows.forEach(u => {
            console.log(`- ${u.nombre} (${u.email}) | Role: '${u.role}' | PassHash: '${u.password_hash}'`);
        });

        // 2. Simulate Filter Query
        console.log("\n2. Simulating Executive Filter Query:");

        // Find Juan
        const juan = users.rows.find(u => u.email.includes('juan'));
        if (juan) {
            const userId = juan.id;
            const role = juan.role; // Should be 'ejecutivo'

            console.log(`User: ${juan.nombre}, ID: ${userId}, Role: '${role}'`);

            let query = `
                SELECT l.id, l.nombre, l.asignado_a 
                FROM leads l 
                LEFT JOIN usuarios_sistema u ON l.asignado_a = u.id 
            `;

            const params = [];
            if (role === 'ejecutivo' && userId) {
                query += ' WHERE l.asignado_a = $1';
                params.push(userId);
                console.log("   -> Filter APPLIED (role is ejecutivo and userId exists)");
            } else {
                console.log("   -> Filter NOT APPLIED (Check role or userId)");
            }

            const res = await db.query(query, params);
            console.log(`   -> Rows returned: ${res.rowCount}`);

            // Check if any unassigned
            const unassigned = res.rows.filter(r => !r.asignado_a);
            if (unassigned.length > 0) {
                console.log(`   ❌ ERROR: Found ${unassigned.length} unassigned leads! Filter failed.`);
            } else {
                console.log("   ✅ SUCCESS: No unassigned leads found.");
            }

        } else {
            console.warn("Juan not found in DB");
        }

    } catch (err) {
        console.error("Debug Error:", err);
    }
}

debug();
