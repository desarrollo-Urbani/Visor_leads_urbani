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

-- Indices recomendados
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_asignado ON public.leads(asignado_a);
