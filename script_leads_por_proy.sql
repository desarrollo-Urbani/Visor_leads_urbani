/* ============================================================
   CONSULTA ESTABLE - VISOR LEADS (dedup por RUT)
   CAMBIA AQUI:
     1) FECHAS: '2025-06-01' y '2026-01-31'
     2) PROYECTO: comenta/descomenta la línea del filtro
     3) LIMITE: LIMIT 200
   ============================================================ */

SELECT
  CONCAT(c.NOMBRE, ' ', c.APELLIDO) AS NOMBRE_COMPLETO,
  c.RUT,
  COALESCE(NULLIF(c.TELEFONO2,''), NULLIF(c.TELEFONO1,'')) AS TELEFONO,
  c.EMAIL,
  COALESCE(pr.NOM_PROYECTO,'') AS PROYECTO,
  COALESCE(c.RANGO_RENTA,'') AS RANGO_RENTA,
  COALESCE(c.ANTIGUEDAD,'') AS ANTIGUEDAD_LABORAL,
  COALESCE(NULLIF(TRIM(ec.OBSERVACION),''), NULLIF(TRIM(ec.DESCRIPCION),''), '') AS ULTIMA_OBSERVACION,
  ec.FECHA_REGISTRO AS FECHA_ULTIMA_OB
FROM CLIENTES_VIEW c

/* Tomamos el último contacto por cliente (por fecha máxima) */
JOIN (
  SELECT
    ev.ID_CLIENTE,
    MAX(ec1.FECHA_REGISTRO) AS MAX_FECHA
  FROM EVENTOS_VIEW ev
  JOIN EVENTOS_CONTACTOS_VIEW ec1
    ON ec1.ID_EVENTO = ev.ID_EVENTO
  WHERE
    /* (1) FECHAS EDITABLES */
    ec1.FECHA_REGISTRO >= '2025-06-01'
    AND ec1.FECHA_REGISTRO <= '2026-01-31'
  GROUP BY ev.ID_CLIENTE
) mx
  ON mx.ID_CLIENTE = c.ID_CLIENTE

/* Traemos la fila del último contacto (misma fecha máxima) */
JOIN EVENTOS_VIEW ev
  ON ev.ID_CLIENTE = c.ID_CLIENTE
JOIN EVENTOS_CONTACTOS_VIEW ec
  ON ec.ID_EVENTO = ev.ID_EVENTO
 AND ec.FECHA_REGISTRO = mx.MAX_FECHA

/* Proyecto del último contacto */
LEFT JOIN PROYECTOS_VIEW pr
  ON pr.ID_PROYECTO = ec.ID_PROYECTO

WHERE
  /* Quitar internos */
  (c.EMAIL IS NULL OR (LOWER(c.EMAIL) NOT LIKE '%@urbani%' AND LOWER(c.EMAIL) NOT LIKE '%@moby%'))
  /* Cantidad negocios < 1 */
  AND COALESCE(c.CANTIDAD_NEGOCIOS, 0) < 1
  /* Dedup por RUT (si no hay RUT, no deduplica) */
  AND c.RUT IS NOT NULL AND c.RUT <> ''

  /* (2) FILTRO PROYECTO (OPCIONAL)
     - Actívalo quitando el comentario y cambiando el nombre */
  -- AND pr.NOM_PROYECTO = 'Condominio Pinamar'

GROUP BY c.RUT
ORDER BY ec.FECHA_REGISTRO DESC
/* (3) LIMITE EDITABLE */
LIMIT 200;

-- comentado
/* ============================================================
   VISOR LEADS - FUNCIONA (dedup por RUT, con PROYECTO)
   ------------------------------------------------------------
   CAMBIA SOLO AQUÍ:

   (A) FECHAS (por FECHA_REGISTRO):
       - cambia FECHA_DESDE y FECHA_HASTA (formato 'YYYY-MM-DD')

   (B) PROYECTO (opcional):
       - si NO quieres filtrar por proyecto: deja comentada la línea
       - si quieres filtrar: descomenta y cambia el nombre exacto

   (C) CANTIDAD DE LEADS:
       - cambia LIMIT al final
   ============================================================ */


