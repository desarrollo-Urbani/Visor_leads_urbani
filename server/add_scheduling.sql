-- Migration: Add scheduled contact field
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS fecha_proximo_contacto TIMESTAMPTZ;

-- Index for performance in dashboard queries
CREATE INDEX IF NOT EXISTS idx_leads_proximo_contacto ON public.leads(fecha_proximo_contacto);
