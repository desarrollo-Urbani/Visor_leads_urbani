import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Mail, History, Fingerprint, Banknote, Clock, Save } from "lucide-react";
import { updateLeadStatus } from "@/lib/api";
import type { Lead, User } from "@/types";

interface LeadCardProps {
    lead: Lead;
    currentUser: User | null;
    isSelected: boolean;
    toggleSelect: (id: string) => void;
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
    const [status, setStatus] = useState(lead.estado_gestion || "No Gestionado");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    const initials = (lead.nombre || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

    // Waiting Hours Calculation
    const getWaitingHours = () => {
        if (!lead.created_at) return "0";
        const created = new Date(lead.created_at);
        const diffMs = Date.now() - created.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        return diffHrs.toString();
    };

    const waitingHours = getWaitingHours();

    const formatCurrency = (val: string | undefined) => {
        if (!val || val === "0") return "N/A";
        const clean = val.toString().replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.]/g, "");
        const n = parseFloat(clean);
        return isNaN(n) ? "N/A" : new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const success = await updateLeadStatus(lead.id, status, currentUser?.id || "", note);
            if (success) {
                setNote("");
                refreshData();
            }
        } catch (error) {
            console.error("Error saving lead management:", error);
        } finally {
            setSaving(false);
        }
    };

    const phoneNum = (lead.telefono || "").replace(/\D/g, "");
    const waNum = phoneNum.startsWith("56") ? phoneNum : `56${phoneNum}`;

    return (
        <Card className={`group bg-[#12141a] border-white/5 shadow-2xl rounded-2xl overflow-hidden relative ${isSelected ? "ring-2 ring-primary" : ""}`}>

            {/* Selection Checkbox */}
            <div className="absolute top-4 left-4 z-10">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(lead.id)}
                    className="w-4 h-4 rounded border-white/20 bg-black/40 accent-primary"
                />
            </div>

            <CardHeader className="p-6 pb-2 pt-8">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-white/5">
                            <span className="text-xl font-bold text-primary/80">{initials}</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-white">
                                {lead.nombre || ""} {lead.apellido || ""}
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Fingerprint className="w-3 h-3 opacity-50" />
                                {lead.rut || "SIN RUT"}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{waitingHours} hrs espera</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 pt-2">
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-white/5 mb-4">
                    <div className="space-y-1">
                        <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block">Renta</span>
                        <div className="flex items-center gap-2">
                            <Banknote className="w-3.5 h-3.5 text-emerald-500/50" />
                            <span className="text-sm font-bold text-white">{formatCurrency(lead.renta)}</span>
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block">Proyecto</span>
                        <span className="text-sm text-gray-300 font-medium truncate block">{lead.proyecto || "No especificado"}</span>
                    </div>
                </div>

                {/* Full Observation Display */}
                <div className="mb-6">
                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block mb-2">Observación Completa</span>
                    <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                            {lead.observacion || "Sin actividad registrada..."}
                        </p>
                    </div>
                </div>

                {/* Contact Data */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                        <Mail className="w-3 h-3 text-gray-600 flex-shrink-0" />
                        <span className="text-[10px] text-gray-400 font-medium truncate">{lead.email || "Sin email"}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                        <Phone className="w-3 h-3 text-gray-600 flex-shrink-0" />
                        <span className="text-[10px] text-gray-400 font-medium">{lead.telefono || "Sin tel."}</span>
                    </div>
                </div>

                {/* Management Form */}
                <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-primary uppercase font-black tracking-widest">Nuevo Estado</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                        >
                            <option value="No Gestionado">No Gestionado</option>
                            <option value="Por Contactar">Por Contactar</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Cerrado">Cerrado</option>
                            <option value="No Interesado">No Interesado</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-primary uppercase font-black tracking-widest">Registrar Gestión</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Añadir comentario sobre la llamada o acción..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-primary/50 min-h-[80px] resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                            <a href={phoneNum ? `tel:+${waNum}` : undefined} className={`p-2 rounded-lg bg-white/5 border border-white/5 hover:text-green-400 transition-colors ${!phoneNum ? "opacity-20 cursor-not-allowed" : ""}`}>
                                <Phone className="w-4 h-4" />
                            </a>
                            <a href={phoneNum ? `https://wa.me/${waNum}` : undefined} target="_blank" rel="noreferrer" className={`p-2 rounded-lg bg-white/5 border border-white/5 hover:text-[#25D366] transition-colors ${!phoneNum ? "opacity-20 cursor-not-allowed" : ""}`}>
                                <MessageCircle className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openHistory(lead)} className="h-9 w-9 border border-white/5 text-gray-500 hover:text-white">
                                <History className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-9 px-4 bg-primary text-black font-bold text-xs rounded-lg hover:bg-primary/80 transition-all flex gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Guardando..." : "Guardar Gestión"}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
