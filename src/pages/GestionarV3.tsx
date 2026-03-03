import React, { useState, useEffect } from "react";
import LeadQueue from "../features/leads/components/LeadQueue";
import LeadDetail from "../features/leads/components/LeadDetail";
import ContactTimeline from "../features/leads/components/ContactTimeline";
import Toast from "../components/ui/Toast";
import type { ToastType } from "../components/ui/Toast";
import { useNavigate } from "react-router-dom";
import { useLeadQueue } from "../features/leads/hooks/useLeadQueue";
import { useLeadActions } from "../features/leads/hooks/useLeadActions";
import { fetchLeadHistory } from "../features/leads/services/leads.api";
import type { LeadHistoryEntry } from "../features/leads/types/lead.types";
import { Zap, Clock, CheckCircle, LogOut } from "lucide-react";
import { logout } from "../lib/api";

const GestionarV3: React.FC = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem("visor_user");
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const userId = currentUser?.id || "";
    const role = currentUser?.role || "ejecutivo";

    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const isAdmin = role === 'admin' || role === 'gerente' || role === 'subgerente';

    const {
        leads,
        loading: loadingQueue,
        selectedLeadId,
        selectedLead,
        filters,
        selectLead,
        nextLead,
        applyFilters,
        refreshQueue,
    } = useLeadQueue(userId, role);

    const {
        saving,
        error: actionError,
        formData,
        updateFormData,
        saveManagement,
        resetForm,
        setError: setActionError
    } = useLeadActions(userId, async () => {
        // Callback éxito: refrescar cola y pasar al siguiente
        setToast({ message: "Gestión guardada exitosamente", type: "success" });
        await refreshQueue();
        nextLead();
    });

    // Sincronizar errores de la acción con el Toast
    useEffect(() => {
        if (actionError) {
            setToast({ message: actionError, type: "error" });
            setActionError(null);
        }
    }, [actionError, setActionError]);

    const [history, setHistory] = useState<LeadHistoryEntry[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Cargar historial y REINICIAR formulario cuando cambia el lead seleccionado
    useEffect(() => {
        if (selectedLeadId) {
            resetForm(); // Limpiar rastro de gestiones anteriores
            setLoadingHistory(true);
            fetchLeadHistory(selectedLeadId)
                .then((data: any) => {
                    if (Array.isArray(data)) {
                        setHistory(data);
                    } else {
                        console.error("History data is not an array:", data);
                        setHistory([]);
                    }
                })
                .catch(err => {
                    console.error("Error fetching lead history:", err);
                    setHistory([]);
                })
                .finally(() => setLoadingHistory(false));
        } else {
            setHistory([]);
        }
    }, [selectedLeadId, resetForm]);

    // Cálculos Operativos (KPIs) dinámicos
    const totalLeads = leads.length;
    const managedLeads = leads.filter(l => l.estado_gestion !== 'No Gestionado').length;
    const contactability = totalLeads > 0 ? Math.round((managedLeads / totalLeads) * 100) : 0;

    // Calcular Renta Promedio (limpiando strings de moneda)
    const avgRenta = leads.length > 0
        ? leads.reduce((acc, lead) => {
            const val = typeof lead.renta === 'string'
                ? parseInt(lead.renta.replace(/[^0-9]/g, ''), 10)
                : Number(lead.renta);
            return acc + (isNaN(val) ? 0 : val);
        }, 0) / totalLeads
        : 0;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    };

    const handleSave = async () => {
        if (selectedLeadId) {
            await saveManagement(selectedLeadId);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="flex flex-col h-screen bg-[#f3f6fb] text-[#0f172a] font-sans">
            {/* Header / KPI Bar */}
            <header className="h-[56px] bg-[#0b1220] text-white flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/')}
                            className="text-[11px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors border border-white/10"
                        >
                            ← Volver al Monitor
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[#9acd32]" />
                        <strong className="text-[15px] tracking-tight">Visor Leads Urbani · <span className="text-[#9acd32]">Gestión V3</span></strong>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="bg-[#1e293b] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3 text-green-400" /> Gestionados {contactability}%
                    </div>
                    <div className="bg-[#1e293b] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#9acd32]/30">
                        <Zap className="h-3 w-3 text-[#9acd32]" /> Renta Prom. {formatCurrency(avgRenta)}
                    </div>
                    <div className="bg-[#1e293b] px-3 py-1 rounded-full text-[11px] font-bold border border-red-500/30 text-red-400">
                        Vencidos {leads.filter(l => l.vencido).length}
                    </div>
                    <div className="bg-[#1e293b] px-3 py-1 rounded-full text-[11px] font-bold border border-yellow-500/30 text-yellow-400">
                        Total {totalLeads}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-md transition-all border border-red-500/20 ml-2"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Salir</span>
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 grid grid-cols-[320px_minmax(600px,1fr)_360px] gap-3 p-3 min-h-0 overflow-hidden">
                {/* Columna 1: LeadQueue */}
                <LeadQueue
                    leads={leads}
                    loading={loadingQueue}
                    selectedId={selectedLeadId}
                    filters={filters}
                    onSelect={selectLead}
                    onFilterChange={applyFilters}
                />

                {/* Columna 2: LeadDetail + Actions */}
                <LeadDetail
                    lead={selectedLead}
                    formData={formData}
                    saving={saving}
                    onFormDataChange={updateFormData}
                    onSave={handleSave}
                />

                {/* Columna 3: ContactTimeline */}
                <ContactTimeline
                    history={history}
                    loading={loadingHistory}
                />
            </main>

            {/* Toasts */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default GestionarV3;

