const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('------------------------------------------------');
    console.log(`[LOGIN ATTEMPT] Email: ${email}, Password: ${password}`);

    try {
        const query = 'SELECT id, nombre, email, role, password_hash FROM usuarios_sistema WHERE email = $1';
        const result = await db.query(query, [email]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const hashCheck = 'hashed_' + password;
            const match = (user.password_hash === password) || (user.password_hash === hashCheck);

            if (match) {
                console.log('[LOGIN SUCCESS]');
                res.json({ success: true, user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role } });
            } else {
                console.log('[LOGIN FAILED] Password mismatch');
                res.status(401).json({ success: false, error: 'Credenciales inválidas' });
            }
        } else {
            console.log('[LOGIN FAILED] User not found');
            res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error('[SERVER ERROR]', err);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// --- READ LEADS (Dashboard) with Hierarchy and Filters ---
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

        // Hierarchy Filtering
        if (role === 'ejecutivo') {
            params.push(userId);
            query += ` AND l.asignado_a = $${params.length}`;
        } else if (role === 'jefe') {
            params.push(userId);
            query += ` AND (l.asignado_a = $${params.length} OR l.asignado_a IN (SELECT id FROM usuarios_sistema WHERE jefe_id = $${params.length}))`;
        }
        // Admin sees all by default

        // Dynamic Filters
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
        if (jefe_id && role === 'admin') {
            params.push(jefe_id);
            query += ` AND l.asignado_a IN (SELECT id FROM usuarios_sistema WHERE jefe_id = $${params.length})`;
        }

        query += ` ORDER BY l.fecha_registro DESC LIMIT 200`;
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal error" });
    }
});

