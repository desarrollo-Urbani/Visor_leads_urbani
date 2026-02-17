-- Extensiones de Esquema para Visor de Leads v2
-- 1. Tabla de Eventos de Contacto (Cargas Masivas)
CREATE TABLE IF NOT EXISTS public.contact_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT NOT NULL,
    created_by UUID REFERENCES public.usuarios_sistema(id)
);

-- 2. Tabla de Historial de Estados
CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.usuarios_sistema(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 3. Modificaciones a Tabla LEADS
-- Agregar columna para vincular con evento de carga
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS contact_event_id UUID REFERENCES public.contact_events(id);

-- Estandarizar Estados (Esto no es un ENUM estricto de Postgres para facilitar cambios, pero se controlará por App)
-- Actualizar estados viejos a 'No Gestionado' si son nulos o vacíos
UPDATE public.leads SET estado_gestion = 'No Gestionado' WHERE estado_gestion IS NULL OR estado_gestion = '';

-- Definir Default
ALTER TABLE public.leads 
ALTER COLUMN estado_gestion SET DEFAULT 'No Gestionado';
