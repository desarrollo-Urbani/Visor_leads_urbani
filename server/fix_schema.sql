-- Script de Corrección y Migración a Esquema Local
-- Ejecuta esto en tu base de datos 'antigravity_db'

-- 1. Crear tabla de Usuarios del Sistema (Reemplazo de auth.users)
DROP TABLE IF EXISTS public.usuarios_sistema CASCADE;
CREATE TABLE IF NOT EXISTS public.usuarios_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- En producción usar bcrypt
    nombre TEXT,
    role TEXT DEFAULT 'ejecutivo', -- 'admin' | 'ejecutivo'
    activo BOOLEAN DEFAULT true
);

-- 2. Corregir tabla LEADS
-- Si la tabla ya existe con referencia a auth.users, necesitamos alterarla.
-- Primero, eliminamos la FK anterior si existe (el nombre puede variar, intentamos hacerlo genérico)

DO $$ 
BEGIN 
  BEGIN
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_asignado_a_fkey;
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- Asegurar que la columna asignado_a apunte a usuarios_sistema
ALTER TABLE public.leads 
    DROP CONSTRAINT IF EXISTS leads_asignado_a_fkey_new;

ALTER TABLE public.leads 
    ADD CONSTRAINT leads_asignado_a_fkey_new 
    FOREIGN KEY (asignado_a) 
    REFERENCES public.usuarios_sistema(id);

-- 3. Limpiar User Roles (Si existe)
DROP TABLE IF EXISTS public.user_roles;

-- 4. Triggers
-- Trigger para asignar rol por defecto (opcional, ya que lo pusimos en el default de la tabla)
CREATE OR REPLACE FUNCTION public.handle_new_system_user()
RETURNS trigger AS $$
BEGIN
  -- Lógica adicional si fuera necesaria
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear usuario Admin inicial
INSERT INTO public.usuarios_sistema (email, password_hash, nombre, role)
VALUES 
('admin@urbani.com', 'hashed_password_123', 'Admin Urbani', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 6. Desactivar RLS si estuviera activo
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_sistema DISABLE ROW LEVEL SECURITY;
