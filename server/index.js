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

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('------------------------------------------------');
    console.log(`[LOGIN ATTEMPT] Email: ${email}, Password: ${password}`);

    try {
        const result = await db.query('SELECT * FROM usuarios_sistema WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && user.password_hash === password) {
            console.log(`[LOGIN SUCCESS] User: ${user.nombre}`);
            res.json({ success: true, user: { id: user.id, email: user.email, nombre: user.nombre, role: user.role } });
        } else {
            console.log(`[LOGIN FAILED] Invalid credentials`);
            res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error('[LOGIN ERROR]', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

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

    const adminId = req.body.adminId;

    try {
        // 1. Create Contact Event
        const eventRes = await db.query(
            "INSERT INTO contact_events (description, created_by) VALUES ($1, $2) RETURNING id",
            [`Carga Masiva ${new Date().toLocaleDateString()}`, adminId || null]
        );
        const eventId = eventRes.rows[0].id;

        // 2. Parse CSV
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

        // 3. Save binary file
        const fileBuffer = fs.readFileSync(req.file.path);
        await db.query(
            "INSERT INTO archivos_csv (nombre_archivo, contenido_binario, contact_event_id) VALUES ($1, $2, $3)",
            [req.file.originalname, fileBuffer, eventId]
        );

        if (results.length > 0) {
            const userAssignments = {};
            targetUserIds.forEach(id => userAssignments[id] = 0);

            const batchSize = 100;
            for (let i = 0; i < results.length; i += batchSize) {
                const batch = results.slice(i, i + batchSize);
                const values = [];
                const params = [];

                batch.forEach((row, index) => {
                    const globalIndex = i + index;
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
                        nombre.substring(0, 255),
                        email.substring(0, 255),
                        renta.toString().substring(0, 50),
                        proyecto.substring(0, 100),
                        telefono.toString().substring(0, 50),
                        eventId,
                        assignedTo,
                        null,
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
            }
        }

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ success: true, eventId, total: results.length });
    } catch (err) {
        console.error("[UPLOAD ERROR]", err);
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Summary Endpoint
app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM leads) as total_leads,
                (SELECT COUNT(*) FROM leads WHERE estado_gestion != 'No Gestionado') as gestionados,
                (SELECT COUNT(*) FROM leads WHERE estado_gestion = 'Vendido') as ventas,
                (SELECT COALESCE(SUM(CAST(renta AS DECIMAL)), 0) FROM leads) as valor_cartera
        `);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al cargar resumen" });
    }
});

// Purge all leads (Dev only)
app.delete('/api/leads/purge', async (req, res) => {
    try {
        await db.query('BEGIN');
        await db.query('TRUNCATE TABLE lead_status_history CASCADE');
        await db.query('TRUNCATE TABLE leads CASCADE');
        await db.query('TRUNCATE TABLE archivos_csv CASCADE');
        await db.query('TRUNCATE TABLE contact_events CASCADE');
        await db.query('COMMIT');
        res.json({ success: true, message: "Todos los datos han sido borrados." });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: "Error al purgar los datos" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// SPA Fallback: redirigir todas las demás rutas al index.html del frontend
app.get('*', (req, res) => {
    try {
        const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send('Frontend not built or index.html missing');
        }
    } catch (e) {
        console.error('Error in SPA fallback:', e);
        res.status(500).send('Internal Server Error');
    }
});
