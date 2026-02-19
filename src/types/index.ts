// Statuses synchronized between UI modal options and this type definition
export type LeadStatus =
    | "No Gestionado"
    | "Por Contactar"
    | "En Proceso"
    | "Visita"
    | "Contactado"
    | "No Efectivo"
    | "Venta Cerrada";

export interface ContactEvent {
    id: string;
    created_at: string;
    description: string;
    created_by: string;
}

export interface LeadStatusHistory {
    id: string;
    lead_id: string;
    estado_anterior: string;
    estado_nuevo: string;
    usuario_id: string;
    changed_by_name?: string;
    created_at: string;
    comentario?: string;
}

export interface Lead {
    id: string;
    nombre: string;
    apellido?: string;
    email: string;
    renta: string;
    fecha_registro?: string;
    cantidad_negocios?: number;
    proyecto: string;
    telefono?: string;
    estado_gestion: LeadStatus;
    ultima_gestion?: string;
    fecha_proximo_contacto?: string;
    notas?: string;
    notas_ejecutivo?: string;
    asignado_a?: string;
    nombre_ejecutivo?: string;
    contact_event_id?: string;
    antiguedad_laboral?: string;
    es_caliente?: boolean;
    es_ia?: boolean;
    rut?: string;
    observacion?: string;
    created_at?: string;
}

export interface User {
    id: string;
    nombre: string;
    email: string;
    role: string;
    activo?: boolean;
    created_at?: string;
    jefe_id?: string;
    company_id?: string;
    must_reset_password?: boolean;
}