// Get all system users (for assignment)
app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query('SELECT id, nombre, email, role FROM usuarios_sistema ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Assign lead to user
app.post('/api/leads/assign', async (req, res) => {
    const { leadId, userId, adminId } = req.body;
    console.log(`[ASSIGN LEAD] Request: leadId=${leadId}, userId=${userId}, adminId=${adminId}`);

    if (!leadId || !userId) {
        return res.status(400).json({ error: "Missing leadId or userId" });
    }

    try {
        // 1. Get old executive for history
        const leadRes = await db.query(
            "SELECT l.asignado_a, u.nombre FROM leads l LEFT JOIN usuarios_sistema u ON l.asignado_a = u.id WHERE l.id = $1",
            [leadId]
        );
        const oldId = leadRes.rows[0]?.asignado_a;
        const oldName = leadRes.rows[0]?.nombre || 'Sin Asignar';

        // 2. Update Lead
        const result = await db.query(
            'UPDATE leads SET asignado_a = $1 WHERE id = $2 RETURNING *',
            [userId, leadId]
        );

        // 3. Get new executive name
        const newRes = await db.query("SELECT nombre FROM usuarios_sistema WHERE id = $1", [userId]);
        const newName = newRes.rows[0]?.nombre || 'Desconocido';

        // 4. Insert History
        await db.query(
            `INSERT INTO lead_status_history (lead_id, old_status, new_status, changed_by, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [leadId, 'Reasignación', 'Reasignación', adminId || null, `Lead reasignado de ${oldName} a ${newName}`]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error("[ASSIGN LEAD] Error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a lead (optional, for testing)
app.post('/api/leads', async (req, res) => {
    const { nombre, email, renta, proyecto } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO leads (nombre, email, renta, proyecto, estado_gestion) VALUES ($1, $2, $3, $4, 'No Gestionado') RETURNING *",
            [nombre, email, renta, proyecto]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Lead Status (with History)
app.patch('/api/leads/:id', async (req, res) => {
    const { id } = req.params;
    const { status, userId, notes, scheduledDate } = req.body; // userId is the actor

    try {
        // 1. Get current status for history
        const currentRes = await db.query("SELECT estado_gestion FROM leads WHERE id = $1", [id]);
        if (currentRes.rows.length === 0) return res.status(404).json({ error: "Lead not found" });
        const oldStatus = currentRes.rows[0].estado_gestion;

        // 2. Update Lead
        await db.query(
            "UPDATE leads SET estado_gestion = $1, ultima_gestion = NOW(), fecha_proximo_contacto = $2 WHERE id = $3",
            [status, scheduledDate || null, id]
        );

        // 3. Insert History
        if (oldStatus !== status || notes || scheduledDate) {
            await db.query(
                `INSERT INTO lead_status_history (lead_id, old_status, new_status, changed_by, notes)
                 VALUES ($1, $2, $3, $4, $5)`,
                [id, oldStatus, status, userId || null, notes || (scheduledDate ? `Agendado para: ${scheduledDate}` : '')]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal error" });
    }
});

// Get Lead History
app.get('/api/leads/:id/history', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT h.*, u.nombre as changed_by_name 
            FROM lead_status_history h
            LEFT JOIN usuarios_sistema u ON h.changed_by = u.id
            WHERE h.lead_id = $1
            ORDER BY h.changed_at DESC
        `;
        const result = await db.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal error" });
    }
});

const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

// Mass Upload Endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    console.log("[UPLOAD] Request received");

    if (!req.file) {
        return res.status(400).json({ error: "No CSV file uploaded" });
    }

    let allocations = {};
    try {
        allocations = JSON.parse(req.body.allocations || '{}');
    } catch (e) {
        console.error("[UPLOAD] JSON Parse Error for allocations:", e);
        return res.status(400).json({ error: "Invalid allocations format" });
    }
    const targetUserIds = Object.keys(allocations);

    if (targetUserIds.length === 0) {
        console.log("[UPLOAD] No allocations provided. Leads will be unassigned.");
    }

    const adminId = req.body.adminId;

    const results = [];
    let assignedCount = 0;

    try {
        // 1. Create Contact Event
        const eventRes = await db.query(
            "INSERT INTO contact_events (description, created_by) VALUES ($1, $2) RETURNING id",
            [`Carga Masiva ${new Date().toLocaleDateString()}`, adminId || null]
        );
        const eventId = eventRes.rows[0].id;
        console.log(`[UPLOAD] Created Event ID: ${eventId}`);

        // 2. Parse CSV (Wrapped in Promise)
        const parseCsv = () => new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (err) => reject(err));
        });

        const results = await parseCsv();
        console.log(`[UPLOAD] Parsed ${results.length} rows`);

        // 3. Save binary file to archival table
        const fileBuffer = fs.readFileSync(req.file.path);
        await db.query(
            "INSERT INTO archivos_csv (nombre_archivo, contenido_binario, contact_event_id) VALUES ($1, $2, $3)",
            [req.file.originalname, fileBuffer, eventId]
        );

        if (results.length > 0) {
            // 4. Insert Leads with Weighted Distribution (Batched)
            const userAssignments = {};
            targetUserIds.forEach(id => userAssignments[id] = 0);

            const batchSize = 100; // Smaller batches for reliability
            for (let i = 0; i < results.length; i += batchSize) {
                const batch = results.slice(i, i + batchSize);
                const values = [];
                const params = [];

                batch.forEach((row, index) => {
                    const globalIndex = i + index;
                    // Mapeo prioritiza nombres normalizados del script clean_data.py
                    const nombre = row.nombre || row.NOMBRE || row.Nombre || 'Sin Nombre';
                    const email = row.email || row.EMAIL || row.Email || 'noemail@example.com';
                    const renta = row.renta || row.RANGO_RENTA || row.Renta || '0';
                    const proyecto = row.proyecto || row.NOM_PROYECTO || row.Proyecto || 'General';
                    const telefono = row.telefono || row.TELEFONO2 || row.TELEFONO1 || row.Telefono || '';
                    const observacion = row.observacion || row.OBSERVACION || row.Observacion || '';

                    let assignedTo = null;
                    if (targetUserIds.length > 0) {
                        let chosenId = targetUserIds[0];
                        let maxGap = -Infinity;

                        targetUserIds.forEach(id => {
                            const target = (globalIndex + 1) * (allocations[id] / 100);
                            const gap = target - userAssignments[id];
                            if (gap > maxGap) {
                                maxGap = gap;
                                chosenId = id;
                            }
                        });

                        assignedTo = chosenId;
                        userAssignments[chosenId]++;
                    }

                    const offset = index * 9;
                    values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, 'No Gestionado', $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`);

                    params.push(
                        (nombre || 'Sin Nombre').substring(0, 255),
                        (email || 'noemail@example.com').substring(0, 255),
                        (renta || '0').toString().substring(0, 50),
                        (proyecto || 'General').substring(0, 100),
                        (telefono || '').toString().substring(0, 50),
                        eventId,
                        assignedTo,
                        null, // Original renta_real empty
                        observacion
                    );
                });

                const query = `
                    INSERT INTO leads (
                        nombre, email, renta, proyecto, telefono, 
                        estado_gestion, contact_event_id, asignado_a, renta_real, observacion
                    ) VALUES ${values.join(', ')}
                `;
                await db.query(query, params);
                console.log(`[UPLOAD] Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(results.length / batchSize)}`);
            }
        }

        // Cleanup temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            message: `Imported ${results.length} leads successfully`,
            eventId
        });

    } catch (err) {
        console.error("[UPLOAD] Error:", err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error: ' + err.message });
        }
    }
});

// Dashboard Summary Endpoint
// Get Contact Events (Campaigns) with Metrics
app.get('/api/contact-events', async (req, res) => {
    try {
        const query = `
            SELECT 
                ce.id,
                ce.description,
                ce.created_at,
                COUNT(l.id) as total_leads,
                COUNT(CASE WHEN l.estado_gestion != 'No Gestionado' AND l.estado_gestion IS NOT NULL THEN 1 END) as processed_leads,
                COUNT(CASE WHEN l.estado_gestion = 'Venta Cerrada' THEN 1 END) as sales,
                EXISTS(SELECT 1 FROM archivos_csv ac WHERE ac.contact_event_id = ce.id) as has_file
            FROM contact_events ce
            LEFT JOIN leads l ON ce.id = l.contact_event_id
            GROUP BY ce.id
            ORDER BY ce.created_at DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal error" });
    }
});

