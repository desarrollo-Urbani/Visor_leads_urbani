const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('./db');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// --- AUTH & LOGIN ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM usuarios_sistema WHERE email = $1', [email]);
        const user = result.rows[0];
        if (user && user.password_hash === password) {
            res.json({ success: true, user: { id: user.id, email: user.email, nombre: user.nombre, role: user.role } });
        } else {
            res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error('[LOGIN ERROR]', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// --- LEADS ---

app.get('/api/leads', async (req, res) => {
    const { userId, role, ejecutivo_id, proyecto, estado, jefe_id } = req.query;
    try {
        let query = `
            SELECT l.*, u.nombre as nombre_ejecutivo 
            FROM leads l 
            LEFT JOIN usuarios_sistema u ON l.asignado_a = u.id
            WHERE 1=1
        `;
        const params = [];

        if (role === 'ejecutivo') {
            params.push(userId);
            query += ` AND l.asignado_a = $${params.length}`;
        } else if (role === 'jefe') {
            params.push(userId);
            query += ` AND (l.asignado_a = $${params.length} OR u.jefe_id = $${params.length})`;
        }

        if (ejecutivo_id) {
            params.push(ejecutivo_id);
            query += ` AND l.asignado_a = $${params.length}`;
        }
        if (proyecto) {
            params.push(proyecto);
            query += ` AND l.proyecto = $${params.length}`;
        }
        if (estado) {
            params.push(estado);
            query += ` AND l.estado_gestion = $${params.length}`;
        }
        if (jefe_id) {
            params.push(jefe_id);
            query += ` AND u.jefe_id = $${params.length}`;
        }

        query += " ORDER BY l.created_at DESC";
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener leads" });
    }
});

app.patch('/api/leads/:id', async (req, res) => {
    const { id } = req.params;
    const { status, userId, notes, scheduledDate } = req.body;
    try {
        await db.query('BEGIN');

        // Get old status
        const oldRes = await db.query("SELECT estado_gestion FROM leads WHERE id = $1", [id]);
        const oldStatus = oldRes.rows[0]?.estado_gestion;

        // Update Lead
        await db.query(
            "UPDATE leads SET estado_gestion = $1, notas_ejecutivo = $2, created_at = COALESCE($3, created_at) WHERE id = $4",
            [status, notes, scheduledDate || null, id]
        );

        // Record History
        await db.query(
            "INSERT INTO lead_status_history (lead_id, estado_anterior, estado_nuevo, usuario_id, comentario) VALUES ($1, $2, $3, $4, $5)",
            [id, oldStatus, status, userId, notes]
        );

        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: "Error al actualizar lead" });
    }
});

app.get('/api/leads/:id/history', async (req, res) => {
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
        console.error(err);
        res.status(500).json({ error: "Error al obtener historial" });
    }
});

