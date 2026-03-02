// Mock data for fallback when DB is down
const bcrypt = require('bcryptjs');

const passwordHashAdmin = bcrypt.hashSync('Urbani2024!', 10);
const passwordHashExec = bcrypt.hashSync('Urbani2026!', 10);

const fs = require('fs');
const path = require('path');
const LOG_FILE = path.join(__dirname, 'mock_debug.log');

function logDebug(message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, formattedMessage);
    console.log(message);
}

const mockUsers = [
    {
        id: 'user-admin-uuid',
        nombre: 'Felipe Admin',
        email: 'felipe@urbani.cl',
        password_hash: passwordHashAdmin,
        role: 'admin',
        activo: true
    },
    {
        id: 'user-e1-uuid',
        nombre: 'Ejecutivo Alpha',
        email: 'e1@urbani.cl',
        password_hash: passwordHashExec,
        role: 'ejecutivo',
        activo: true
    },
    {
        id: 'user-e2-uuid',
        nombre: 'Ejecutivo Beta',
        email: 'e2@urbani.cl',
        password_hash: passwordHashExec,
        role: 'ejecutivo',
        activo: true
    }
];

let mockLeads = [
    { id: 'lead-1', nombre: 'Juan Pérez', email: 'juan@example.com', telefono: '56911111111', proyecto: 'Proyecto Urbani A', estado_gestion: 'No Gestionado', asignado_a: 'user-e1-uuid', clasificacion: 'Caliente', created_at: new Date().toISOString(), renta: '1.500.000', observacion: 'Interesado en dpto 2D', contact_event_id: 'campaign-1' },
    { id: 'lead-2', nombre: 'María García', email: 'maria@example.com', telefono: '56922222222', proyecto: 'Proyecto Urbani B', estado_gestion: 'No Gestionado', asignado_a: 'user-e1-uuid', clasificacion: 'Tibio', created_at: new Date().toISOString(), renta: '2.000.000', contact_event_id: 'campaign-1' },
    { id: 'lead-3', nombre: 'Carlos Soto', email: 'csoto@test.cl', telefono: '56933333333', proyecto: 'Proyecto Urbani A', estado_gestion: 'No Gestionado', asignado_a: 'user-e2-uuid', clasificacion: 'Frio', created_at: new Date().toISOString(), contact_event_id: 'campaign-1' },
    { id: 'lead-4', nombre: 'Ana Morales', email: 'ana@test.cl', telefono: '56944444444', proyecto: 'Proyecto Urbani B', estado_gestion: 'No Gestionado', asignado_a: 'user-e2-uuid', clasificacion: 'Sin Clasificacion', created_at: new Date().toISOString(), contact_event_id: 'campaign-1' },
    { id: 'lead-5', nombre: 'Roberto Luz', email: 'rluz@test.cl', telefono: '56955555555', proyecto: 'Proyecto Urbani A', estado_gestion: 'No Gestionado', asignado_a: 'user-e1-uuid', clasificacion: 'Caliente', created_at: new Date().toISOString(), contact_event_id: 'campaign-1' },
    { id: 'lead-6', nombre: 'Elena Mora', email: 'emora@test.cl', telefono: '56966666666', proyecto: 'Proyecto Urbani B', estado_gestion: 'No Gestionado', asignado_a: 'user-e2-uuid', clasificacion: 'Caliente', created_at: new Date().toISOString(), contact_event_id: 'campaign-1' },
    { id: 'lead-7', nombre: 'Diego Torres', email: 'dtorres@test.cl', telefono: '56977777777', proyecto: 'Proyecto Urbani A', estado_gestion: 'No Gestionado', asignado_a: 'user-e1-uuid', clasificacion: 'Tibio', created_at: new Date().toISOString(), contact_event_id: 'campaign-1' },
    { id: 'lead-8', nombre: 'Sofia Castro', email: 'sc@test.cl', telefono: '56988888888', proyecto: 'Proyecto Urbani B', estado_gestion: 'No Gestionado', asignado_a: 'user-e2-uuid', clasificacion: 'Frio', created_at: new Date().toISOString(), contact_event_id: 'campaign-1' },
    { id: 'lead-9', nombre: 'Luis Jara', email: 'ljara@test.cl', telefono: '56999999999', proyecto: 'Proyecto Urbani A', estado_gestion: 'No Gestionado', asignado_a: 'user-e1-uuid', clasificacion: 'Caliente', created_at: new Date().toISOString(), contact_event_id: 'campaign-1' },
    { id: 'lead-10', nombre: 'Paula Rios', email: 'prios@test.cl', telefono: '56900000000', proyecto: 'Proyecto Urbani B', estado_gestion: 'No Gestionado', asignado_a: 'user-e2-uuid', clasificacion: 'Caliente', created_at: new Date().toISOString(), contact_event_id: 'campaign-1' }
];

let mockContactEvents = [
    { id: 'campaign-1', description: 'Carga Inicial (Demo)', created_at: new Date(Date.now() - 86400000).toISOString() }
];

