-- SCRIPT PARA CREAR ENTORNO DE PRUEBAS (SANDBOX)
-- Ejecutar en tu cliente de base de datos (pgAdmin, DBeaver, etc.)

-- 1. Crear la base de datos de pruebas (si no existe)
-- Nota: Algunos clientes no permiten CREATE DATABASE dentro de una transacción o script simple.
-- Si falla, crea la DB manualmente llamada 'visor_sandbox'.

-- 2. Esquema para la Sandbox
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.usuarios_sistema (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, 
    nombre TEXT,
    role TEXT DEFAULT 'ejecutivo',
    activo BOOLEAN DEFAULT true,
    jefe_id UUID REFERENCES public.usuarios_sistema(id),
    must_reset_password BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.contact_events (
    id SERIAL PRIMARY KEY,
    description TEXT,
    created_by UUID REFERENCES public.usuarios_sistema(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    nombre TEXT,
    email TEXT,
    telefono TEXT,
    renta TEXT,
    proyecto TEXT,
    observacion TEXT,
    renta_real TEXT,
    estado_gestion TEXT DEFAULT 'No Gestionado',
    contact_event_id INTEGER REFERENCES public.contact_events(id) ON DELETE CASCADE,
    asignado_a UUID REFERENCES public.usuarios_sistema(id),
    rut TEXT,
    es_ia BOOLEAN DEFAULT false,
    es_caliente BOOLEAN DEFAULT false,
    fecha_proximo_contacto TEXT,
    score INTEGER DEFAULT 0,
    intentos INTEGER DEFAULT 0
);

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS unique_lead_email_tel_proy;
ALTER TABLE public.leads ADD CONSTRAINT unique_lead_email_tel_proy UNIQUE (email, telefono, proyecto);

CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    usuario_id UUID REFERENCES public.usuarios_sistema(id),
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuario Admin de Pruebas
INSERT INTO public.usuarios_sistema (nombre, email, password_hash, role, activo, must_reset_password)
VALUES ('Admin Sandbox', 'admin.test@urbani.cl', 'hashed_123', 'admin', true, false)
ON CONFLICT (email) DO NOTHING;
