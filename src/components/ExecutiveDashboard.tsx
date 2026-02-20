import MiniKPIs from "@/components/MiniKPIs";
import DayAlertsPanel from "@/components/DayAlertsPanel";
import type { Lead, User } from "@/types";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ExecutiveDashboardProps {
    leads: Lead[];
    currentUser: User | null;
    onOpenManagement: (lead: Lead) => void;
}

export default function ExecutiveDashboard({ leads, currentUser, onOpenManagement }: ExecutiveDashboardProps) {
    const pendingLeads = leads.filter(l => l.estado_gestion === 'No Gestionado');

    const today = new Date();

    // Calculate delays
    const getDelayHours = (dateStr?: string) => {
        if (!dateStr) return 0;
        const diff = today.getTime() - new Date(dateStr).getTime();
        return Math.floor(diff / (1000 * 60 * 60));
    };

    // Sort by delay (oldest first)
    const sortedPending = [...pendingLeads].sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return da - db;
    });

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            {/* 1. Resumen de KPIs (Imagen del usuario) */}
            <MiniKPIs leads={leads} userName={currentUser?.nombre} />

            {/* 2. Agenda y Alertas */}
            <DayAlertsPanel leads={leads} onOpenLead={onOpenManagement} />

            {/* 3. Sección "Pendientes de Contactar" (Nuevos / No Gestionados) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <Clock className="h-6 w-6 text-orange-500" />
                            Pendientes de Primer Contacto
                        </h2>
                        <p className="text-gray-500 text-sm font-medium mt-1">
                            Leads asignados que aún no tienen gestión registrada.
                        </p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-1 rounded-full">
                        <span className="text-orange-500 font-black text-sm">{pendingLeads.length} PENDIENTES</span>
                    </div>
                </div>

                {sortedPending.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">¡Todo al día!</h3>
                        <p className="text-gray-500">No tienes leads nuevos pendientes de contactar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedPending.slice(0, 6).map(lead => {
                            const delay = getDelayHours(lead.created_at);
                            const isCritical = delay > 24;

                            return (
                                <Card
                                    key={lead.id}
                                    className={`bg-[#18181b] border-white/5 hover:border-orange-500/30 transition-all cursor-pointer group shadow-lg ${isCritical ? 'ring-1 ring-red-500/20' : ''}`}
                                    onClick={() => onOpenManagement(lead)}
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500 font-bold">
                                                    {(lead.nombre || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-orange-400 transition-colors">{lead.nombre} {lead.apellido}</h4>
                                                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider">{lead.proyecto}</p>
                                                </div>
                                            </div>
                                            {isCritical && (
                                                <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-red-500/20">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Retraso
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
                                            <span>Esperando gestión:</span>
                                            <span className={`font-mono font-bold ${delay > 4 ? 'text-red-400' : 'text-green-400'}`}>
                                                {delay} horas
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex justify-between items-center group-hover:bg-orange-500/5 transition-colors">
                                        <span className="text-[10px] text-gray-500 uppercase font-black">Gestionar ahora</span>
                                        <span className="text-orange-500">→</span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {pendingLeads.length > 6 && (
                    <div className="flex justify-center pt-4">
                        <div className="text-center">
                            <p className="text-gray-500 text-sm mb-2">Hay {pendingLeads.length - 6} leads más pendientes.</p>
                            <button
                                className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white font-bold transition-colors border border-white/10"
                                onClick={() => document.querySelector<HTMLButtonElement>("button[class*='Gestionar Leads']")?.click()}
                            >
                                Ir a Gestionar Todo →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