let mockHistory = [];

function mockQuery(text, params) {
    try {
        const query = text.toLowerCase();
        logDebug(`MOCK-QUERY: "${text}" | params: ${JSON.stringify(params)}`);

        // Purge queries (Check this FIRST to avoid collision with SELECT)
        if (query.includes('delete from')) {
            logDebug(`MOCK-DB: Purge detected: "${query}"`);
            const normalizedQuery = query.replace(/;/g, ' ');
            const tableName = normalizedQuery.split('from')[1]?.trim().split(' ')[0];

            logDebug(`MOCK-DB: Detected table name: "${tableName}"`);

            if (tableName === 'leads') {
                mockLeads.length = 0;
                logDebug(`MOCK-DB: SUCCESS: mockLeads array cleared. Current size: ${mockLeads.length}`);
            } else if (tableName === 'contact_events') {
                mockContactEvents.length = 0;
                logDebug(`MOCK-DB: SUCCESS: mockContactEvents array cleared. Current size: ${mockContactEvents.length}`);
            } else {
                logDebug(`MOCK-DB: Table "${tableName}" not handled in mock purge logic.`);
            }

            return { rows: [], rowCount: 1 };
        }

        // Transaction commands
        if (['begin', 'commit', 'rollback'].includes(query)) {
            console.log(`[MOCK-DB] Transaction: ${query.toUpperCase()}`);
            return { rows: [] };
        }

        // Login query (email check)
        if (query.includes('from usuarios_sistema') && query.includes('where email = $1')) {
            const email = params[0];
            const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            return { rows: user ? [user] : [] };
        }

        // Contact Events (INSERT)
        if (query.includes('insert into contact_events')) {
            console.log('[MOCK-DB] Event created (simulated)');
            return { rows: [{ id: `event-${Date.now()}` }] };
        }

        // Admin Users List query
        if (query.includes('from usuarios_sistema') && query.includes('select') && !query.includes('where email = $1') && !query.includes('left join leads')) {
            console.log('[MOCK-DB] Returning admin users list...');
            return { rows: mockUsers };
        }

        // Create User (INSERT)
        if (query.includes('insert into usuarios_sistema')) {
            const [nombre, email, password_hash, role, jefe_id] = params;
            const newUser = {
                id: `user-new-${Date.now()}`,
                nombre,
                email,
                password_hash,
                role,
                jefe_id,
                activo: true,
                created_at: new Date().toISOString()
            };
            mockUsers.push(newUser);
            return { rows: [newUser] };
        }

        // Create Lead (INSERT/UPDATE)
        if (query.includes('insert into leads')) {
            console.log('[MOCK-DB] Inserting leads (simulated persistence)');
            const numLeads = (params?.length || 0) / 12;
            for (let i = 0; i < numLeads; i++) {
                const offset = i * 12;
                // Params order from index.js (with 'No Gestionado' hardcoded in query):
                // 1: nombre, 2: email, 3: renta, 4: proyecto, 5: telefono, 6: eventId, 7: assignedTo, 8: renta_real, 9: observacion, 10: rut, 11: es_ia, 12: clasificacion
                const newLead = {
                    id: `lead-new-${Date.now()}-${i}`,
                    nombre: params[offset],
                    email: params[offset + 1],
                    renta: params[offset + 2],
                    proyecto: params[offset + 3],
                    telefono: params[offset + 4],
                    estado_gestion: 'No Gestionado',
                    contact_event_id: params[offset + 5],
                    asignado_a: params[offset + 6],
                    renta_real: params[offset + 7],
                    observacion: params[offset + 8],
                    rut: params[offset + 9],
                    es_ia: params[offset + 10],
                    clasificacion: params[offset + 11],
                    created_at: new Date().toISOString()
                };
                mockLeads.push(newLead);
            }
            return { rows: [], rowCount: numLeads };
        }

        // Generic INSERT handler for RETURNING id
        if (query.includes('insert into') && query.includes('returning id')) {
            return { rows: [{ id: `gen-id-${Date.now()}` }] };
        }

        // Update User (UPDATE)
        if (query.includes('update usuarios_sistema')) {
            console.log('[MOCK-DB] User updated successfully (simulated)');
            return { rows: [], rowCount: 1 };
        }

        // Update Lead (UPDATE)
        if (query.includes('update leads')) {
            const [status, notes, scheduledDate, renta, id] = params;
            const leadIndex = mockLeads.findIndex(l => l.id === id);
            if (leadIndex !== -1) {
                mockLeads[leadIndex] = {
                    ...mockLeads[leadIndex],
                    estado_gestion: status,
                    notas_ejecutivo: notes,
                    fecha_proximo_contacto: scheduledDate,
                    renta: renta !== null ? renta : mockLeads[leadIndex].renta
                };
                console.log(`[MOCK-DB] Lead ${id} updated to ${status}`);
            }
            return { rows: [], rowCount: 1 };
        }

        // Lead History (INSERT)
        if (query.includes('insert into lead_status_history')) {
            const [leadId, oldStatus, newStatus, userId, comment] = params;
            const newHistory = {
                id: `hist-${Date.now()}`,
                lead_id: leadId,
                estado_anterior: oldStatus,
                estado_nuevo: newStatus,
                usuario_id: userId,
                comentario: comment,
                created_at: new Date().toISOString()
            };
            mockHistory.push(newHistory);
            console.log(`[MOCK-DB] History added for lead ${leadId}`);
            return { rows: [newHistory] };
        }

        // Lead History (SELECT)
        if (query.includes('from lead_status_history')) {
            const leadId = params[0];
            const result = mockHistory
                .filter(h => h.lead_id === leadId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(h => ({
                    ...h,
                    changed_by_name: mockUsers.find(u => u.id === h.usuario_id)?.nombre || 'Sistema'
                }));
            console.log(`[MOCK-DB] Returning ${result.length} history entries for ${leadId}`);
            return { rows: result };
        }

        // Dashboard Summary
        if (query.includes('from usuarios_sistema') && query.includes('left join leads')) {
            const summary = mockUsers.map(u => ({
                id: u.id,
                nombre: u.nombre,
                total_assigned: mockLeads.filter(l => l.asignado_a === u.id).length,
                no_gestionado: mockLeads.filter(l => l.asignado_a === u.id && l.estado_gestion === 'No Gestionado').length,
                por_contactar: mockLeads.filter(l => l.asignado_a === u.id && l.estado_gestion === 'Por Contactar').length,
                en_proceso: 0,
                visita: 0,
                venta_cerrada: 0
            }));
            return { rows: summary };
        }

        // Contact Events List
        if (query.includes('from contact_events') && query.includes('select')) {
            console.log('[MOCK-DB] Returning contact events list...');
            return {
                rows: mockContactEvents.map(c => ({
                    ...c,
                    total_leads: mockLeads.filter(l => l.contact_event_id === c.id).length,
                    processed_leads: mockLeads.filter(l => l.contact_event_id === c.id && l.estado_gestion !== 'No Gestionado').length,
                    sales: mockLeads.filter(l => l.contact_event_id === c.id && l.estado_gestion === 'Visita' || l.estado_gestion === 'Venta Cerrada').length,
                    has_file: true
                }))
            };
        }

        // Contact Events (INSERT)
        if (query.includes('insert into contact_events')) {
            const description = params[0] || 'Carga Sin Nombre';
            const newEvent = {
                id: `campaign-${Date.now()}`,
                description,
                created_at: new Date().toISOString()
            };
            mockContactEvents.push(newEvent);
            console.log('[MOCK-DB] Event created:', newEvent.id);
            return { rows: [newEvent] };
        }

        // Leads query and Count
        if (query.includes('from leads')) {
            if (query.includes('count(*)')) {
                // Determine if there's a real userId filter or just 1=1
                let userId = null;
                if (!query.includes('1=1') && params?.[0]) {
                    userId = params[0];
                }
                const filteredTotal = mockLeads.filter(l => !userId || l.asignado_a === userId).length;
                return { rows: [{ total: filteredTotal.toString() }] };
            }

            // Simple filter for integrity checks: "WHERE asignado_a = $1"
            if (query.includes('where asignado_a =')) {
                const userId = params[0];
                const filtered = mockLeads.filter(l => l.asignado_a === userId);
                return { rows: filtered, total: filtered.length };
            }

            // For SELECT *, params might be [limit, offset] or [userId, limit, offset]
            // We'll return everything for now to simplify mock verification
            logDebug('MOCK-DB: Returning mockLeads...');
            return { rows: mockLeads, total: mockLeads.length };
        }

        // Delete User (DELETE)
        if (query.includes('delete from usuarios_sistema')) {
            const id = params[0];
            const initialCount = mockUsers.length;
            const index = mockUsers.findIndex(u => u.id === id);
            if (index !== -1) {
                mockUsers.splice(index, 1);
                console.log(`[MOCK-DB] User ${id} deleted (mock)`);
            }
            return { rows: [], rowCount: initialCount - mockUsers.length };
        }

        // Purge (DELETE)
        if (query.includes('delete from leads') || query.includes('truncate leads')) {
            mockLeads = [];
            console.log('[MOCK-DB] All leads purged (simulated)');
            return { rows: [], rowCount: 1 };
        }

        if (query.includes('delete from contact_events') || query.includes('truncate contact_events')) {
            mockContactEvents = [];
            console.log('[MOCK-DB] All events purged (simulated)');
            return { rows: [], rowCount: 1 };
        }


        logDebug(`MOCK-DB: No mock handler for query: "${text.substring(0, 100)}..."`);
        return { rows: [], total: 0 };
    } catch (err) {
        logDebug(`MOCK-DB ERROR: ${err.message || err}`);
        throw err;
    }
}

module.exports = { mockQuery };
