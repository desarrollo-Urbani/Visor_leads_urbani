import React from "react";
import type { QuickActionType } from "../types/lead.types";

interface QuickActionsProps {
    activeAction: QuickActionType | "";
    onAction: (action: QuickActionType) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ activeAction, onAction }) => {
    return (
        <div className="flex flex-wrap gap-2">
            <button
                type="button"
                onClick={() => onAction("no_contesta")}
                className={`px-3 py-1.5 text-[12px] font-semibold border rounded-[10px] transition-all ${activeAction === "no_contesta"
                        ? "bg-[#b45309] text-white border-[#b45309] scale-105 shadow-md"
                        : "bg-[#fffbeb] text-[#b45309] border-[#fde68a] hover:bg-[#fef3c7]"
                    }`}
            >
                No contesta
            </button>
            <button
                type="button"
                onClick={() => onAction("numero_invalido")}
                className={`px-3 py-1.5 text-[12px] font-semibold border rounded-[10px] transition-all ${activeAction === "numero_invalido"
                        ? "bg-[#b91c1c] text-white border-[#b91c1c] scale-105 shadow-md"
                        : "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca] hover:bg-[#fee2e2]"
                    }`}
            >
                Número inválido
            </button>
            <button
                type="button"
                onClick={() => onAction("contactado")}
                className={`px-3 py-1.5 text-[12px] font-semibold border rounded-[10px] transition-all ${activeAction === "contactado"
                        ? "bg-[#15803d] text-white border-[#15803d] scale-105 shadow-md"
                        : "bg-[#ecfdf3] text-[#15803d] border-[#bbf7d0] hover:bg-[#dcfce7]"
                    }`}
            >
                Contactado
            </button>
            <button
                type="button"
                onClick={() => onAction("agendar_visita")}
                className={`px-3 py-1.5 text-[12px] font-semibold border rounded-[10px] transition-all ${activeAction === "agendar_visita"
                        ? "bg-[#1d4ed8] text-white border-[#1d4ed8] scale-105 shadow-md"
                        : "bg-[#eff6ff] text-[#1d4ed8] border-[#93c5fd] hover:bg-[#dbeafe]"
                    }`}
            >
                Agendar visita
            </button>
            <button
                type="button"
                onClick={() => onAction("perdido")}
                className={`px-3 py-1.5 text-[12px] font-semibold border rounded-[10px] transition-all ${activeAction === "perdido"
                        ? "bg-[#475569] text-white border-[#475569] scale-105 shadow-md"
                        : "bg-white text-[#475569] border-[#dfe6ef] hover:bg-[#f8fafc]"
                    }`}
            >
                Perdido
            </button>
        </div>
    );
};

export default QuickActions;
