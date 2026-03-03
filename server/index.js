/*
  API principal del Visor de Leads.

  Este archivo concentra:
  - Autenticación (login JWT)
  - Gestión de leads (listar, actualizar, historial, asignación)
  - Administración de usuarios (CRUD + reset password + carga masiva)
  - Carga de campañas/leads desde CSV
  - Exportaciones y endpoints de dashboard
  - Servido del frontend compilado (dist)

  Nota de mantenimiento:
  - Si este archivo crece más, conviene separar rutas por dominio:
    auth.routes.js / leads.routes.js / admin.routes.js / dashboard.routes.js
*/
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const { verifyToken, requireAdmin } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'urbani-secret-key-2024';

// --- MIDDLEWARE ---
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Rate limiter for login: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- UPLOAD CONFIG ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

// Helper to safely delete a temp file
const cleanupTempFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }
};

// --- AUTH & LOGIN ---
app.post('/api/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    try {
        const result = await db.query('SELECT * FROM usuarios_sistema WHERE email = $1 AND activo = true', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }

        const tokenPayload = { id: user.id, email: user.email, nombre: user.nombre, role: user.role };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                role: user.role,
                must_reset_password: user.must_reset_password || false
            }
        });
    } catch (err) {
        console.error('[LOGIN ERROR]', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// --- LEADS WITH HIERARCHY ---
app.get('/api/leads', verifyToken, async (req, res) => {
    const { id: userId, role } = req.user;
    const { ejecutivo_id, proyecto, estado, jefe_id, fecha_desde, fecha_hasta, search } = req.query;
    const page = parseInt(req.query.page || '0', 10);
    const pageSize = parseInt(req.query.pageSize || '100', 10);
    const safePage = Math.max(0, page);
    const safePageSize = Math.min(Math.max(1, pageSize), 500);

    try {
        let query = `
            SELECT l.*, u.nombre as nombre_ejecutivo 
            FROM leads l 
            LEFT JOIN usuarios_sistema u ON l.asignado_a = u.id
            WHERE 1=1
        `;
        const params = [];

        if (role === 'admin') {
            // Level 1: See everything
        } else if (role === 'gerente') {
            params.push(userId);
            query += ` AND (
                l.asignado_a = $${params.length} 
                OR u.jefe_id = $${params.length}
                OR u.jefe_id IN (SELECT id FROM usuarios_sistema WHERE jefe_id = $${params.length})
            )`;
        } else if (role === 'subgerente') {
            params.push(userId);
            query += ` AND (l.asignado_a = $${params.length} OR u.jefe_id = $${params.length})`;
        } else {
            params.push(userId);
            query += ` AND l.asignado_a = $${params.length}`;
        }

        if (ejecutivo_id) { params.push(ejecutivo_id); query += ` AND l.asignado_a = $${params.length}`; }
        if (proyecto) { params.push(proyecto); query += ` AND l.proyecto = $${params.length}`; }
        if (estado) { params.push(estado); query += ` AND l.estado_gestion = $${params.length}`; }
        if (jefe_id) { params.push(jefe_id); query += ` AND u.jefe_id = $${params.length}`; }
        if (fecha_desde) { params.push(fecha_desde); query += ` AND l.created_at >= $${params.length}`; }
        if (fecha_hasta) { params.push(fecha_hasta); query += ` AND l.created_at <= $${params.length}`; }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (l.nombre ILIKE $${params.length} OR l.email ILIKE $${params.length} OR l.telefono ILIKE $${params.length})`;
        }

        // Count total for pagination metadata
        const countQuerySnapshot = query.replace('SELECT l.*, u.nombre as nombre_ejecutivo', 'SELECT COUNT(*) as total');
        const countResult = await db.query(countQuerySnapshot, params);
        const total = parseInt(countResult.rows[0]?.total || '0', 10);

        // Add ORDER + PAGINATION
        params.push(safePageSize);
        params.push(safePage * safePageSize);
        query += ` ORDER BY l.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        console.log('[DEBUG-SQL]', query);
        console.log('[DEBUG-PARAMS]', params);
        const result = await db.query(query, params);
        res.json({ data: result.rows, total, page: safePage, pageSize: safePageSize });
    } catch (err) {
        console.error('[GET LEADS]', err);
        res.status(500).json({ error: 'Error al obtener leads' });
    }
});

app.get('/api/admin/export-leads', verifyToken, async (req, res) => {
    const { id: userId, role } = req.user;
    const { ejecutivo_id, proyecto, estado, jefe_id, fecha_desde, fecha_hasta } = req.query;

    try {
        let query = `
            SELECT l.nombre, l.email, l.telefono, l.proyecto, l.estado_gestion, 
                   l.notas_ejecutivo, l.renta, l.fecha_proximo_contacto, l.created_at,
                   u.nombre as nombre_ejecutivo 
            FROM leads l 
            LEFT JOIN usuarios_sistema u ON l.asignado_a = u.id
            WHERE 1=1
        `;
        const params = [];

        if (role === 'admin') {
            // See everything
        } else if (role === 'gerente') {
            params.push(userId);
            query += ` AND (l.asignado_a = $${params.length} OR u.jefe_id = $${params.length} 
                         OR u.jefe_id IN (SELECT id FROM usuarios_sistema WHERE jefe_id = $${params.length}))`;
        } else if (role === 'subgerente') {
            params.push(userId);
            query += ` AND (l.asignado_a = $${params.length} OR u.jefe_id = $${params.length})`;
        } else {
            params.push(userId);
            query += ` AND l.asignado_a = $${params.length}`;
        }

        if (ejecutivo_id) { params.push(ejecutivo_id); query += ` AND l.asignado_a = $${params.length}`; }
        if (proyecto) { params.push(proyecto); query += ` AND l.proyecto = $${params.length}`; }
        if (estado) { params.push(estado); query += ` AND l.estado_gestion = $${params.length}`; }
        if (jefe_id) { params.push(jefe_id); query += ` AND u.jefe_id = $${params.length}`; }
        if (fecha_desde) { params.push(fecha_desde); query += ` AND l.created_at >= $${params.length}`; }
        if (fecha_hasta) { params.push(fecha_hasta); query += ` AND l.created_at <= $${params.length}`; }

        query += ` ORDER BY l.created_at DESC`;

        const result = await db.query(query, params);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No hay datos para exportar' });
        }

        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => headers.map(header => {
                const val = row[header];
                if (val === null || val === undefined) return '';
                const str = String(val).replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
                return `"${str}"`;
            }).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="gestion_leads_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send('\uFEFF' + csvContent);

    } catch (err) {
        console.error('[EXPORT ERROR]', err);
        res.status(500).json({ error: 'Error al exportar datos' });
    }
});


app.patch('/api/leads/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status, userId, notes, scheduledDate, renta } = req.body;
    try {
        await db.query('BEGIN');
        const oldRes = await db.query('SELECT estado_gestion FROM leads WHERE id = $1', [id]);
        const oldStatus = oldRes.rows[0]?.estado_gestion || 'No Gestionado';

        await db.query(
            'UPDATE leads SET estado_gestion = $1, notas_ejecutivo = $2, fecha_proximo_contacto = $3, renta = $4 WHERE id = $5',
            [status, notes || '', scheduledDate || null, renta !== undefined ? renta : null, id]
        );

        await db.query(
            'INSERT INTO lead_status_history (lead_id, estado_anterior, estado_nuevo, usuario_id, comentario) VALUES ($1, $2, $3, $4, $5)',
            [id, oldStatus, status, userId || null, notes || '']
        );

        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[PATCH LEAD]', err);
        res.status(500).json({ error: 'Error al actualizar lead' });
    }
});

