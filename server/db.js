const { Pool } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'admin_urbani',
    host: process.env.DB_HOST || '100.65.92.48', // Updated remote host
    database: process.env.DB_NAME || 'antigravity_db',
    password: process.env.DB_PASSWORD || 'password123',
    port: process.env.DB_PORT || 5432,
    // Connection timeout settings for remote latency
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
};

const pool = new Pool(config);

// Add event listeners for pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

// Retry logic wrapper
const queryWithRetry = async (text, params, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await pool.query(text, params);
        } catch (err) {
            if (i === retries - 1) throw err; // Throw on last retry

            const isConnectionError = err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT';
            if (isConnectionError) {
                console.warn(`Connection failed. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw err; // Don't retry logic errors
            }
        }
    }
};

// Initial connection test
(async () => {
    try {
        const client = await pool.connect();
        console.log(`Connected successfully to PostgreSQL at ${config.host}`);
        client.release();
    } catch (err) {
        console.error('Failed to establish initial connection to remote DB:', err.message);
    }
})();

module.exports = {
    query: queryWithRetry,
};
