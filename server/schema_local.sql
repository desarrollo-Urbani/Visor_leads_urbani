-- Esquema Definitivo Local (Sin Supabase Auth)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Usuarios del Sistema
CREATE TABLE IF NOT EXISTS public.usuarios_sistema (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, 
    nombre TEXT,
    role TEXT DEFAULT 'ejecutivo', -- 'admin' | 'ejecutivo'
    activo BOOLEAN DEFAULT true
);

-- 2. Leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Referencias
    id_evento_contacto BIGINT,
    id_usuario BIGINT,
    id_proyecto BIGINT,
    
    -- Datos
    rut TEXT,
    nombre TEXT,
    apellido TEXT,
    nombre_completo TEXT GENERATED ALWAYS AS (nombre || ' ' || apellido) STORED,
    email TEXT,
    telefono1 TEXT,
    telefono2 TEXT,
    direccion TEXT,
    comuna TEXT,
    ciudad TEXT,
    region TEXT,
    renta_real TEXT,
    rango_renta TEXT,
    cantidad_negocios INTEGER,
    nom_proyecto TEXT,
    fecha_registro TIMESTAMPTZ,
    fecha_atencion TIMESTAMPTZ,
    estatus TEXT,
    estado_gestion TEXT, 
    subestado_columna TEXT,
    observacion TEXT,
    respuesta TEXT,
    
    -- Auditoría Local
    estado_interno TEXT DEFAULT 'Pendiente',
    asignado_a UUID REFERENCES public.usuarios_sistema(id),
    notas_ejecutivo TEXT
);

-- 3. Historial de Estados
CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    usuario_id UUID REFERENCES public.usuarios_sistema(id),
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Eventos de Contacto (Campañas)
CREATE TABLE IF NOT EXISTS public.contact_events (
    id SERIAL PRIMARY KEY,
    nombre_campana TEXT NOT NULL,
    fecha_carga TIMESTAMPTZ DEFAULT NOW(),
    total_leads INTEGER DEFAULT 0,
    usuario_id UUID REFERENCES public.usuarios_sistema(id)
);

-- 5. Registro de Archivos CSV
CREATE TABLE IF NOT EXISTS public.archivos_csv (
    id SERIAL PRIMARY KEY,
    nombre_archivo TEXT NOT NULL,
    ruta_archivo TEXT NOT NULL,
    contact_event_id INTEGER REFERENCES public.contact_events(id) ON DELETE CASCADE,
    fecha_subida TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Usuario Administrador Inicial (Password: 123)
INSERT INTO public.usuarios_sistema (nombre, email, password_hash, role, activo)
VALUES ('Admin Urbani', 'admin@urbani.com', '123', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Indices recomendados
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_asignado ON public.leads(asignado_a);
