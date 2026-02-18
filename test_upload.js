const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = 'c:/proyectos/visor_leads/test_load.csv';
const adminId = '15e77656-8f06-46bd-970f-9bf35e3432e6';
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const data = fs.readFileSync(filePath);

const payload = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="adminId"\r\n\r\n`,
    `${adminId}\r\n`,
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="allocations"\r\n\r\n`,
    `{"${adminId}": 100}\r\n`,
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="file"; filename="test_load.csv"\r\n`,
    `Content-Type: text/csv\r\n\r\n`
].join('');

const footer = `\r\n--${boundary}--\r\n`;

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(payload) + data.length + Buffer.byteLength(footer)
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', body);
    });
});

req.on('error', (e) => console.error('ERROR:', e.message));

req.write(payload);
req.write(data);
req.write(footer);
req.end();
