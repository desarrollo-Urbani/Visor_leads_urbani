export type LeadStatus = "No Gestionado" | "En Proceso" | "Contactado" | "Interesado" | "Cerrado" | "Rechazado" | "Visita" | "No Efectivo" | "Por Contactar";

export interface ContactEvent {
    id: string;
    created_at: string;
    description: string;
    created_by: string;
}

export interface LeadStatusHistory {
    id: string;
    lead_id: string;
    old_status: string;
    new_status: string;
    changed_by: string;
    changed_at: string;
    notes?: string;
}

export interface Lead {
    id: string; // UUID in Supabase
    nombre: string;
    email: string;
    renta: string; // kept as string initially, can be parsed
    fecha_registro: string; // ISO date string
    cantidad_negocios: number;
    proyecto: string;
    telefono?: string;
    estado_gestion: LeadStatus;
    ultima_gestion?: string; // ISO date string
    fecha_proximo_contacto?: string; // ISO date string
    notas?: string;
    asignado_a?: string; // UUID of executive
    nombre_ejecutivo?: string; // Name of assigned executive
    contact_event_id?: string; // Linked to mass upload event
}

export interface User {
    id: string;
    nombre: string;
    email: string;
    role: string;
}
