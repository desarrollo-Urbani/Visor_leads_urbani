/* ============================================================
   VISOR LEADS - VERSION RAPIDA (MySQL 5.7+)

   TRAE:
   - Nombre completo, RUT, Teléfono, Email
   - Rango renta, Antigüedad laboral
   - Última observación (OBSERVACION o DESCRIPCION)
   - Fecha del último contacto (FECHA_REGISTRO)

   FILTRA:
   - Emails internos (@urbani / @moby)
   - Cantidad_negocios < 1

   PARAMETROS EDITABLES (CAMBIA SOLO EN 3 LUGARES):
   A) Cantidad de leads:       al final => LIMIT 200;
   B) Fechas (FECHA_REGISTRO): en el subquery => ec.FECHA_REGISTRO >= 'YYYY-MM-DD' AND <= 'YYYY-MM-DD'
   C) Proyecto (opcional):     activar filtro en el subquery (ver sección "FILTRO PROYECTO")
   ============================================================ */

SELECT
  /* =========================
     CAMPOS PRINCIPALES (CLIENTE)
     ========================= */
  CONCAT(c.NOMBRE, ' ', c.APELLIDO) AS NOMBRE_COMPLETO,
  c.RUT,
  COALESCE(NULLIF(c.TELEFONO2,''), NULLIF(c.TELEFONO1,'')) AS TELEFONO,
  c.EMAIL,
  COALESCE(c.RANGO_RENTA,'') AS RANGO_RENTA,
  COALESCE(c.ANTIGUEDAD,'')  AS ANTIGUEDAD_LABORAL,

  /* =========================
     CAMPOS DESDE EVENTOS (ULTIMO CONTACTO)
     ========================= */
  u.FECHA_ULTIMA_OB,
  u.ULTIMA_OBSERVACION,
  u.PROYECTO_ULTIMO_CONTACTO   -- (opcional) para ver qué proyecto viene del último contacto

FROM CLIENTES_VIEW c

/* ============================================================
   SUBQUERY u:
   - Calcula el ÚLTIMO CONTACTO por ID_CLIENTE
   - Usa FECHA_REGISTRO
   - Extrae la última observación y el proyecto (si existe ID_PROYECTO)
   ============================================================ */
LEFT JOIN (
  SELECT
    ev.ID_CLIENTE,

    /* FECHA del último contacto del cliente */
    MAX(ec.FECHA_REGISTRO) AS FECHA_ULTIMA_OB,

    /* Texto del último contacto:
       - si OBSERVACION está vacía, usa DESCRIPCION
       - ordena por fecha desc y se queda con el primer texto
    */
    SUBSTRING_INDEX(
      GROUP_CONCAT(
        COALESCE(NULLIF(TRIM(ec.OBSERVACION), ''), NULLIF(TRIM(ec.DESCRIPCION), ''))
        ORDER BY ec.FECHA_REGISTRO DESC SEPARATOR '||'
      ),
      '||', 1
    ) AS ULTIMA_OBSERVACION,

    /* Proyecto del último contacto (si ec.ID_PROYECTO existe):
       - trae el nombre del proyecto
       - si no existe, queda NULL
    */
    SUBSTRING_INDEX(
      GROUP_CONCAT(
        pr.NOM_PROYECTO
        ORDER BY ec.FECHA_REGISTRO DESC SEPARATOR '||'
      ),
      '||', 1
    ) AS PROYECTO_ULTIMO_CONTACTO

  FROM EVENTOS_VIEW ev
  JOIN EVENTOS_CONTACTOS_VIEW ec
    ON ec.ID_EVENTO = ev.ID_EVENTO

  /* Join para traducir ID_PROYECTO a nombre */
  LEFT JOIN PROYECTOS_VIEW pr
    ON pr.ID_PROYECTO = ec.ID_PROYECTO

  WHERE
    /* ============================================================
       (B) FECHAS EDITABLES (CAMBIA AQUI)
       - Si quieres otro periodo, cambia estas 2 fechas
       - Estas fechas filtran ec.FECHA_REGISTRO (campo correcto)
       ============================================================ */
    ec.FECHA_REGISTRO >= '2025-06-01'
    AND ec.FECHA_REGISTRO <= '2026-01-31'

    /* ============================================================
       (C) FILTRO PROYECTO (OPCIONAL) (CAMBIA AQUI)
       - Por defecto está DESACTIVADO para que no te limite resultados.
       - Para ACTIVAR:
           1) elimina el comentario "--" de la línea de abajo
           2) cambia 'Condominio Pinamar' por el nombre exacto
       ============================================================ */
    -- AND pr.NOM_PROYECTO = 'Condominio Pinamar'

  GROUP BY ev.ID_CLIENTE
) u
  ON u.ID_CLIENTE = c.ID_CLIENTE

WHERE
  /* Excluir correos internos */
  (c.EMAIL IS NULL OR (
    LOWER(c.EMAIL) NOT LIKE '%@urbani%'
    AND LOWER(c.EMAIL) NOT LIKE '%@moby%'
  ))

  /* Cantidad de negocios < 1 */
  AND COALESCE(c.CANTIDAD_NEGOCIOS, 0) < 1

/* Ordena por el último contacto más reciente */
ORDER BY u.FECHA_ULTIMA_OB DESC

/* ============================================================
   (A) CANTIDAD DE LEADS (CAMBIA AQUI)
   ============================================================ */
LIMIT 200;
