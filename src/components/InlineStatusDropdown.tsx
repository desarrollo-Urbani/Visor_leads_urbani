import { useEffect, useRef, useState } from "react";
import type { Lead } from "@/types";
import { updateLeadStatus } from "@/lib/api";

const STATUSES = [
    { value: "Por Contactar", label: "📅 Por Contactar", color: "text-primary bg-primary/10 border-primary/30" },
    { value: "En Proceso", label: "🔄 En Proceso", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
    { value: "Visita", label: "🏠 Visita", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
    { value: "Contactado", label: "✅ Contactado", color: "text-green-400 bg-green-500/10 border-green-500/30" },
    { value: "No Efectivo", label: "❌ No Efectivo", color: "text-red-400 bg-red-500/10 border-red-500/30" },
    { value: "Venta Cerrada", label: "🏆 Venta Cerrada", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
];

interface InlineStatusDropdownProps {
    lead: Lead;
    userId: string;
    onUpdated: () => void;
}

export function InlineStatusDropdown({ lead, userId, onUpdated }: InlineStatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = async (newStatus: string) => {
        if (newStatus === lead.estado_gestion) { setOpen(false); return; }
        setSaving(true);
        setOpen(false);
        await updateLeadStatus(lead.id, newStatus, userId, "");
        setSaving(false);
        onUpdated();
    };

    const current = STATUSES.find(s => s.value === lead.estado_gestion);
    const colorClass = current?.color || "text-gray-400 bg-gray-500/10 border-gray-500/30";

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                disabled={saving}
                title="Clic para cambiar estado"
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer hover:opacity-80 active:scale-95 transition-all ${colorClass} ${saving ? 'opacity-50' : ''}`}
            >
                {saving ? "..." : (lead.estado_gestion === "No Gestionado" ? "🔲 No Gestionado" : current?.label || lead.estado_gestion)}
                <span className="ml-1 text-[8px] opacity-60">▼</span>
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden min-w-[180px]">
                    {STATUSES.map(s => (
                        <button
                            key={s.value}
                            onClick={() => handleSelect(s.value)}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-white/5 transition-colors ${s.value === lead.estado_gestion ? 'opacity-40 cursor-default' : ''} ${s.color.replace('bg-', 'hover:bg-').split(' ')[0]}`}
                        >
                            {s.label}
                            {s.value === lead.estado_gestion && <span className="ml-2 text-[9px] opacity-50">actual</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
