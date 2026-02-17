const db = require('./db');

async function resetAdmin() {
    console.log("Resetting Admin Password...");
    try {
        const res = await db.query(
            "UPDATE usuarios_sistema SET password_hash = '123' WHERE email = 'admin@urbani.com' RETURNING *"
        );
        if (res.rowCount > 0) {
            console.log("✅ Admin password reset to '123' successfully.");
            console.log("Updated Row:", res.rows[0]);
        } else {
            console.error("❌ Admin user not found!");
            // Try creating it if missing
            console.log("Attempting to create admin...");
            const create = await db.query(
                "INSERT INTO usuarios_sistema (nombre, email, password_hash, role) VALUES ('Admin Urbani', 'admin@urbani.com', '123', 'admin') RETURNING *"
            );
            console.log("✅ Admin created:", create.rows[0]);
        }
    } catch (err) {
        console.error("Error resetting admin:", err);
    }
}

resetAdmin();
