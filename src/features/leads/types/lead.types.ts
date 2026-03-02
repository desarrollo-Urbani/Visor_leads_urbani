import type { Lead, LeadStatusHistory } from "@/types";

export interface LeadQueueItem extends Lead {
    score?: number;
    intentos?: number;
    vencido?: boolean;
}

export type QuickActionType =
    | "no_contesta"
    | "numero_invalido"
    | "contactado"
    | "agendar_visita"
    | "perdido";

export interface QuickActionPayload {
    leadId: string;
    action: QuickActionType;
    motivo: string;
    proximaAccion?: string;
    fechaProximoContacto?: string;
    nota?: string;
    renta?: string;
}

export interface LeadHistoryEntry extends LeadStatusHistory {
    // Can add V3 specific history fields here if needed
}

export interface LeadQueueFilters {
    estado?: string;
    proyecto?: string;
    search?: string;
    orden?: "prioridad" | "renta" | "intentos";
}
