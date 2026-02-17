const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testFlow() {
    try {
        // 1. Get Users
        console.log("Fetching users...");
        const users = await request({
            hostname: 'localhost', port: 3000, path: '/api/users', method: 'GET'
        });
        if (!users || users.length === 0) throw new Error("No users found");
        const user = users[1] || users[0]; // Pick second user (Executive) if available
        console.log(`Target User: ${user.nombre} (${user.id})`);

        // 2. Get Leads
        console.log("Fetching leads...");
        const leads = await request({
            hostname: 'localhost', port: 3000, path: '/api/leads', method: 'GET'
        });
        if (!leads || leads.length === 0) throw new Error("No leads found");
        const lead = leads[0];
        console.log(`Target Lead: ${lead.nombre}`);
        console.log("Lead Keys:", Object.keys(lead));
        console.log("Lead ID:", lead.id);
        console.log("Lead ID Type:", typeof lead.id);
        console.log("Lead ID_EVENTO_CONTACTO:", lead.id_evento_contacto);

        // 3. Assign
        console.log("Assigning lead...");
        const assignData = { leadId: lead.id, userId: user.id };
        const result = await request({
            hostname: 'localhost', port: 3000, path: '/api/leads/assign', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, assignData);

        console.log("Assignment Result:", result);

        if (result && (result.asignado_a === user.id || result.success)) {
            console.log("✅ Assignment Successful!");
        } else {
            console.log("❌ Assignment Failed (Check response)");
        }

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

testFlow();