app.post('/api/leads/assign', async (req, res) => {
    const { leadId, userId, adminId } = req.body;
    try {
        await db.query("UPDATE leads SET asignado_a = $1 WHERE id = $2", [userId, leadId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al asignar" });
    }
});

// --- USERS ---
app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query("SELECT id, nombre, email, role, jefe_id FROM usuarios_sistema WHERE activo = true");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// --- UPLOAD & FILES ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });
    const { adminId, allocations } = req.body;
    const allocMap = JSON.parse(allocations || '{}');
    const targetUserIds = Object.keys(allocMap);

    try {
        const eventRes = await db.query(
            "INSERT INTO contact_events (description, created_by) VALUES ($1, $2) RETURNING id",
            [`Carga Masiva ${new Date().toLocaleDateString()}`, adminId || null]
        );
        const eventId = eventRes.rows[0].id;

        const results = await new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(req.file.path).pipe(csv()).on('data', d => rows.push(d)).on('end', () => resolve(rows)).on('error', reject);
        });

        const fileBuffer = fs.readFileSync(req.file.path);
        await db.query(
            "INSERT INTO archivos_csv (nombre_archivo, contenido_binario, contact_event_id) VALUES ($1, $2, $3)",
            [req.file.originalname, fileBuffer, eventId]
        );

        if (results.length > 0) {
            const userAssignments = {};
            targetUserIds.forEach(id => userAssignments[id] = 0);

            for (let i = 0; i < results.length; i += 100) {
                const batch = results.slice(i, i + 100);
                const values = []; const params = [];
                batch.forEach((row, idx) => {
                    const globalIdx = i + idx;
                    let assignedTo = null;
                    if (targetUserIds.length > 0) {
                        let chosenId = targetUserIds[0]; let maxGap = -Infinity;
                        targetUserIds.forEach(id => {
                            const target = (globalIdx + 1) * (allocMap[id] / 100);
                            const gap = target - userAssignments[id];
                            if (gap > maxGap) { maxGap = gap; chosenId = id; }
                        });
                        assignedTo = chosenId; userAssignments[chosenId]++;
                    }
                    const off = idx * 9;
                    values.push(`($${off + 1}, $${off + 2}, $${off + 3}, $${off + 4}, $${off + 5}, 'No Gestionado', $${off + 6}, $${off + 7}, $${off + 8}, $${off + 9})`);
                    params.push(
                        (row.nombre || 'Sin Nombre').substring(0, 255),
                        (row.email || 'noemail@example.com').substring(0, 255),
                        (row.renta || '0').toString().substring(0, 50),
                        (row.proyecto || 'General').substring(0, 100),
                        (row.telefono || '').toString().substring(0, 50),
                        eventId, assignedTo, null, row.observacion || ''
                    );
                });
                await db.query(`INSERT INTO leads (nombre, email, renta, proyecto, telefono, estado_gestion, contact_event_id, asignado_a, renta_real, observacion) VALUES ${values.join(',')}`, params);
            }
        }
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ success: true, eventId, total: results.length, message: `Imported ${results.length} leads successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- DASHBOARD & CAMPAIGNS ---
app.get('/api/dashboard/summary', async (req, res) => {
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
        console.error(err);
        res.status(500).json({ error: "Error al cargar resumen" });
    }
});

app.get('/api/contact-events', async (req, res) => {
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
        console.error(err);
        res.status(500).json({ error: "Error al obtener campañas" });
    }
});

app.get('/api/download-csv/:id', async (req, res) => {
    try {
        const result = await db.query("SELECT nombre_archivo, contenido_binario FROM archivos_csv WHERE contact_event_id = $1", [req.params.id]);
        if (result.rows.length > 0) {
            const file = result.rows[0];
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${file.nombre_archivo}"`);
            res.send(file.contenido_binario);
        } else {
            res.status(404).send("Archivo no encontrado");
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al descargar" });
    }
});

app.delete('/api/contact-events/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM contact_events WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al eliminar" });
    }
});

// --- ADMIN USERS ---
app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM usuarios_sistema ORDER BY nombre ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener usuarios admin" });
    }
});

app.post('/api/admin/users', async (req, res) => {
    const { nombre, email, password, role, jefe_id } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO usuarios_sistema (nombre, email, password_hash, role, jefe_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [nombre, email, password, role, jefe_id || null]
        );
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, role, activo, jefe_id } = req.body;
    try {
        await db.query(
            "UPDATE usuarios_sistema SET nombre = $1, email = $2, role = $3, activo = $4, jefe_id = $5 WHERE id = $6",
            [nombre, email, role, activo, jefe_id || null, id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

app.post('/api/admin/users/:id/reset-password', async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    try {
        await db.query("UPDATE usuarios_sistema SET password_hash = $1 WHERE id = $2", [newPassword, id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al resetear password" });
    }
});

app.delete('/api/leads/purge', async (req, res) => {
    try {
        await db.query('BEGIN');
        await db.query('TRUNCATE TABLE lead_status_history CASCADE');
        await db.query('TRUNCATE TABLE leads CASCADE');
        await db.query('TRUNCATE TABLE archivos_csv CASCADE');
        await db.query('TRUNCATE TABLE contact_events CASCADE');
        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: "Error al purgar" });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

app.get('*', (req, res) => {
    const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send('Frontend missing');
});
