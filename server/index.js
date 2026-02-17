const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

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

// Get all leads (with assigned user info)
app.get('/api/leads', async (req, res) => {
    const { userId, role } = req.query;
    try {
        let query = `
            SELECT l.*, u.nombre as nombre_ejecutivo 
            FROM leads l 
            LEFT JOIN usuarios_sistema u ON l.asignado_a = u.id 
        `;

        const params = [];
        if (role === 'ejecutivo' && userId) {
            query += ' WHERE l.asignado_a = $1';
            params.push(userId);
        }

        query += ' ORDER BY l.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
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

        if (results.length > 0) {
            // 3. Insert Leads with Weighted Distribution (Batched)
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
app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.nombre, 
                COUNT(l.id) as total_assigned,
                COUNT(CASE WHEN l.estado_gestion = 'No Gestionado' OR l.estado_gestion IS NULL OR l.estado_gestion = 'null' THEN 1 END)::int as no_gestionado,
                COUNT(CASE WHEN l.estado_gestion = 'Por Contactar' THEN 1 END)::int as por_contactar,
                COUNT(CASE WHEN l.estado_gestion = 'En Proceso' THEN 1 END)::int as en_proceso,
                COUNT(CASE WHEN l.estado_gestion = 'Visita' THEN 1 END)::int as visita,
                COUNT(CASE WHEN l.estado_gestion = 'Venta Cerrada' THEN 1 END)::int as venta_cerrada,
                COUNT(CASE WHEN l.estado_gestion = 'No Efectivo' THEN 1 END)::int as no_efectivo
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
