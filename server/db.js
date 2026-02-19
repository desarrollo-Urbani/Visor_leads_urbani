const { Pool } = require('pg');
require('dotenv').config();

// Validate required env vars — fail fast if missing
const required = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
required.forEach(key => {
    if (!process.env[key]) {
        console.error(`[FATAL] Missing required environment variable: ${key}`);
        process.exit(1);
    }
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    max: 20, // Max pool size
});

pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err.message);
});

// Retry logic wrapper with exponential backoff
const queryWithRetry = async (text, params, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await pool.query(text, params);
        } catch (err) {
            if (i === retries - 1) throw err;
            const isConnectionError = err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT';
            if (isConnectionError) {
                console.warn(`[DB] Connection failed. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            } else {
                throw err;
            }
        }
    }
};

// Initial connection test
(async () => {
    try {
        const client = await pool.connect();
        console.log(`[DB] Connected successfully to PostgreSQL at ${process.env.DB_HOST}`);
        client.release();
    } catch (err) {
        console.error('[DB] Failed to connect to database:', err.message);
    }
})();

module.exports = { query: queryWithRetry };
