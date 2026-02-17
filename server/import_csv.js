const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');
const db = require('./db');

async function importLeads() {
    console.log("Starting CSV Import...");
    const csvFilePath = path.join(__dirname, '../data.csv');

    if (!fs.existsSync(csvFilePath)) {
        console.error("File not found:", csvFilePath);
        return;
    }

    const results = [];

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Parsed ${results.length} rows.`);

            let successCount = 0;
            let errorCount = 0;

            for (const row of results) {
                try {
                    // Mapping based on typical headers:
                    /*
                    ID_EVENTO_CONTACTO
                    RUT
                    NOMBRE
                    APELLIDO
                    EMAIL
                    TELEFONO_1
                    TELEFONO_2
                    DIRECCION
                    COMUNA
                    CIUDAD
                    REGION
                    RENTA_REAL
                    RANGO_RENTA
                    CANTIDAD_NEGOCIOS
                    NOM_PROYECTO
                    FECHA_REGISTRO
                    FECHA_ATENCION
                    ESTATUS
                    TIPO_GESTION
                    SUBESTADO_COLUMNA
                    OBSERVACION
                    RESPUESTA
                    */

                    await db.query(`
                        INSERT INTO leads (
                            id_evento_contacto,
                            rut,
                            nombre,
                            apellido,
                            email,
                            telefono1,
                            telefono2,
                            direccion,
                            comuna,
                            ciudad,
                            region,
                            renta_real,
                            rango_renta,
                            cantidad_negocios,
                            nom_proyecto,
                            fecha_registro,
                            fecha_atencion,
                            estatus,
                            estado_gestion,
                            subestado_columna,
                            observacion,
                            respuesta,
                            created_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW()
                        )
                    `, [
                        row.ID_EVENTO_CONTACTO || 0,
                        row.RUT || null,
                        row.NOMBRE || '',
                        row.APELLIDO || '',
                        row.EMAIL || null,
                        row.TELEFONO_1 || null,
                        row.TELEFONO_2 || null,
                        row.DIRECCION || null,
                        row.COMUNA || null,
                        row.CIUDAD || null,
                        row.REGION || null,
                        row.RENTA_REAL || null,
                        row.RANGO_RENTA || null,
                        parseInt(row.CANTIDAD_NEGOCIOS) || 0,
                        row.NOM_PROYECTO || null,
                        parseDate(row.FECHA_REGISTRO),
                        parseDate(row.FECHA_ATENCION),
                        row.ESTATUS || null,
                        determineStatus(row),
                        row.SUBESTADO_COLUMNA || null,
                        row.OBSERVACION || null,
                        row.RESPUESTA || null
                    ]);
                    successCount++;
                } catch (err) {
                    // Duplicate key errors are expected if run multiple times, log sparingly
                    if (!err.message.includes('duplicate key')) {
                        console.error(`Error inserting row ${row.ID_EVENTO_CONTACTO}:`, err.message);
                    }
                    errorCount++;
                }
            }
            console.log(`Import finished. Success: ${successCount}, Errors: ${errorCount}`);
        });
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    // Handle DD/MM/YYYY or YYYY-MM-DD
    // Simple verification
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

function determineStatus(row) {
    // Logic to update status based on CSV
    return row.TIPO_GESTION || row.SUBESTADO_COLUMNA || 'Pendiente';
}

importLeads();
