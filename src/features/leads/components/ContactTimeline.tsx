import React from "react";
import type { LeadHistoryEntry } from "../types/lead.types";

interface ContactTimelineProps {
    history: LeadHistoryEntry[];
    loading: boolean;
}

const ContactTimeline: React.FC<ContactTimelineProps> = ({ history, loading }) => {
    return (
        <section className="bg-white border border-[#dfe6ef] rounded-xl flex flex-col min-h-0 shadow-sm overflow-hidden h-full">
            <div className="p-3 border-b border-[#dfe6ef]">
                <h2 className="text-sm font-bold m-0">ContactTimeline</h2>
                <p className="text-[11px] text-[#64748b] font-medium m-0">Evidencia de gestión y control de cadencia</p>
            </div>

            <div className="p-3 border-b border-[#dfe6ef] bg-[#f8fafc]">
                <strong className="text-[11px] font-bold block mb-1 uppercase text-[#0f172a]">Cadencia sugerida</strong>
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                    D1 llamada+WA · D2 llamada · D4 WA/email · D6 llamada · D8 WA · D10 cierre no contactable
                </p>
            </div>

            <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
                {loading ? (
                    <div className="text-center text-[12px] text-[#64748b] italic p-10">Cargando historial...</div>
                ) : history.length === 0 ? (
                    <div className="text-center text-[12px] text-[#64748b] italic p-10">Sin gestiones previas registradas.</div>
                ) : (
                    history.map((event, i) => (
                        <div key={event.id || i} className="pl-3 border-l-2 border-l-[#cbd5e1] flex flex-col gap-0.5">
                            <span className="text-[10px] text-[#64748b] font-mono">
                                {new Date(event.created_at).toLocaleString("es-CL", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                            <div className="text-[12px] font-bold text-[#1e293b]">
                                {event.estado_nuevo}
                                <span className="text-[#64748b] font-normal italic ml-1">— {event.changed_by_name || "Sistema"}</span>
                            </div>
                            <p className="text-[12px] text-[#475569] mt-0.5">
                                {event.comentario || "Sin comentarios."}
                            </p>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-[#dfe6ef] bg-[#f8fafc]">
                <strong className="text-[11px] font-bold block mb-2 uppercase text-[#0f172a]">Alertas</strong>
                <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 border border-[#dfe6ef] rounded-[6px] bg-white text-[#b91c1c]">
                        9 leads vencidos
                    </span>
                    <span className="text-[10px] px-2 py-0.5 border border-[#dfe6ef] rounded-[6px] bg-white text-[#b45309]">
                        6 sin próximo paso
                    </span>
                </div>
            </div>
        </section>
    );
};

export default ContactTimeline;