// Download CSV from archival table
app.get('/api/download-csv/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
        const result = await db.query(
            "SELECT nombre_archivo, contenido_binario FROM archivos_csv WHERE contact_event_id = $1",
            [eventId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "File not found" });
        }

        const file = result.rows[0];
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${file.nombre_archivo}"`);
        res.send(file.contenido_binario);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal error" });
    }
});

// Deletion of Campaign and all associated data
app.delete('/api/contact-events/:eventId', async (req, res) => {
    const { eventId } = req.params;
    console.log(`[DELETE CAMPAIGN] ID: ${eventId}`);

    try {
        await db.query('BEGIN');

        // 1. Delete associated leads
        await db.query('DELETE FROM leads WHERE contact_event_id = $1', [eventId]);

        // 2. Delete archived CSV file
        await db.query('DELETE FROM archivos_csv WHERE contact_event_id = $1', [eventId]);

        // 3. Delete the campaign event itself
        await db.query('DELETE FROM contact_events WHERE id = $1', [eventId]);

        await db.query('COMMIT');

        console.log(`[DELETE SUCCESS] Campaign ${eventId} and all related data removed.`);
        res.json({ success: true, message: "Campaña y datos asociados eliminados correctamente." });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error("[DELETE ERROR]", err);
        res.status(500).json({ error: "Error al eliminar la campaña: " + err.message });
    }
});

