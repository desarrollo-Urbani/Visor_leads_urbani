import React from "react";
import type { LeadQueueItem, LeadQueueFilters } from "../types/lead.types";
import { Search, CheckCircle, Clock } from "lucide-react";

interface LeadQueueProps {
    leads: LeadQueueItem[];
    loading: boolean;
    selectedId: string | null;
    filters: LeadQueueFilters;
    onSelect: (id: string) => void;
    onFilterChange: (filters: Partial<LeadQueueFilters>) => void;
}

const LeadQueue: React.FC<LeadQueueProps> = ({
    leads,
    loading,
    selectedId,
    filters,
    onSelect,
    onFilterChange,
}) => {
    return (
        <section className="bg-white border border-[#dfe6ef] rounded-xl flex flex-col min-h-0 shadow-sm overflow-hidden h-full">
            <div className="p-3 border-b border-[#dfe6ef]">
                <h2 className="text-sm font-bold m-0 text-[15px]">Cola de Gestión</h2>
                <p className="text-[12px] text-[#64748b] font-medium m-0">Prioridad por clasificación + tiempo</p>
            </div>

            <div className="p-2 flex flex-col gap-2 bg-[#f8fafc]">
                <div className="flex gap-1">
                    <select
                        className="flex-1 text-[12px] p-1.5 border border-[#dfe6ef] rounded-[8px] outline-none"
                        value={filters.estado || ""}
                        onChange={(e) => onFilterChange({ estado: e.target.value })}
                    >
                        <option value="">Filtro: Todos</option>
                        <option value="No Gestionado">Nuevos</option>
                        <option value="Por Contactar">Pendientes</option>
                        <option value="vencidos">Vencidos</option>
                    </select>
                    <select
                        className="flex-1 text-[12px] p-1.5 border border-[#dfe6ef] rounded-[8px] outline-none"
                        value={filters.orden}
                        onChange={(e) => onFilterChange({ orden: e.target.value as any })}
                    >
                        <option value="prioridad">Orden: Prioridad</option>
                        <option value="renta">Renta alta</option>
                        <option value="intentos">Más intentos</option>
                    </select>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
                    <input
                        placeholder="Buscar por nombre/teléfono..."
                        className="w-full text-[12px] pl-7 pr-2 py-1.5 border border-[#dfe6ef] rounded-[8px] outline-none"
                        value={filters.search || ""}
                        onChange={(e) => onFilterChange({ search: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="p-10 text-center text-[13px] text-[#64748b] italic">Cargando leads...</div>
                ) : leads.length === 0 ? (
                    <div className="p-10 text-center text-[13px] text-[#64748b] italic">No hay leads en la cola.</div>
                ) : (
                    leads.map((lead) => (
                        <article
                            key={lead.id}
                            onClick={() => onSelect(lead.id)}
                            className={`p-3 border-b border-[#dfe6ef] cursor-pointer transition-colors ${selectedId === lead.id
                                ? "bg-[#eff6ff] border-l-4 border-l-[#1d4ed8]"
                                : lead.estado_gestion === "No Gestionado"
                                    ? "bg-[#fef2f2] hover:bg-[#fee2e2]"
                                    : "bg-[#f0fdf4] hover:bg-[#dcfce7]"
                                }`}
                        >
                            <div className="font-semibold text-[14px] text-[#0f172a] truncate flex items-center gap-2">
                                {lead.estado_gestion !== "No Gestionado" ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                ) : (
                                    <Clock className="h-4 w-4 text-red-500 shrink-0" />
                                )}
                                <span className="truncate">{lead.nombre} {lead.apellido}</span>
                                <span className="text-[#64748b] font-normal text-[12px] truncate">· {lead.proyecto}</span>
                            </div>
                            <div className="text-[12px] text-[#64748b] mt-0.5">
                                {lead.telefono} · {lead.email}
                            </div>
                            <div className="flex gap-1.5 flex-wrap mt-2">
                                <span className={`text-[11px] px-2 py-0.5 border rounded-[6px] ${(lead.clasificacion === 'Caliente' || lead.es_caliente) ? 'bg-red-50 border-red-200 text-red-700' :
                                    lead.clasificacion === 'Tibio' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                        lead.clasificacion === 'Frio' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                            'bg-white border-[#dfe6ef] text-[#64748b]'
                                    }`}>
                                    {(lead.clasificacion === 'Caliente' || lead.es_caliente) ? '🔥 Caliente' :
                                        lead.clasificacion === 'Tibio' ? '🌤️ Tibio' :
                                            lead.clasificacion === 'Frio' ? '❄️ Frio' :
                                                'Sin calificar'}
                                </span>
                                {lead.intentos && (
                                    <span className="text-[11px] px-2 py-0.5 border border-[#dfe6ef] rounded-[6px] bg-white">
                                        Intento {lead.intentos}/6
                                    </span>
                                )}
                                {lead.vencido && (
                                    <span className="text-[11px] px-2 py-0.5 border border-red-200 rounded-[6px] bg-red-50 text-red-700">
                                        Vencido
                                    </span>
                                )}
                            </div>
                        </article>
                    ))
                )}
            </div>

            <div className="p-3 border-top border-[#dfe6ef] bg-[#f8fafc]">
                <div className="text-[11px] text-[#64748b]">
                    Cola de trabajo: <span className="font-bold">{leads.length} leads</span>
                </div>
            </div>
        </section>
    );
};

export default LeadQueue;
