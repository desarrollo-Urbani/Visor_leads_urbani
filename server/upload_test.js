const fs = require('fs');
const path = require('path');

async function upload() {
    console.log("Logging in as admin...");
    const loginRes = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'felipe@urbani.cl', password: 'Urbani2024!' })
    });
    const { token, user } = await loginRes.json();
    console.log("Admin logged in.");

    console.log("Preparing upload...");
    const csvPath = path.join(process.cwd(), 'PLANTILLA_CARGA_LEADS.csv');
    const csvContent = fs.readFileSync(csvPath);
    const blob = new Blob([csvContent], { type: 'text/csv' });

    const formData = new FormData();
    formData.append('file', blob, 'PLANTILLA_CARGA_LEADS.csv');
    formData.append('adminId', user.id);
    formData.append('allocations', JSON.stringify({
        'user-e1-uuid': 100 // 100% to Ejecutivo Alpha
    }));

    console.log("Uploading leads...");
    const uploadRes = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    const result = await uploadRes.json();
    console.log("Upload Result:", JSON.stringify(result, null, 2));

    if (result.success) {
        console.log("✅ Leads loaded successfully.");
    } else {
        console.error("❌ Upload failed:", result.error);
    }
}

upload().catch(console.error);