/* ============================================================
   CONSULTA PRINCIPAL
   - Trae datos del cliente
   - Trae el ÚLTIMO contacto (observación + fecha)
   - Trae el PROYECTO del último contacto
   - Deduplica por RUT usando “última fecha de contacto” por RUT
   ============================================================ */
SELECT
  CONCAT(c.NOMBRE, ' ', c.APELLIDO) AS NOMBRE_COMPLETO,
  c.RUT,
  COALESCE(NULLIF(c.TELEFONO2,''), NULLIF(c.TELEFONO1,'')) AS TELEFONO,
  c.EMAIL,
  COALESCE(pr.NOM_PROYECTO,'') AS PROYECTO,
  COALESCE(c.RANGO_RENTA,'') AS RANGO_RENTA,
  COALESCE(c.ANTIGUEDAD,'') AS ANTIGUEDAD_LABORAL,
  COALESCE(NULLIF(TRIM(ec.OBSERVACION),''), NULLIF(TRIM(ec.DESCRIPCION),''), '') AS ULTIMA_OBSERVACION,
  ec.FECHA_REGISTRO AS FECHA_ULTIMA_OB

FROM CLIENTES_VIEW c


/* ============================================================
   SUBQUERY last_by_rut
   - Por cada RUT, busca la FECHA_REGISTRO más reciente
   - Así dejamos 1 registro por RUT (sin duplicados por RUT)
   ============================================================ */
JOIN (
  SELECT
    c2.RUT,
    MAX(ec2.FECHA_REGISTRO) AS MAX_FECHA
  FROM CLIENTES_VIEW c2
  JOIN EVENTOS_VIEW ev2
    ON ev2.ID_CLIENTE = c2.ID_CLIENTE
  JOIN EVENTOS_CONTACTOS_VIEW ec2
    ON ec2.ID_EVENTO = ev2.ID_EVENTO
  WHERE
    /* ============================
       (A) FECHAS EDITABLES (CAMBIA AQUÍ)
       ============================ */
    ec2.FECHA_REGISTRO >= '2025-06-01'
    AND ec2.FECHA_REGISTRO <= '2026-01-31'

    /* filtros base */
    AND c2.RUT IS NOT NULL AND c2.RUT <> ''
    AND (c2.EMAIL IS NULL OR (LOWER(c2.EMAIL) NOT LIKE '%@urbani%' AND LOWER(c2.EMAIL) NOT LIKE '%@moby%'))
    AND COALESCE(c2.CANTIDAD_NEGOCIOS, 0) < 1
  GROUP BY c2.RUT
) last_by_rut
  ON last_by_rut.RUT = c.RUT


/* ============================================================
   Traemos el evento/contacto que coincide con esa fecha máxima
   ============================================================ */
JOIN EVENTOS_VIEW ev
  ON ev.ID_CLIENTE = c.ID_CLIENTE
JOIN EVENTOS_CONTACTOS_VIEW ec
  ON ec.ID_EVENTO = ev.ID_EVENTO
 AND ec.FECHA_REGISTRO = last_by_rut.MAX_FECHA


/* ============================================================
   Proyecto del último contacto
   ============================================================ */
LEFT JOIN PROYECTOS_VIEW pr
  ON pr.ID_PROYECTO = ec.ID_PROYECTO


WHERE
  /* filtros base */
  c.RUT IS NOT NULL AND c.RUT <> ''
  AND (c.EMAIL IS NULL OR (LOWER(c.EMAIL) NOT LIKE '%@urbani%' AND LOWER(c.EMAIL) NOT LIKE '%@moby%'))
  AND COALESCE(c.CANTIDAD_NEGOCIOS, 0) < 1


  /* ============================
     (B) FILTRO PROYECTO (OPCIONAL) (CAMBIA AQUÍ)
     - Actívalo quitando el comentario y cambiando el nombre
     ============================ */
  -- AND pr.NOM_PROYECTO = 'Condominio Pinamar'


/* ordena por último contacto */
ORDER BY ec.FECHA_REGISTRO DESC


/* ============================
   (C) CANTIDAD DE LEADS (CAMBIA AQUÍ)
   ============================ */
LIMIT 200;