// Purge all leads and associated data (Dev only)
app.delete('/api/leads/purge', async (req, res) => {
    console.log("------------------------------------------------");
    console.log("[PURGE] Global data removal initiated");
    try {
        await db.query('BEGIN');
        console.log("[PURGE] Truncating tables...");
        await db.query('TRUNCATE TABLE lead_status_history CASCADE');
        await db.query('TRUNCATE TABLE leads CASCADE');
        await db.query('TRUNCATE TABLE archivos_csv CASCADE');
        await db.query('TRUNCATE TABLE contact_events CASCADE');
        await db.query('COMMIT');
        console.log("[PURGE SUCCESS] All data cleared.");
        res.json({ success: true, message: "Todos los datos han sido borrados correctamente." });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error("[PURGE ERROR] Full detail:", err);
        res.status(500).json({ error: "Error al purgar los datos: " + err.message });
    }
});

app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.nombre, 
                COUNT(l.id) as total_assigned,
                COUNT(CASE WHEN l.id IS NOT NULL AND (l.estado_gestion = 'No Gestionado' OR l.estado_gestion IS NULL OR l.estado_gestion = 'null') THEN 1 END)::int as no_gestionado,
                COUNT(CASE WHEN l.id IS NOT NULL AND l.estado_gestion = 'Por Contactar' THEN 1 END)::int as por_contactar,
                COUNT(CASE WHEN l.id IS NOT NULL AND l.estado_gestion = 'En Proceso' THEN 1 END)::int as en_proceso,
                COUNT(CASE WHEN l.id IS NOT NULL AND l.estado_gestion = 'Visita' THEN 1 END)::int as visita,
                COUNT(CASE WHEN l.id IS NOT NULL AND l.estado_gestion = 'Venta Cerrada' THEN 1 END)::int as venta_cerrada,
                COUNT(CASE WHEN l.id IS NOT NULL AND l.estado_gestion = 'No Efectivo' THEN 1 END)::int as no_efectivo
            FROM usuarios_sistema u
            LEFT JOIN leads l ON u.id = l.asignado_a
            WHERE u.role != 'admin'
            GROUP BY u.id, u.nombre
            ORDER BY total_assigned DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal error" });
    }
});

// --- ADMIN USER MANAGEMENT (Hierarchical) ---

// List all users for administration
app.get('/api/admin/users', async (req, res) => {
    const { userId, role } = req.query;
    try {
        let query = 'SELECT id, nombre, email, role, activo, created_at, jefe_id, company_id FROM usuarios_sistema';
        const params = [];

        if (role === 'jefe') {
            params.push(userId);
            query += ' WHERE jefe_id = $1 OR id = $1';
        } else if (role === 'ejecutivo') {
            params.push(userId);
            query += ' WHERE id = $1';
        }

        query += ' ORDER BY created_at DESC';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal error" });
    }
});

// Create new user
app.post('/api/admin/users', async (req, res) => {
    const { nombre, email, password, role, jefe_id, company_id } = req.body;
    const finalJefeId = jefe_id === "" ? null : jefe_id;
    try {
        const query = `
            INSERT INTO usuarios_sistema (nombre, email, password_hash, role, activo, jefe_id, company_id)
            VALUES ($1, $2, $3, $4, true, $5, $6)
            RETURNING id, nombre, email, role, activo, jefe_id, company_id
        `;
        const result = await db.query(query, [nombre, email, password, role || 'ejecutivo', finalJefeId, company_id || 'Urbani']);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear usuario: " + err.message });
    }
});

// Update user details
app.patch('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, role, activo, jefe_id } = req.body;
    const finalJefeId = jefe_id === "" ? null : jefe_id;
    try {
        const query = `
            UPDATE usuarios_sistema 
            SET nombre = COALESCE($1, nombre),
                email = COALESCE($2, email),
                role = COALESCE($3, role),
                activo = COALESCE($4, activo),
                jefe_id = $5
            WHERE id = $6
            RETURNING id, nombre, email, role, activo, jefe_id
        `;
        const result = await db.query(query, [nombre, email, role, activo, finalJefeId, id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al actualizar usuario: " + err.message });
    }
});

// Reset user password
app.post('/api/admin/users/:id/reset-password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    try {
        await db.query('UPDATE usuarios_sistema SET password_hash = $1 WHERE id = $2', [password, id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al resetear password" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// SPA Fallback: redirigir todas las demás rutas al index.html del frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});
