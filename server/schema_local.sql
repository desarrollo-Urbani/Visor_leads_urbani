-- Esquema Definitivo Local (Sin Supabase Auth)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Usuarios del Sistema
CREATE TABLE IF NOT EXISTS public.usuarios_sistema (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, 
    nombre TEXT,
    role TEXT DEFAULT 'ejecutivo', -- ejecutivo, subgerente, gerente, admin
    activo BOOLEAN DEFAULT true,
    jefe_id UUID REFERENCES public.usuarios_sistema(id),
    must_reset_password BOOLEAN DEFAULT true
);

-- 2. Eventos de Contacto (Campañas)
CREATE TABLE IF NOT EXISTS public.contact_events (
    id SERIAL PRIMARY KEY,
    description TEXT,
    created_by UUID REFERENCES public.usuarios_sistema(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Datos
    nombre TEXT,
    email TEXT,
    telefono TEXT,
    renta TEXT,
    proyecto TEXT,
    observacion TEXT,
    renta_real TEXT,
    
    -- Estado
    estado_gestion TEXT DEFAULT 'No Gestionado',
    estado_interno TEXT DEFAULT 'Pendiente',
    
    -- Referencias
    contact_event_id INTEGER REFERENCES public.contact_events(id) ON DELETE CASCADE,
    asignado_a UUID REFERENCES public.usuarios_sistema(id),
    notas_ejecutivo TEXT
);

-- 4. Historial de Estados
CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    usuario_id UUID REFERENCES public.usuarios_sistema(id),
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Registro de Archivos CSV
CREATE TABLE IF NOT EXISTS public.archivos_csv (
    id SERIAL PRIMARY KEY,
    nombre_archivo TEXT NOT NULL,
    contenido_binario BYTEA,
    contact_event_id INTEGER REFERENCES public.contact_events(id) ON DELETE CASCADE,
    fecha_subida TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Usuario Administrador Inicial
INSERT INTO public.usuarios_sistema (nombre, email, password_hash, role, activo)
VALUES ('Admin Urbani', 'admin@urbani.com', '123', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Indices
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_event ON public.leads(contact_event_id);
