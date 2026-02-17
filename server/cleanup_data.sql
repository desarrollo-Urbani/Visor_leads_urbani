-- Limpiar historial de estados de leads
TRUNCATE TABLE lead_status_history RESTART IDENTITY CASCADE;

-- Limpiar leads
TRUNCATE TABLE leads RESTART IDENTITY CASCADE;

-- Limpiar eventos de contacto (cargas masivas)
TRUNCATE TABLE contact_events RESTART IDENTITY CASCADE;

-- Opcional: Si quieres limpiar también los usuarios descomenta la siguiente línea:
-- TRUNCATE TABLE usuarios_sistema RESTART IDENTITY CASCADE;
