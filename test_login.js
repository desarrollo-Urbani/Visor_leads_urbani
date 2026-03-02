// Using built-in fetch in Node 24

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@urbani.com', password: '123' })
        });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
