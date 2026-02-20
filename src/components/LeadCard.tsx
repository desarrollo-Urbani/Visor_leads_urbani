import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Mail, History, ChevronDown, ChevronUp, Bot, Database, Fingerprint, Banknote, Clock, Send, X } from "lucide-react";
import { InlineStatusDropdown } from "@/components/InlineStatusDropdown";
import { updateLeadStatus } from "@/lib/api";
import type { Lead, User } from "@/types";

interface LeadCardProps {
    lead: Lead;
    currentUser: User | null;
    isSelected: boolean;
    toggleSelect: (id: string) => void;
    openManagement: (lead: Lead) => void;
    openHistory: (lead: Lead) => void;
    refreshData: () => void;
}

export default function LeadCard({
    lead,
    currentUser,
    isSelected,
    toggleSelect,
    openHistory,
    refreshData
}: LeadCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduledDate, setScheduledDate] = useState("");
    const [managementNote, setManagementNote] = useState("");
    const [saving, setSaving] = useState(false);

    const initials = (lead.nombre || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

    // Waiting Time Calculation
    const getWaitingTime = () => {
        if (!lead.created_at) return null;
        const created = new Date(lead.created_at);
        const diffMs = Date.now() - created.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHrs < 1) return "Menos de 1 hora";
        if (diffHrs < 24) return `${diffHrs} horas`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    };

    const waitingTime = getWaitingTime();

    // Priority classification
    const now = new Date();
    const isOverdue = lead.estado_gestion === 'Por Contactar' && lead.fecha_proximo_contacto && new Date(lead.fecha_proximo_contacto) < now;

    const formatCurrency = (val: string | undefined) => {
        if (!val || val === "0") return null;
        const clean = val.replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
        const n = parseFloat(clean);
        return isNaN(n) ? null : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
    };

    const phoneNum = (lead.telefono || '').replace(/\D/g, '');
    const waNum = phoneNum.startsWith('56') ? phoneNum : `56${phoneNum}`;

    const handleConfirmSchedule = async () => {
        if (!scheduledDate) {
            alert("Por favor selecciona una fecha");
            return;
        }
        setSaving(true);
        const success = await updateLeadStatus(lead.id, 'Por Contactar', currentUser?.id || '', managementNote, scheduledDate);
        if (success) {
            setIsScheduling(false);
            setManagementNote("");
            setScheduledDate("");
            refreshData();
        }
        setSaving(false);
    };

    return (
        <Card className={`group transition-all duration-300 bg-[#12141a]/95 backdrop-blur-xl border-white/5 hover:border-primary/30 shadow-2xl rounded-[1.5rem] overflow-hidden relative ${isSelected ? 'ring-2 ring-primary border-primary/50' : ''} ${isOverdue ? 'ring-1 ring-red-500/30' : ''}`}>

            <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(lead.id); }}
                className={`absolute top-4 left-4 z-10 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-black' : 'border-white/10 bg-black/40 text-transparent hover:border-primary/40'}`}
            >
                {isSelected && <Send className="h-2 w-2 rotate-90" />}
            </button>

            <CardHeader className="p-6 pb-2 pt-8">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center border border-white/5 shadow-inner">
                            <span className="text-xl font-black text-primary/70 tracking-tighter">{initials}</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black text-white group-hover:text-primary transition-colors leading-none tracking-tight">
                                {lead.nombre} {lead.apellido || ''}
                            </CardTitle>
                            <CardDescription className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Fingerprint className="w-2.5 h-2.5 opacity-50" />
                                {lead.rut || "SIN RUT"}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter ${lead.es_ia ? 'bg-blue-500/5 border-blue-500/10 text-blue-400/80' : 'bg-amber-500/5 border-amber-500/10 text-amber-400/80'}`}>
                            {lead.es_ia ? <Bot className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                            {lead.es_ia ? 'AI' : 'BASE'}
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 tracking-tight">Esperando gestión:</span>
                    <span className={`text-[10px] font-black tracking-tight ${isOverdue ? 'text-red-400' : 'text-primary'}`}>{waitingTime}</span>
                </div>
            </CardHeader>

            <CardContent className="p-6 pt-2">
                <div className="grid grid-cols-2 gap-3 py-4 border-b border-white/5 mb-4">
                    <div className="flex items-center gap-2">
                        <Banknote className="w-3 h-3 text-emerald-500/50" />
                        <span className="text-sm font-black text-white">{formatCurrency(lead.renta) || "N/A"}</span>
                    </div>
                    <div className="text-right">
                        <span className={`text-[10px] font-bold truncate block ${lead.proyecto ? 'text-gray-400' : 'text-red-400 opacity-60'}`}>
                            {lead.proyecto || "No hay proyecto"}
                        </span>
                    </div>
                </div>

                <div className="mb-4 cursor-pointer group/obs" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Observación / Bitácora</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3 text-gray-600" /> : <ChevronDown className="h-3 w-3 text-gray-600" />}
                    </div>
                    <p className={`text-[11px] text-gray-300 leading-relaxed font-medium transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {lead.observacion || (lead.notas_ejecutivo ? `Nota: ${lead.notas_ejecutivo}` : "Sin actividad registrada...")}
                    </p>
                </div>

                <div className="flex flex-col gap-1.5 mb-5 p-3 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Mail className="w-2.5 h-2.5 text-gray-600" />
                            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[140px]">{lead.email || 'Sin mail'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-2.5 h-2.5 text-gray-600" />
                            <span className="text-[10px] text-gray-400 font-medium">{lead.telefono || 'Sin tel.'}</span>
                        </div>
                    </div>
                </div>

                {!isScheduling ? (
                    <div className="flex items-center justify-between">
                        <InlineStatusDropdown
                            lead={lead}
                            userId={currentUser?.id || ''}
                            onUpdated={refreshData}
                            onScheduleRequest={() => setIsScheduling(true)}
                        />
                        <div className="flex gap-1.5">
                            <a href={phoneNum ? `tel:+${waNum}` : undefined} className={`p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-green-500/10 hover:text-green-400 transition-colors ${!phoneNum && 'opacity-20 cursor-not-allowed'}`}>
                                <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a href={phoneNum ? `https://wa.me/${waNum}` : undefined} target="_blank" className={`p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors ${!phoneNum && 'opacity-20 cursor-not-allowed'}`}>
                                <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                            <Button variant="ghost" size="icon" onClick={() => openHistory(lead)} className="h-8 w-8 rounded-xl border border-white/5 text-gray-500 hover:text-white">
                                <History className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 p-4 bg-primary/5 border border-primary/20 rounded-[1.5rem]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Agendar Contacto
                            </span>
                            <button onClick={() => setIsScheduling(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <input
                            type="datetime-local"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-primary/50 mb-3"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                        />
                        <textarea
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-primary/50 mb-3 min-h-[60px] resize-none"
                            placeholder="Notas de agendamiento..."
                            value={managementNote}
                            onChange={(e) => setManagementNote(e.target.value)}
                        />
                        <Button
                            onClick={handleConfirmSchedule}
                            disabled={saving}
                            className="w-full h-8 bg-primary text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-primary/80 transition-all"
                        >
                            {saving ? "Guardando..." : "Confirmar Agendamiento"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