app.get('/api/leads/:id/history', verifyToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT h.*, u.nombre as changed_by_name 
            FROM lead_status_history h
            LEFT JOIN usuarios_sistema u ON h.usuario_id = u.id
            WHERE h.lead_id = $1
            ORDER BY h.created_at DESC
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('[LEAD HISTORY]', err);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

app.post('/api/leads/assign', verifyToken, async (req, res) => {
    const { leadId, userId } = req.body;
    try {
        await db.query('UPDATE leads SET asignado_a = $1 WHERE id = $2', [userId || null, leadId]);
        res.json({ success: true });
    } catch (err) {
        console.error('[ASSIGN LEAD]', err);
        res.status(500).json({ error: 'Error al asignar' });
    }
});

// --- USERS ---
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, nombre, email, role, jefe_id, activo FROM usuarios_sistema WHERE activo = true');
        res.json(result.rows);
    } catch (err) {
        console.error('[GET USERS]', err);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// --- ADMIN USERS ---
app.post('/api/admin/users/bulk-upload', verifyToken, requireAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
    try {
        const results = await new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(req.file.path).pipe(csv()).on('data', d => rows.push(d)).on('end', () => resolve(rows)).on('error', reject);
        });

        const BCRYPT_ROUNDS = 10;
        for (const row of results) {
            const nombre = row.nombre || row.name || '';
            const email = row.email || '';
            if (nombre && email) {
                const autoPassword = Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(autoPassword, BCRYPT_ROUNDS);
                await db.query(
                    "INSERT INTO usuarios_sistema (nombre, email, password_hash, role, must_reset_password) VALUES ($1, $2, $3, 'ejecutivo', true) ON CONFLICT (email) DO NOTHING",
                    [nombre, email, hashedPassword]
                );
            }
        }
        cleanupTempFile(req.file.path);
        res.json({ success: true, count: results.length });
    } catch (err) {
        cleanupTempFile(req.file?.path);
        console.error('[BULK USER UPLOAD]', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT id, nombre, email, role, jefe_id, activo, created_at, must_reset_password FROM usuarios_sistema ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('[GET ADMIN USERS]', err);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.post('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
    const { nombre, email, password, role, jefe_id } = req.body;
    if (!nombre || !email || !password) return res.status(400).json({ error: 'nombre, email y password son requeridos' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO usuarios_sistema (nombre, email, password_hash, role, jefe_id, must_reset_password) VALUES ($1, $2, $3, $4, $5, false) RETURNING id',
            [nombre, email, hashedPassword, role || 'ejecutivo', jefe_id || null]
        );
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error('[CREATE USER]', err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/admin/users/:id', verifyToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const allowedFields = ['nombre', 'email', 'role', 'activo', 'jefe_id', 'must_reset_password'];
    const setClauses = [];
    const params = [];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            params.push(field === 'jefe_id' ? (req.body[field] || null) : req.body[field]);
            setClauses.push(`${field} = $${params.length}`);
        }
    }

    if (req.body.password) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        params.push(hashedPassword);
        setClauses.push(`password_hash = $${params.length}`);
    }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(id);
    try {
        await db.query(`UPDATE usuarios_sistema SET ${setClauses.join(', ')} WHERE id = $${params.length}`, params);
        res.json({ success: true });
    } catch (err) {
        console.error('[UPDATE USER]', err);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

app.delete('/api/admin/users/:id', verifyToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    if (req.user.id === id) {
        return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    try {
        // Integrity check: Leads
        const leadsCheck = await db.query('SELECT id FROM leads WHERE asignado_a = $1 LIMIT 1', [id]);
        if (leadsCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar: El usuario tiene leads asignados. Desactívalo en su lugar o reasigna sus leads.'
            });
        }

        // Integrity check: Campaign Creator
        const campaignCheck = await db.query('SELECT id FROM contact_events WHERE created_by = $1 LIMIT 1', [id]);
        if (campaignCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar: El usuario es creador de campañas históricas. Desactívalo en su lugar.'
            });
        }

        // Integrity check: Sub-users
        const subUsersCheck = await db.query('SELECT id FROM usuarios_sistema WHERE jefe_id = $1 LIMIT 1', [id]);
        if (subUsersCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar: El usuario es jefe de otros usuarios. Reasigna a sus subordinados primero.'
            });
        }

        await db.query('DELETE FROM usuarios_sistema WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('[DELETE USER]', err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

app.post('/api/admin/users/:id/reset-password', verifyToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE usuarios_sistema SET password_hash = $1, must_reset_password = false WHERE id = $2', [hashedPassword, id]);
        res.json({ success: true });
    } catch (err) {
        console.error('[RESET PASSWORD]', err);
        res.status(500).json({ error: 'Error al resetear contraseña' });
    }
});

