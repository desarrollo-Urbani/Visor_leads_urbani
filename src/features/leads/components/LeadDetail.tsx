import React from "react";
import type { LeadQueueItem } from "../types/lead.types";
import QuickActions from "./QuickActions";
import { Phone, MessageSquare, Mail } from "lucide-react";

interface LeadDetailProps {
    lead: LeadQueueItem | null;
    formData: any;
    saving: boolean;
    onFormDataChange: (data: any) => void;
    onSave: () => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({
    lead,
    formData,
    saving,
    onFormDataChange,
    onSave,
}) => {
    if (!lead) {
        return (
            <section className="bg-white border border-[#dfe6ef] rounded-xl flex items-center justify-center p-20 shadow-sm overflow-hidden h-full">
                <p className="text-[#64748b] italic text-[14px]">Selecciona un lead de la cola para gestionar.</p>
            </section>
        );
    }

    const steps = ["Nuevo", "P. contacto", "Contactado", "No contactable", "Agendado", "Cerrado"];
    const currentStepIndex = 1; // Demo mode, in real it should be derived from lead.estado_gestion

    const getLocalDateString = (offsetHours = 0) => {
        const d = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleQuickAction = (action: any) => {
        const mapping: Record<string, any> = {
            no_contesta: {
                motivo: "No responde",
                proximaAccion: "Llamar",
                fechaProximoContacto: getLocalDateString(2), // +2h local
                nota: "Intento de contacto fallido. Se reintenta en 2 horas."
            },
            numero_invalido: {
                motivo: "Teléfono inválido",
                proximaAccion: "",
                fechaProximoContacto: "",
                nota: "Número de teléfono no existe o está fuera de servicio."
            },
            contactado: {
                motivo: "Interesado",
                proximaAccion: "Email",
                fechaProximoContacto: getLocalDateString(24), // +24h local
                nota: "Lead contactado, se envía información por correo."
            },
            agendar_visita: {
                motivo: "Agendado",
                proximaAccion: "Visita",
                fechaProximoContacto: getLocalDateString(48), // +48h local
                nota: "Visita agendada para revisar proyecto en sala de ventas."
            },
            perdido: {
                motivo: "No califica",
                proximaAccion: "",
                fechaProximoContacto: "",
                nota: "Lead no cumple con perfil de renta o financiamiento."
            }
        };

        const config = mapping[action] || {};
        onFormDataChange({
            action,
            ...config
        });
    };

    return (
        <section className="bg-white border border-[#dfe6ef] rounded-xl flex flex-col min-h-0 shadow-sm overflow-hidden h-full">
            <div className="p-3 border-b border-[#dfe6ef]">
                <h2 className="text-sm font-bold m-0 text-[15px]">LeadDetail + QuickActions</h2>
                <p className="text-[12px] text-[#64748b] font-medium m-0">Flujo operativo para gestión en &lt;30s</p>
            </div>

            <div className="p-3 border-b border-[#dfe6ef] bg-[#f8fafc]">
                <div className="grid grid-cols-6 gap-1">
                    {steps.map((step, i) => (
                        <div
                            key={step}
                            className={`text-[9px] p-2 border rounded-lg text-center font-medium ${i === currentStepIndex
                                ? "bg-[#dbeafe] border-[#93c5fd] text-[#1d4ed8] font-bold"
                                : "bg-white border-[#dfe6ef] text-[#64748b]"
                                }`}
                        >
                            {step}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="p-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-3.5 text-[14px] border-b border-[#dfe6ef]">
                    <div className="text-[#64748b]">Proyecto</div>
                    <div className="font-semibold">{lead.proyecto || "N/A"}</div>

                    <div className="text-[#64748b] flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Teléfono</div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{lead.telefono || "Sin fono"}</span>
                        <button
                            onClick={() => handleQuickAction("contactado")}
                            className="px-2 py-0.5 text-[12px] border border-[#dfe6ef] rounded-md hover:bg-[#f1f5f9]"
                        >
                            Llamar
                        </button>
                        <button
                            onClick={() => handleQuickAction("contactado")}
                            className="px-2 py-0.5 text-[12px] border border-[#dfe6ef] rounded-md hover:bg-[#f1f5f9] flex items-center gap-1"
                        >
                            <MessageSquare className="h-3 w-3" /> WhatsApp
                        </button>
                    </div>

                    <div className="text-[#64748b] flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[200px]">{lead.email}</span>
                        <button
                            onClick={() => handleQuickAction("contactado")}
                            className="px-2 py-0.5 text-[12px] border border-[#dfe6ef] rounded-md hover:bg-[#f1f5f9]"
                        >
                            Correo
                        </button>
                    </div>

                    <div className="text-[#64748b]">Clasificación</div>
                    <div>
                        {lead.clasificacion ? (
                            <span className={`px-2 py-0.5 rounded-lg text-[12px] font-bold border ${lead.clasificacion === 'Caliente' ? 'bg-red-50 border-red-200 text-red-700' :
                                lead.clasificacion === 'Tibio' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                    lead.clasificacion === 'Frio' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                        'bg-[#f8fafc] border-[#dfe6ef] text-[#64748b]'
                                }`}>
                                {lead.clasificacion === 'Caliente' ? '🔥 ' : lead.clasificacion === 'Tibio' ? '🌤️ ' : lead.clasificacion === 'Frio' ? '❄️ ' : ''}
                                {lead.clasificacion}
                            </span>
                        ) : (
                            <span className="text-gray-400 italic text-[12px]">Sin Clasificación</span>
                        )}
                    </div>

                    <div className="text-[#64748b]">Renta</div>
                    <div className="font-semibold">{lead.renta || "$ --"}</div>

                    <div className="text-[#64748b]">Observación</div>
                    <div className="text-[13px] leading-relaxed text-[#1e293b]">
                        {lead.observacion || "Sin observaciones previas."}
                    </div>
                </div>

                <div className="p-4 border-b border-[#dfe6ef]">
                    <strong className="text-[14px] block mb-2 font-bold uppercase tracking-tight text-[#0f172a]">QuickActions <span className="text-red-500">*</span></strong>
                    <QuickActions
                        activeAction={formData.action}
                        onAction={handleQuickAction}
                    />
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[12px] font-bold text-[#64748b] block mb-1 uppercase">Motivo <span className="text-red-500">*</span></label>
                            <select
                                className="w-full text-[13px] p-2 border border-[#dfe6ef] rounded-[8px] outline-none"
                                value={formData.motivo}
                                onChange={(e) => onFormDataChange({ motivo: e.target.value })}
                            >
                                <option value="">Seleccionar</option>
                                <option value="No responde">No responde</option>
                                <option value="Teléfono inválido">Teléfono inválido</option>
                                <option value="Interesado">Interesado</option>
                                <option value="Agendado">Agendado</option>
                                <option value="No califica">No califica</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-[#64748b] block mb-1 uppercase">
                                Próxima acción {(formData.action === "no_contesta" || formData.action === "agendar_visita") && <span className="text-red-500">*</span>}
                            </label>
                            <select
                                className="w-full text-[13px] p-2 border border-[#dfe6ef] rounded-[8px] outline-none"
                                value={formData.proximaAccion}
                                onChange={(e) => onFormDataChange({ proximaAccion: e.target.value })}
                            >
                                <option value="">Ninguna</option>
                                <option value="Llamar">Llamar</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Email">Email</option>
                                <option value="Visita">Visita</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-[#64748b] block mb-1 uppercase">
                                Fecha/hora {(formData.action === "no_contesta" || formData.action === "agendar_visita" || formData.proximaAccion !== "") && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="datetime-local"
                                className="w-full text-[13px] p-1.5 border border-[#dfe6ef] rounded-[8px] outline-none"
                                value={formData.fechaProximoContacto}
                                onChange={(e) => onFormDataChange({ fechaProximoContacto: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-[#64748b] block mb-1 uppercase">Nota rápida (req.) <span className="text-red-500">*</span></label>
                        <textarea
                            rows={3}
                            placeholder="Ej: pidió llamada mañana 18:30; evaluar subsidio."
                            className="w-full text-[13px] p-2 border border-[#dfe6ef] rounded-[8px] outline-none resize-none"
                            value={formData.nota}
                            onChange={(e) => onFormDataChange({ nota: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="p-3 border-t border-[#dfe6ef] flex justify-between items-center bg-white">
                <span className="text-[12px] text-[#64748b] italic">Control de flujo V3.0</span>
                <button
                    onClick={onSave}
                    disabled={
                        saving ||
                        !formData.motivo ||
                        !formData.action ||
                        !formData.nota ||
                        ((formData.action === "no_contesta" || formData.action === "agendar_visita") && (!formData.proximaAccion || !formData.fechaProximoContacto)) ||
                        (formData.proximaAccion !== "" && !formData.fechaProximoContacto)
                    }
                    className="bg-[#1d4ed8] text-white px-5 py-2 rounded-[10px] text-[14px] font-bold shadow-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                    {saving ? "Guardando..." : "Guardar + Siguiente lead"}
                </button>
            </div>
        </section>
    );
};

export default LeadDetail;
