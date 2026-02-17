const db = require('./db');
async function checkLeads() {
    try {
        const result = await db.query("SELECT id, nombre, estado_gestion FROM leads");
        console.log("LEADS DATA:");
        result.rows.forEach(r => {
            console.log(`- ${r.nombre}: '${r.estado_gestion}'`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkLeads();