// --- LEADS UPLOAD ---
app.post('/api/upload', verifyToken, requireAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No CSV' });
    const { adminId, allocations, campaignName } = req.body;
    const allocMap = JSON.parse(allocations || '{}');
    const targetUserIds = Object.keys(allocMap);

    try {
        // Detect separator by reading first line
        const firstLine = fs.readFileSync(req.file.path, 'utf8').split('\n')[0];
        const separator = firstLine.includes(';') ? ';' : ',';
        console.log(`[UPLOAD] Detected separator: "${separator}"`);

        const eventRes = await db.query(
            'INSERT INTO contact_events (description, created_by) VALUES ($1, $2) RETURNING id',
            [campaignName || `Carga Masiva ${new Date().toLocaleDateString()}`, adminId || null]
        );
        const eventId = eventRes.rows[0].id;

        const results = await new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(req.file.path)
                .pipe(csv({
                    separator,
                    mapHeaders: ({ header }) => header.toLowerCase().trim()
                }))
                .on('data', d => rows.push(d))
                .on('end', () => resolve(rows))
                .on('error', reject);
        });
        const fileBuffer = fs.readFileSync(req.file.path);
        await db.query('INSERT INTO archivos_csv (nombre_archivo, contenido_binario, contact_event_id) VALUES ($1, $2, $3)', [req.file.originalname, fileBuffer, eventId]);

        if (results.length > 0) {
            const userAssignments = {};
            targetUserIds.forEach(id => userAssignments[id] = 0);
            for (let i = 0; i < results.length; i += 100) {
                const rawBatch = results.slice(i, i + 100);

                // Deduplicate within the batch to avoid ON CONFLICT errors
                const batchMap = new Map();
                rawBatch.forEach(row => {
                    const key = `${(row.email || '').toLowerCase().trim()}|${(row.telefono || '').toLowerCase().trim()}|${(row.proyecto || 'General').toLowerCase().trim()}`;
                    batchMap.set(key, row); // Keep the last one
                });
                const batch = Array.from(batchMap.values());

                const values = [];
                const params = [];
                batch.forEach((row, idx) => {
                    let assignedTo = null;
                    if (targetUserIds.length > 0) {
                        let chosenId = targetUserIds[0];
                        let maxGap = -Infinity;
                        targetUserIds.forEach(id => {
                            const target = (i + idx + 1) * (allocMap[id] / 100);
                            const gap = target - userAssignments[id];
                            if (gap > maxGap) { maxGap = gap; chosenId = id; }
                        });
                        assignedTo = chosenId;
                        userAssignments[chosenId]++;
                    }
                    const off = idx * 12;
                    values.push(`($${off + 1}, $${off + 2}, $${off + 3}, $${off + 4}, $${off + 5}, 'No Gestionado', $${off + 6}, $${off + 7}, $${off + 8}, $${off + 9}, $${off + 10}, $${off + 11}, $${off + 12})`);
                    params.push(
                        (row.nombre || row.name || 'Sin Nombre').substring(0, 255),
                        (row.email || 'noemail@example.com').substring(0, 255),
                        (row.renta || row.income || row.renta_mensual || '0').toString().substring(0, 50),
                        (row.proyecto || row.project || 'General').substring(0, 100),
                        (row.telefono || row.phone || row.celular || '').toString().substring(0, 50),
                        eventId,
                        assignedTo,
                        null,
                        row.observacion || row.observation || row.notas || '',
                        (row.rut || row.dni || '').toString().substring(0, 20),
                        row.es_ia === 'true' || row.es_ia === true || row.ai === 'true',
                        row.clasificacion || row.classification || row.calidad || 'Sin Clasificacion'
                    );
                });
                if (batch.length > 0) {
                    await db.query(`
                        INSERT INTO leads (nombre, email, renta, proyecto, telefono, estado_gestion, contact_event_id, asignado_a, renta_real, observacion, rut, es_ia, clasificacion) 
                        VALUES ${values.join(',')}
                        ON CONFLICT (email, telefono, proyecto) DO UPDATE SET
                            nombre = EXCLUDED.nombre,
                            renta = EXCLUDED.renta,
                            observacion = EXCLUDED.observacion,
                            renta_real = EXCLUDED.renta_real,
                            contact_event_id = EXCLUDED.contact_event_id,
                            asignado_a = EXCLUDED.asignado_a,
                            rut = EXCLUDED.rut,
                            es_ia = EXCLUDED.es_ia,
                            clasificacion = EXCLUDED.clasificacion,
                            estado_gestion = 'No Gestionado'
                    `, params);
                }
            }
        }
        cleanupTempFile(req.file.path);
        res.json({ success: true, count: results.length });
    } catch (err) {
        cleanupTempFile(req.file?.path);
        console.error('[UPLOAD LEADS]', err);
        res.status(500).json({ error: err.message });
    }
});

