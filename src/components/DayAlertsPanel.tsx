import { Calendar, Clock, AlertCircle } from "lucide-react";
import type { Lead } from "@/types";

interface DayAlertsPanelProps {
    leads: Lead[];
    onOpenLead: (lead: Lead) => void;
}

export default function DayAlertsPanel({ leads, onOpenLead }: DayAlertsPanelProps) {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const scheduled = leads
        .filter(l => l.estado_gestion === "Por Contactar" && l.fecha_proximo_contacto)
        .map(l => ({ ...l, fechaObj: new Date(l.fecha_proximo_contacto!) }))
        .sort((a, b) => a.fechaObj.getTime() - b.fechaObj.getTime());

    const todayAlerts = scheduled.filter(l => l.fecha_proximo_contacto!.startsWith(todayStr));
    const overdueAlerts = scheduled.filter(l => l.fechaObj < now && !l.fecha_proximo_contacto!.startsWith(todayStr));
    const upcomingAlerts = scheduled.filter(l => l.fechaObj > now && !l.fecha_proximo_contacto!.startsWith(todayStr)).slice(0, 3);

    if (scheduled.length === 0) return null;

    const formatTime = (isoDate: string) => {
        const d = new Date(isoDate);
        return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    };
    const formatDate = (isoDate: string) => {
        const d = new Date(isoDate);
        return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
    };

    return (
        <div className="mb-8 rounded-2xl border border-white/5 bg-[#18181b] overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-black text-white uppercase tracking-widest">Agenda del Día</span>
                    {todayAlerts.length > 0 && (
                        <span className="bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                            {todayAlerts.length} HOY
                        </span>
                    )}
                    {overdueAlerts.length > 0 && (
                        <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-500/30">
                            {overdueAlerts.length} VENCIDO{overdueAlerts.length > 1 ? "S" : ""}
                        </span>
                    )}
                </div>
                <span className="text-[10px] text-gray-500 font-bold">{scheduled.length} contactos agendados</span>
            </div>

            <div className="flex gap-0 overflow-x-auto">
                {overdueAlerts.map(lead => (
                    <button
                        key={lead.id}
                        onClick={() => onOpenLead(lead)}
                        className="flex-shrink-0 p-4 border-r border-white/5 hover:bg-red-500/5 transition-colors text-left min-w-[200px] group"
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <AlertCircle className="h-3 w-3 text-red-400" />
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Vencido</span>
                            <span className="text-[9px] text-gray-600">{formatDate(lead.fecha_proximo_contacto!)}</span>
                        </div>
                        <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">{lead.nombre}</p>
                        <p className="text-[10px] text-gray-500 truncate">{lead.proyecto}</p>
                    </button>
                ))}

                {todayAlerts.map(lead => (
                    <button
                        key={lead.id}
                        onClick={() => onOpenLead(lead)}
                        className="flex-shrink-0 p-4 border-r border-white/5 hover:bg-primary/5 transition-colors text-left min-w-[200px] group"
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <Clock className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Hoy</span>
                            <span className="text-[9px] text-gray-500">{formatTime(lead.fecha_proximo_contacto!)}</span>
                        </div>
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{lead.nombre}</p>
                        <p className="text-[10px] text-gray-500 truncate">{lead.proyecto}</p>
                    </button>
                ))}

                {upcomingAlerts.map(lead => (
                    <button
                        key={lead.id}
                        onClick={() => onOpenLead(lead)}
                        className="flex-shrink-0 p-4 border-r border-white/5 hover:bg-white/[0.02] transition-colors text-left min-w-[200px] group"
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{formatDate(lead.fecha_proximo_contacto!)}</span>
                            <span className="text-[9px] text-gray-600">{formatTime(lead.fecha_proximo_contacto!)}</span>
                        </div>
                        <p className="text-sm font-bold text-white group-hover:text-gray-300 transition-colors truncate">{lead.nombre}</p>
                        <p className="text-[10px] text-gray-500 truncate">{lead.proyecto}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
