import { useState } from "react";
import { CheckSquare, X, Users } from "lucide-react";
import type { Lead, User } from "@/types";
import { updateLeadStatus, assignLead } from "@/lib/api";

const BULK_STATUSES = [
    { value: "Por Contactar", label: "📅 Por Contactar" },
    { value: "En Proceso", label: "🔄 En Proceso" },
    { value: "Visita", label: "🏠 Visita" },
    { value: "Contactado", label: "✅ Contactado" },
    { value: "No Efectivo", label: "❌ No Efectivo" },
    { value: "Venta Cerrada", label: "🏆 Venta Cerrada" },
];

interface BulkActionsBarProps {
    selectedIds: Set<string>;
    leads?: Lead[];
    users: User[];
    currentUserId: string;
    onClear: () => void;
    onDone: () => void;
}

export default function BulkActionsBar({ selectedIds, users, currentUserId, onClear, onDone }: BulkActionsBarProps) {
    const [saving, setSaving] = useState(false);

    if (selectedIds.size === 0) return null;

    const handleBulkStatus = async (status: string) => {
        setSaving(true);
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map(id => updateLeadStatus(id, status, currentUserId, "Actualización masiva")));
        setSaving(false);
        onClear();
        onDone();
    };

    const handleBulkAssign = async (userId: string) => {
        setSaving(true);
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map(id => assignLead(id, userId, currentUserId)));
        setSaving(false);
        onClear();
        onDone();
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-3 bg-[#1a1a1f]/95 backdrop-blur-xl border border-primary/30 rounded-2xl px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] shadow-primary/10">
                <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-black text-white">
                        {selectedIds.size} seleccionado{selectedIds.size > 1 ? "s" : ""}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-black uppercase">Estado:</span>
                    <select
                        disabled={saving}
                        className="h-8 bg-black/60 border border-white/10 rounded-lg text-xs text-white px-2 outline-none focus:border-primary/50 cursor-pointer"
                        defaultValue=""
                        onChange={e => { if (e.target.value) handleBulkStatus(e.target.value); }}
                    >
                        <option value="" disabled>Cambiar a...</option>
                        {BULK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Acción Masiva</span>
                </div>

                {users.filter(u => u.role === "ejecutivo" && u.activo).length > 0 && (
                    <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                        <Users className="h-3 w-3 text-gray-400" />
                        <select
                            disabled={saving}
                            className="h-8 bg-black/60 border border-white/10 rounded-lg text-xs text-white px-2 outline-none focus:border-primary/50 cursor-pointer"
                            defaultValue=""
                            onChange={e => { if (e.target.value) handleBulkAssign(e.target.value); }}
                        >
                            <option value="" disabled>Reasignar a...</option>
                            {users.filter(u => u.role === "ejecutivo" && u.activo).map(u =>
                                <option key={u.id} value={u.id}>{u.nombre}</option>
                            )}
                        </select>
                    </div>
                )}

                {saving && <span className="text-[10px] text-primary animate-pulse font-black">GUARDANDO...</span>}

                <button
                    onClick={onClear}
                    className="ml-2 h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