// --- PURGE ALL DATA (admin only) ---
app.delete('/api/leads/purge', verifyToken, requireAdmin, async (req, res) => {
    try {
        await db.query('BEGIN');
        await db.query('DELETE FROM lead_status_history');
        await db.query('DELETE FROM archivos_csv');
        await db.query('DELETE FROM leads');
        await db.query('DELETE FROM contact_events');
        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[PURGE ERROR]', err);
        res.status(500).json({ error: 'Error al purgar datos: ' + err.message });
    }
});

// --- DASHBOARD & CAMPAIGNS ---
app.get('/api/dashboard/summary', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.nombre,
                COUNT(l.id) as total_assigned,
                COUNT(CASE WHEN l.estado_gestion = 'No Gestionado' THEN 1 END) as no_gestionado,
                COUNT(CASE WHEN l.estado_gestion = 'Por Contactar' THEN 1 END) as por_contactar,
                COUNT(CASE WHEN l.estado_gestion = 'En Proceso' THEN 1 END) as en_proceso,
                COUNT(CASE WHEN l.estado_gestion = 'Visita' THEN 1 END) as visita,
                COUNT(CASE WHEN l.estado_gestion = 'Venta Cerrada' THEN 1 END) as venta_cerrada
            FROM usuarios_sistema u
            LEFT JOIN leads l ON u.id = l.asignado_a
            GROUP BY u.id, u.nombre
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('[DASHBOARD SUMMARY]', err);
        res.status(500).json({ error: 'Error al obtener resumen' });
    }
});

