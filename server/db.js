// Capa de acceso a datos del backend.
// Responsabilidades:
// 1) cargar variables de entorno
// 2) levantar pool de PostgreSQL
// 3) reintentar queries ante fallos de red temporales
// 4) caer en modo mock si la DB no está disponible
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

let pool;
let useMock = false;

// Si existe DATABASE_URL (estándar en Railway), la usamos. 
// Si existen las variables por separado, usamos esas.
// Si no hay nada, caemos a modo mock directamente en lugar de matar el servidor.
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Frecuentemente requerido en BDs alojadas
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        keepAlive: true,
        max: 20
    });
} else if (process.env.DB_USER && process.env.DB_HOST && process.env.DB_NAME && process.env.DB_PASSWORD) {
    pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        keepAlive: true,
        max: 20,
    });
} else {
    console.warn(`[DB] No database credentials found (DATABASE_URL or DB_USER). Defaulting to MOCK MODE.`);
    useMock = true;
    // Creamos un pool dummy que no se conectará realmente para que no rompa el resto del código
    pool = new Pool({ max: 1 });
}

pool.on('error', (err) => {
    if (!useMock) {
        console.error('[DB] Unexpected error on idle client:', err.message);
    }
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
const { mockQuery } = require('./mock_data');

(async () => {
    if (useMock) return; // Ya estamos en mock mode
    try {
        const client = await pool.connect();
        const hostInfo = process.env.DB_HOST || (process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0] : 'RemoteDB');
        console.log(`[DB] Connected successfully to PostgreSQL at ${hostInfo}`);
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
