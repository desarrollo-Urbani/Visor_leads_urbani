import { getLeads, updateLeadStatus, getLeadHistory } from "@/lib/api";
import type { LeadQueueFilters, QuickActionPayload, QuickActionType } from "../types/lead.types";

/**
 * Mapeo de QuickActionType al String de estado que espera el backend
 */
const ACTION_TO_STATUS: Record<QuickActionType, string> = {
    no_contesta: "Por Contactar",
    numero_invalido: "No Efectivo",
    contactado: "Contactado",
    agendar_visita: "Visita",
    perdido: "Cerrado",
};

export async function fetchLeadQueue(userId: string, role: string, filters: LeadQueueFilters, page = 0, pageSize = 100) {
    // El backend usa Record<string, string> para filtros
    const apiFilters: Record<string, string> = {};
    if (filters.estado) apiFilters.estado = filters.estado;
    if (filters.proyecto) apiFilters.proyecto = filters.proyecto;
    if (filters.search) apiFilters.search = filters.search;

    // Nota: El search y el orden se manejan en el frontend sobre la lista descargada 
    // o se podrían implementar en el backend si fuera necesario. 
    // Por ahora lo dejamos simple para el MVP.

    return getLeads(userId, role, apiFilters, page, pageSize);
}

export async function applyQuickAction(userId: string, payload: QuickActionPayload) {
    const status = ACTION_TO_STATUS[payload.action];

    return updateLeadStatus(
        payload.leadId,
        status,
        userId,
        payload.nota || payload.motivo, // Usamos la nota o el motivo como comentario
        payload.fechaProximoContacto,
        payload.renta
    );
}

export async function fetchLeadHistory(leadId: string) {
    return getLeadHistory(leadId);
}