app.get('/api/contact-events', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM leads WHERE contact_event_id = c.id) as total_leads,
                   (SELECT COUNT(*) FROM leads WHERE contact_event_id = c.id AND estado_gestion != 'No Gestionado') as processed_leads,
                   (SELECT COUNT(*) FROM leads WHERE contact_event_id = c.id AND estado_gestion = 'Venta Cerrada') as sales,
                   EXISTS(SELECT 1 FROM archivos_csv WHERE contact_event_id = c.id) as has_file
            FROM contact_events c
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('[CONTACT EVENTS]', err);
        res.status(500).json({ error: 'Error al obtener campañas' });
    }
});

app.get('/api/download-csv/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT nombre_archivo, contenido_binario FROM archivos_csv WHERE contact_event_id = $1', [req.params.id]);
        if (result.rows.length > 0) {
            const file = result.rows[0];
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${file.nombre_archivo}"`);
            res.send(file.contenido_binario);
        } else {
            res.status(404).send('Not found');
        }
    } catch (err) {
        console.error('[DOWNLOAD CSV]', err);
        res.status(500).send('Error');
    }
});

app.delete('/api/contact-events/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM contact_events WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('[DELETE EVENT]', err);
        res.status(500).json({ error: 'Error al eliminar campaña' });
    }
});

// --- AI ASSISTANT (OLLAMA) ---
app.post('/api/ai/chat', verifyToken, async (req, res) => {
    const { message, leadContext } = req.body;

    const systemPrompt = `Eres el "Asistente Inteligente Urbani", integrado en el Gestor de Leads de la inmobiliaria Urbani.
Tu objetivo es ayudar al ejecutivo a analizar los leads y responder dudas operativas.
Reglas:
1. Sé breve, profesional y directo.
2. Usa los datos del lead proporcionados para dar consejos de venta.
3. Si no sabes algo, no inventes.
4. Habla siempre en español.

DATOS DEL LEAD ACTUAL:
${JSON.stringify(leadContext || "Ninguno seleccionado")}

MENSAJE DEL USUARIO:
${message}

ASISTENTE URBANI:`;

    try {
        // Nota: Requiere Ollama corriendo localmente
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3', // O el modelo que el usuario tenga descargado (mistral, etc)
                prompt: systemPrompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json({ response: data.response });
    } catch (err) {
        console.error('[AI ERROR]', err);
        res.status(500).json({
            error: 'Error de comunicación con la IA.',
            details: 'Asegúrate de que Ollama esté corriendo en http://localhost:11434 y el modelo llama3 esté descargado.'
        });
    }
});

// Serve frontend SPA for any unmatched route
app.get('*', (req, res) => {
    const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send('Frontend missing');
});

app.listen(port, () => console.log(`[SERVER] Running at http://localhost:${port}`));
