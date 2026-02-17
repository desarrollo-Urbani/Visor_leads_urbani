-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create table for leads based on the CSV structure
-- We map the most relevant columns found in the CSV.
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- IDs & Referencias
    id_evento_contacto BIGINT, -- ID original del CSV
    id_usuario BIGINT,
    id_proyecto BIGINT,
    
    -- Datos Personales
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
    
    -- Datos Económicos/Perfil
    renta_real TEXT, -- En CSV aparece como texto a veces (ej: "más de...") o numérico
    rango_renta TEXT,
    cantidad_negocios INTEGER,
    
    -- Datos del Proyecto/Lead
    nom_proyecto TEXT,
    fecha_registro TIMESTAMPTZ,
    fecha_atencion TIMESTAMPTZ,
    
    -- Estado y Gestión
    estatus TEXT, -- Ej: FINALIZADO
    estado_gestion TEXT, -- Mapeado de 'TIPO_GESTION' o 'SUBESTADO_COLUMNA'
    subestado_columna TEXT,
    observacion TEXT,
    respuesta TEXT,
    
    -- Campos de Auditoría Interna del Visor
    estado_interno TEXT DEFAULT 'Pendiente', -- Para uso del Visor (Pendiente, Contactado, etc)
    asignado_a UUID REFERENCES auth.users(id),
    notas_ejecutivo TEXT
);

-- 2. Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see everything.
-- Policy: Executives can see assigned leads OR leads from their projects.
-- For simplicity in this phase, we allow authenticated users to read/update.
CREATE POLICY "Enable all access for authenticated users" ON "public"."leads"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT DEFAULT 'ejecutivo', -- 'admin' | 'ejecutivo'
  nombre TEXT
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read roles" ON public.user_roles TO authenticated USING (true);

-- 4. Trigger for new Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (id, role)
  VALUES (new.id, 'ejecutivo');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
