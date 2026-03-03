import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchLeadQueue } from "../services/leads.api";
import type { LeadQueueItem, LeadQueueFilters } from "../types/lead.types";

export function useLeadQueue(userId: string, role: string) {
    const [leads, setLeads] = useState<LeadQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [filters, setFilters] = useState<LeadQueueFilters>({
        orden: "prioridad",
    });
    const [page, setPage] = useState(0);
    const [totalLeads, setTotalLeads] = useState(0);

    const loadLeads = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await fetchLeadQueue(userId, role, filters, page);
            const clasificacionWeight: Record<string, number> = {
                "Caliente": 1,
                "Tibio": 2,
                "Frio": 3,
                "Sin Clasificacion": 4
            };

            const enrichedLeads: LeadQueueItem[] = response.data.map((l: any) => ({
                ...l,
                intentos: l.intentos || 0,
                vencido: l.vencido || false,
            })).sort((a: any, b: any) => {
                const wA = clasificacionWeight[a.clasificacion] ?? 4;
                const wB = clasificacionWeight[b.clasificacion] ?? 4;
                return wA - wB;
            });
            setLeads(enrichedLeads);
            setTotalLeads(response.total);

            // Auto-seleccionar el primero si no hay ninguno seleccionado
            if (!selectedLeadId && enrichedLeads.length > 0) {
                setSelectedLeadId(enrichedLeads[0].id);
            }
        } catch (err) {
            setError("Error al cargar leads");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userId, role, filters, page]); // Eliminado selectedLeadId de las dependencias para evitar sobre-peticiones y bucles infinitos.

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    const selectLead = useCallback((id: string) => {
        setSelectedLeadId(id);
    }, []);

    const nextLead = useCallback(() => {
        if (leads.length === 0) return;
        const currentIndex = leads.findIndex((l) => l.id === selectedLeadId);
        if (currentIndex < leads.length - 1) {
            setSelectedLeadId(leads[currentIndex + 1].id);
        } else {
            // Si es el último, quizá cargar siguiente página o volver al primero
            setSelectedLeadId(leads[0].id);
        }
    }, [leads, selectedLeadId]);

    const applyFilters = useCallback((newFilters: Partial<LeadQueueFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
        setPage(0); // Reset a primera página al filtrar
    }, []);

    const selectedLead = useMemo(
        () => leads.find((l) => l.id === selectedLeadId) || null,
        [leads, selectedLeadId]
    );

    return {
        leads,
        loading,
        error,
        selectedLeadId,
        selectedLead,
        filters,
        page,
        totalLeads,
        selectLead,
        nextLead,
        applyFilters,
        refreshQueue: loadLeads,
        setPage,
    };
}
