import type { Lead } from "@/types";

interface MiniKPIsProps {
    leads: Lead[];
    userName?: string;
}

export default function MiniKPIs({ leads, userName }: MiniKPIsProps) {
    const total = leads.length;
    const noGestionado = leads.filter(l => l.estado_gestion === "No Gestionado").length;
    const gestionados = total - noGestionado;
    const ventasCerradas = leads.filter(l => l.estado_gestion === "Venta Cerrada").length;
    const porContactar = leads.filter(l => l.estado_gestion === "Por Contactar").length;

    const convRate = total > 0 ? ((ventasCerradas / total) * 100).toFixed(1) : "0";

    const kpis = [
        { label: "Mi Cartera", value: total, color: "text-white", bg: "bg-white/5", border: "border-white/10" },
        { label: "Pendientes", value: noGestionado, color: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-500/20" },
        { label: "Gestionados", value: gestionados, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
        { label: "Agendados", value: porContactar, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20" },
        { label: "Ventas", value: ventasCerradas, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
        { label: "Conversión", value: `${convRate}%`, color: "text-purple-400", bg: "bg-purple-500/5", border: "border-purple-500/20" },
    ];

    return (
        <div className="mb-8 p-4 rounded-2xl bg-[#18181b] border border-white/5 shadow-xl">
            {userName && (
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-3 px-1">
                    📊 Mi Resumen — {userName}
                </p>
            )}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {kpis.map(kpi => (
                    <div
                        key={kpi.label}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border ${kpi.bg} ${kpi.border} transition-all hover:scale-[1.03]`}
                    >
                        <span className={`text-2xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</span>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">{kpi.label}</span>
                    </div>
                ))}
            </div>
            {total > 0 && (
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700"
                        style={{ width: `${(gestionados / total) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
