// Using built-in fetch from Node 18+
async function simulate() {
    console.log("Simulating Executive 1 Actions...");

    // 1. Login as Executive 1
    const loginRes = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'e1@urbani.cl', password: 'Urbani2026!' })
    });

    const data = await loginRes.json();
    if (!data.success) {
        console.error("Login failed:", data.error);
        return;
    }
    const { token, user } = data;
    console.log("Logged in as:", JSON.stringify(user, null, 2));

    // 2. Get assigned leads
    const leadsRes = await fetch('http://localhost:3000/api/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const leadsData = await leadsRes.json();
    console.log("Full Leads Response:", JSON.stringify(leadsData, null, 2));
    const { data: leads } = leadsData;

    if (leads.length > 0) {
        const lead = leads[0];
        console.log(`Updating Lead: ${lead.nombre} (${lead.id})`);

        // 3. Update status and add comment
        const updateRes = await fetch(`http://localhost:3000/api/leads/${lead.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'En Proceso',
                notes: 'LOG EXPERTO UX (Simulado): Iniciando contacto telefónico. Diseño de V3 permite flujo rápido.',
                userId: user.id
            })
        });

        const result = await updateRes.json();
        if (result.success) {
            console.log("✅ Lead updated successfully.");
        }
    }
}

simulate().catch(console.error);
