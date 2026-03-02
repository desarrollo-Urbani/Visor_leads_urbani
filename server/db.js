// Capa de acceso a datos del backend.
// Responsabilidades:
// 1) cargar variables de entorno
// 2) levantar pool de PostgreSQL
// 3) reintentar queries ante fallos de red temporales
// 4) caer en modo mock si la DB no está disponible
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Validación temprana de variables críticas de DB.
// Si falta alguna, detenemos el proceso para evitar errores ambiguos en runtime.
const required = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
required.forEach(key => {
    if (!process.env[key]) {
        console.error(`[FATAL] Missing required environment variable: ${key}`);
        process.exit(1);
    }
});

// Pool de conexiones PostgreSQL.
// Ajustes pensados para ambiente productivo básico.
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    max: 20, // máximo de conexiones simultáneas
});

pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err.message);
});

// Wrapper de query con retry exponencial para errores de conectividad.
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

// Test inicial de conexión.
// Si falla, habilitamos modo mock para no dejar caída total del backend.
let useMock = false;
const { mockQuery } = require('./mock_data');

(async () => {
    try {
        const client = await pool.connect();
        console.log(`[DB] Connected successfully to PostgreSQL at ${process.env.DB_HOST}`);
        client.release();
    } catch (err) {
        console.error('[DB] Failed to connect to database. Falling back to MOCK MODE.');
        useMock = true;
    }
})();

module.exports = {
    // Punto único de consulta usado por el resto del backend.
    query: async (text, params) => {
        if (useMock) return mockQuery(text, params);
        return queryWithRetry(text, params);
    }
};
