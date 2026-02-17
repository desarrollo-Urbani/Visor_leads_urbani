import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getLeads, getUsers, uploadLeads, getDashboardSummary, updateLeadStatus, getLeadHistory, assignLead } from "@/lib/api";
import type { Lead, User } from "@/types";
import { Phone, MessageCircle, User as UserIcon, LayoutList, Upload, CheckSquare, Square, Search, History, Calendar, ChevronRight } from "lucide-react";
import MetricsDashboard from "@/components/MetricsDashboard";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Upload State
    const [showUpload, setShowUpload] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [allocations, setAllocations] = useState<Record<string, number>>({});
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState<{ count: number, eventId: string } | null>(null);

    // Dashboard Summary State
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Audit State
    const [showAudit, setShowAudit] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [historyLead, setHistoryLead] = useState<Lead | null>(null);
    const [leadHistoryData, setLeadHistoryData] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Management Modal State
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [managementNote, setManagementNote] = useState("");
    const [managementStatus, setManagementStatus] = useState("");
    const [managementDate, setManagementDate] = useState("");

    // Reassignment State
    const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);
    const [isReassigning, setIsReassigning] = useState(false);

    const loadSummary = async () => {
        setLoadingSummary(true);
        try {
            const data = await getDashboardSummary();
            setSummaryData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading summary:", err);
            setSummaryData([]);
        } finally {
            setLoadingSummary(false);
        }
    };


    useEffect(() => {
        if (currentUser?.role === 'admin') { // Check currentUser here as isAdmin might not be defined yet
            loadSummary();
        }
    }, [currentUser]); // Depend on currentUser to ensure it's set

    const refreshData = (user: User | null) => {
        setLoading(true);
        const userId = user?.id;
        const role = user?.role?.toLowerCase();

        Promise.all([
            getLeads(userId, role),
            getUsers()
        ])
            .then(([leadsData, usersData]) => {
                const normalizedLeads = (Array.isArray(leadsData) ? leadsData : []).map(l => ({
                    ...l,
                    estado_gestion: l.estado_gestion || 'No Gestionado'
                }));
                setLeads(normalizedLeads);
                setUsers(Array.isArray(usersData) ? usersData : []);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const stored = localStorage.getItem('visor_user');
        if (stored) {
            const user = JSON.parse(stored);
            setCurrentUser(user);
            refreshData(user);
        } else {
            window.location.href = '/login';
        }
    }, []);

    /* handleAssign removed */

    const handleUpload = async () => {
        if (!uploadFile) return alert("Selecciona un archivo CSV");
        const total = Object.values(allocations).reduce((a: number, b: number) => a + b, 0);
        if (total !== 100) return alert(`La suma de porcentajes debe ser exactamente 100% (Actual: ${total}%)`);

        setUploading(true);
        setUploadProgress(10);

        // Simulated progress while waiting for backend
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 5;
            });
        }, 800);

        try {
            const res = await uploadLeads(uploadFile, allocations, currentUser?.id || '');
            clearInterval(progressInterval);
            setUploadProgress(100);

            if (res.success) {
                // Extract count from message like "Imported 3299 leads successfully"
                const countMatch = res.message.match(/\d+/);
                const count = countMatch ? parseInt(countMatch[0]) : 0;

                setUploadSuccess({ count, eventId: res.eventId });
                setUploadFile(null);
                setAllocations({});
                refreshData(currentUser);
                if (currentUser?.role === 'admin') loadSummary();
            } else {
                alert("Error: " + (res.error || "Carga fallida"));
            }
        } catch (err) {
            clearInterval(progressInterval);
            console.error("Upload error:", err);
            alert("Error crítico durante la carga");
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const toggleExec = (userId: string) => {
        setAllocations(prev => {
            const next = { ...prev };
            if (next[userId] !== undefined) {
                delete next[userId];
            } else {
                next[userId] = 0;
            }
            return next;
        });
    };

    const handleReassign = async (leadId: string, newUserId: string) => {
        if (!currentUser) return;
        setIsReassigning(true);
        const success = await assignLead(leadId, newUserId, currentUser.id);
        if (success) {
            setReassignLeadId(null);
            refreshData(currentUser);
            if (isAdmin) loadSummary();
        } else {
            alert("Error al reasignar lead");
        }
        setIsReassigning(false);
    };

    const updateAllocation = (userId: string, value: number) => {
        setAllocations(prev => ({
            ...prev,
            [userId]: Math.max(0, Math.min(100, value))
        }));
    };

    const distributeEqually = () => {
        const ids = Object.keys(allocations);
        if (ids.length === 0) return;
        const base = Math.floor(100 / ids.length);
        const remainder = 100 % ids.length;
        const next: Record<string, number> = {};
        ids.forEach((id, i) => {
            next[id] = base + (i < remainder ? 1 : 0);
        });
        setAllocations(next);
    };

    const selectedExecs = Object.keys(allocations);
    const totalAllocated = Object.values(allocations).reduce((a: number, b: number) => a + b, 0);

    if (loading) return <div className="p-10 text-center">Cargando datos...</div>;

    const isAdmin = currentUser?.role === 'admin';

    // Status Badge Color Logic
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'No Gestionado': return 'bg-gray-200 text-gray-800';
            case 'En Proceso': return 'bg-blue-100 text-blue-800';
            case 'Visita': return 'bg-purple-100 text-purple-800';
            case 'No Efectivo': return 'bg-red-100 text-red-800';
            case 'Contactado': return 'bg-green-100 text-green-800';
            case 'Venta Cerrada': return 'bg-green-600 text-white';
            case 'Por Contactar': return 'bg-primary/20 text-primary border-primary/30';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Management Modal State
    const openManagement = (lead: Lead) => {
        setSelectedLead(lead);
        setManagementStatus(lead.estado_gestion);
        setManagementNote(lead.notas || "");
        setManagementDate(lead.fecha_proximo_contacto || "");
    };

    const closeManagement = () => {
        setSelectedLead(null);
        setManagementNote("");
        setManagementStatus("");
        setManagementDate("");
    };

    const handleLogout = () => {
        if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            localStorage.removeItem('visor_user');
            window.location.href = '/login';
        }
    };

    const goBack = () => {
        setShowUpload(false);
        setShowAudit(false);
    };

    const isSubView = showUpload || showAudit;

    const openHistory = async (lead: Lead) => {
        setHistoryLead(lead);
        setLoadingHistory(true);
        try {
            const history = await getLeadHistory(lead.id);
            setLeadHistoryData(history);
        } catch (err) {
            console.error("Error loading history:", err);
            setLeadHistoryData([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const saveManagement = async () => {
        if (!selectedLead || !currentUser) return;

        // Validation: If current is 'No Gestionado', must change
        if (selectedLead.estado_gestion === 'No Gestionado' && managementStatus === 'No Gestionado') {
            return alert("Debes cambiar el estado para gestionar el lead.");
        }

        if (managementStatus === 'Por Contactar' && !managementDate) {
            return alert("Debes seleccionar una fecha y hora para agendar el contacto.");
        }

        const success = await updateLeadStatus(selectedLead.id, managementStatus, currentUser.id, managementNote, managementDate);

        if (success) {
            refreshData(currentUser);
            closeManagement();
        } else {
            alert("Error al actualizar gestión");
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 relative font-sans">
            {/* Background Gradient Accents */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-10 left-10 w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Modal Overlay */}
            {selectedLead && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-[#18181b] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Gestionar Lead: {selectedLead.nombre}
                            </CardTitle>
                            <CardDescription className="text-gray-400">Actualiza el estado y agrega notas de seguimiento.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-300 ml-1">Estado del Lead</label>
                                <select
                                    className="w-full h-11 px-3 bg-black/40 border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                                    value={managementStatus}
                                    onChange={(e) => setManagementStatus(e.target.value)}
                                >
                                    <option value="No Gestionado" disabled>No Gestionado</option>
                                    <option value="Por Contactar">📅 Por Contactar / Agendar</option>
                                    <option value="En Proceso">En Proceso</option>
                                    <option value="Visita">Visita</option>
                                    <option value="No Efectivo">No Efectivo</option>
                                    <option value="Venta Cerrada">Venta Cerrada</option>
                                </select>
                            </div>

                            {managementStatus === 'Por Contactar' && (
                                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300 p-4 bg-primary/10 border border-primary/20 rounded-2xl ring-4 ring-primary/5">
                                    <label className="text-sm font-bold text-primary flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> AGENDAR PRÓXIMO CONTACTO
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full h-12 px-4 bg-black/60 border-primary/30 rounded-xl text-white font-bold focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        value={managementDate}
                                        onChange={(e) => setManagementDate(e.target.value)}
                                    />
                                    <p className="text-[10px] text-primary/70 font-semibold uppercase tracking-wider">Aparecerá como recordatorio en tu pantalla principal.</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-300 ml-1">Notas / Bitácora</label>
                                <textarea
                                    className="w-full p-4 bg-black/40 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none min-h-[120px]"
                                    placeholder="Detalles de la llamada o visita..."
                                    value={managementNote}
                                    onChange={(e) => setManagementNote(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="ghost" className="flex-1 h-11 rounded-xl text-gray-400 hover:text-white hover:bg-white/5" onClick={closeManagement}>
                                    Cancelar
                                </Button>
                                <Button className="flex-1 h-11 rounded-xl bg-primary hover:bg-[#a3e635] text-black font-bold shadow-lg shadow-primary/20" onClick={saveManagement}>
                                    Guardar Cambios
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center ring-1 ring-primary/30">
                        <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            {isAdmin ? 'Panel de Administración' : 'Mi Gestión Comercial'}
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">
                            Conectado como <span className="text-primary">{currentUser?.nombre}</span>
                            <span className="ml-2 px-2 py-0.5 bg-white/5 rounded-full text-[10px] uppercase tracking-wider border border-white/5">{currentUser?.role}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {isSubView && (
                        <Button
                            variant="ghost"
                            onClick={goBack}
                            className="bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 px-4 group"
                        >
                            <LayoutList className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" /> Volver
                        </Button>
                    )}

                    {isAdmin && !isSubView && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setShowUpload(true)}
                                className="bg-[#18181b] border-white/10 text-white hover:bg-white/5 rounded-xl h-10 px-4"
                            >
                                <Upload className="mr-2 h-4 w-4 text-primary" /> Carga Masiva
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowAudit(true)}
                                className="bg-[#18181b] border-white/10 text-white hover:bg-white/5 rounded-xl h-10 px-4"
                            >
                                <History className="mr-2 h-4 w-4 text-primary" /> Auditoría de Leads
                            </Button>
                        </>
                    )}

                    <Button
                        onClick={handleLogout}
                        className="bg-transparent hover:bg-red-500/10 text-red-500 hover:text-red-400 border border-red-500/20 rounded-xl h-10 px-4 transition-all"
                    >
                        Cerrar Sesión
                    </Button>
                </div>
            </header>

            {/* Upload Section */}
            {showUpload && isAdmin && (
                <Card className="mb-8 border-primary/20 bg-primary/5 rounded-2xl relative z-10 overflow-hidden ring-1 ring-primary/20">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-white">Importar Nuevos Leads</CardTitle>
                        <CardDescription className="text-gray-400">Distribución inteligente de cartera comercial vía CSV.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-gray-300 block">1. Archivo de Origen</label>
                                <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-black/40 hover:border-primary/50 transition-colors cursor-pointer relative group">
                                    <Input
                                        type="file"
                                        accept=".csv"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    />
                                    <Upload className="h-8 w-8 text-primary/40 mb-2 group-hover:text-primary transition-colors pointer-events-none relative z-10" />
                                    <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors pointer-events-none relative z-10">
                                        {uploadFile ? uploadFile.name : "Soltar CSV aquí o hacer clic"}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-300 block">2. Seleccionar Ejecutivos y %</label>
                                    <div className="flex items-center gap-3">
                                        {selectedExecs.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                type="button"
                                                onClick={distributeEqually}
                                                className="h-7 px-2 text-[10px] uppercase font-bold text-primary/60 hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg"
                                            >
                                                Repartir Equitativamente
                                            </Button>
                                        )}
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${totalAllocated === 100 ? 'bg-primary/20 text-primary border-primary/30' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                            TOTAL: {totalAllocated}%
                                        </span>
                                    </div>
                                </div>

                                {selectedExecs.length > 0 && totalAllocated !== 100 && (
                                    <div className={`p-2 rounded-lg text-center text-[11px] font-bold animate-in fade-in slide-in-from-top-1 ${totalAllocated > 100 ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]'}`}>
                                        {totalAllocated > 100
                                            ? `⚠️ Exceso detectado: Sobra un ${totalAllocated - 100}%`
                                            : `⚠️ Pendiente por asignar: Falta un ${100 - totalAllocated}%`
                                        }
                                    </div>
                                )}
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {users.filter(u => u.role !== 'admin').map(u => {
                                        const isSelected = allocations[u.id] !== undefined;
                                        return (
                                            <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${isSelected ? 'bg-primary/5 border-primary/30 shadow-[0_4px_12px_rgba(0,0,0,0.1)]' : 'bg-black/20 border-white/5 opacity-60'}`}>
                                                <button
                                                    onClick={() => toggleExec(u.id)}
                                                    className={`flex items-center gap-3 flex-1 text-left`}
                                                >
                                                    {isSelected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-gray-500" />}
                                                    <span className={`font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{u.nombre}</span>
                                                </button>
                                                {isSelected && (
                                                    <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1 border border-white/10">
                                                        <input
                                                            type="number"
                                                            value={allocations[u.id]}
                                                            onChange={(e) => updateAllocation(u.id, parseInt(e.target.value) || 0)}
                                                            className="w-12 bg-transparent text-center font-mono font-bold text-primary outline-none"
                                                            min="0"
                                                            max="100"
                                                        />
                                                        <span className="text-xs font-bold text-gray-500">%</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                            {uploading && (
                                <div className="w-full space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-primary/70">
                                        <span>Procesando Bases de Datos...</span>
                                        <span>{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-primary shadow-[0_0_10px_rgba(132,204,22,0.5)] transition-all duration-500 ease-out"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowUpload(false)}
                                    disabled={uploading}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading || !uploadFile || selectedExecs.length === 0 || totalAllocated !== 100}
                                    className="bg-primary hover:bg-[#a3e635] disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-400 text-black font-bold h-11 px-8 rounded-xl shadow-[0_0_15px_rgba(132,204,22,0.2)]"
                                >
                                    {uploading ? "Sincronizando..." : "Iniciar Carga Masiva"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Success Notification Modal */}
            {uploadSuccess && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm bg-[#121212] border-primary/30 shadow-[0_0_40px_rgba(132,204,22,0.1)] rounded-3xl overflow-hidden text-center p-8 border-2">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                            <Upload className="h-10 w-10 text-primary animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">¡Carga Exitosa!</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Se han procesado y asignado <span className="text-primary font-bold">{uploadSuccess.count} leads</span> correctamente en la base de datos.
                        </p>
                        <Button
                            className="w-full bg-primary hover:bg-[#a3e635] text-black font-bold py-6 rounded-2xl"
                            onClick={() => {
                                setUploadSuccess(null);
                                setShowUpload(false);
                            }}
                        >
                            Ver Resultados
                        </Button>
                    </Card>
                </div>
            )}

            {isAdmin ? (
                <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {!showAudit ? (
                        <>
                            <MetricsDashboard leads={leads} />
                            <Card className="bg-[#18181b] border-white/5 shadow-xl rounded-2xl overflow-hidden ring-1 ring-white/5">
                                <CardHeader className="bg-white/[0.02] py-6 px-8 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                            Productividad por Ejecutivo
                                        </CardTitle>
                                        <CardDescription className="text-gray-500 font-medium">Resumen de leads asignados y estados de gestión.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-white/[0.03] text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
                                                <tr>
                                                    <th className="px-8 py-5">Ejecutivo Comercial</th>
                                                    <th className="px-8 py-5">Asignados</th>
                                                    <th className="px-8 py-5 text-orange-500">Sin Gestión</th>
                                                    <th className="px-8 py-5 text-primary">Por Contactar</th>
                                                    <th className="px-8 py-5 text-blue-500">En Proceso</th>
                                                    <th className="px-8 py-5 text-purple-500">Visitas</th>
                                                    <th className="px-8 py-5 text-primary">Ventas</th>
                                                    <th className="px-8 py-5">Ratio Conversión</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 bg-transparent">
                                                {loadingSummary ? (
                                                    <tr><td colSpan={7} className="px-8 py-16 text-center text-gray-500 italic">Actualizando métricas...</td></tr>
                                                ) : summaryData.map((row) => (
                                                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                                                        <td className="px-8 py-6 font-semibold text-white">{row.nombre}</td>
                                                        <td className="px-8 py-6 font-mono text-gray-400">{row.total_assigned}</td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-2 py-1 rounded-lg text-xs ${row.no_gestionado > 0 ? 'bg-orange-500/10 text-orange-500 font-bold' : 'bg-white/5 text-gray-600'}`}>
                                                                {row.no_gestionado}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-primary/80 font-medium">{row.por_contactar || 0}</td>
                                                        <td className="px-8 py-6 text-blue-500/80 font-medium">{row.en_proceso}</td>
                                                        <td className="px-8 py-6 text-purple-500/80 font-medium">{row.visita}</td>
                                                        <td className="px-8 py-6 text-primary font-bold">{row.venta_cerrada}</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[80px] ring-1 ring-white/5">
                                                                    <div
                                                                        className="h-full bg-primary shadow-[0_0_8px_rgba(132,204,22,0.4)]"
                                                                        style={{ width: `${row.total_assigned > 0 ? (row.venta_cerrada / row.total_assigned * 100) : 0}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[11px] font-mono text-primary font-bold">
                                                                    {row.total_assigned > 0 ? (row.venta_cerrada / row.total_assigned * 100).toFixed(0) : 0}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="bg-[#18181b] border-white/5 shadow-xl rounded-2xl overflow-hidden ring-1 ring-white/5">
                            <CardHeader className="bg-white/[0.02] py-6 px-8 space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                            Auditoría de Leads
                                        </CardTitle>
                                        <CardDescription className="text-gray-500 font-medium">Búsqueda detallada e historial de gestiones.</CardDescription>
                                    </div>
                                    <div className="relative w-full sm:w-80">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <Input
                                            placeholder="Buscar por nombre, email o ejecutivo..."
                                            className="pl-10 bg-black/40 border-white/10 rounded-xl focus:ring-primary/40 focus:border-primary"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white/[0.03] text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
                                            <tr>
                                                <th className="px-8 py-5">Prospecto</th>
                                                <th className="px-8 py-5">Ejecutivo</th>
                                                <th className="px-8 py-5">Proyecto</th>
                                                <th className="px-8 py-5">Estado Actual</th>
                                                <th className="px-8 py-5 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-transparent">
                                            {leads
                                                .filter(l =>
                                                    l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    (l.nombre_ejecutivo || '').toLowerCase().includes(searchTerm.toLowerCase())
                                                )
                                                .map((lead) => (
                                                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                                                        <td className="px-8 py-6">
                                                            <div className="font-semibold text-white">{lead.nombre}</div>
                                                            <div className="text-[11px] text-gray-500 font-mono">{lead.email}</div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-2 text-gray-300">
                                                                <UserIcon className="h-3 w-3 text-primary/60" />
                                                                {lead.nombre_ejecutivo || 'Sin Asignar'}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-gray-400 font-medium">{lead.proyecto}</td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(lead.estado_gestion)} border border-white/5`}>
                                                                {lead.estado_gestion}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openHistory(lead)}
                                                                    className="h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 font-bold border border-white/10 transition-all text-xs"
                                                                >
                                                                    <History className="h-3 w-3 mr-2" /> Historial
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setReassignLeadId(lead.id)}
                                                                    className="h-8 rounded-lg bg-primary/5 hover:bg-primary/20 text-primary font-bold border border-primary/10 transition-all text-xs"
                                                                >
                                                                    <UserIcon className="h-3 w-3 mr-2" /> Reasignar
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <div className="space-y-10 relative z-10 animate-in fade-in duration-700">
                    {/* Status Summary Row (Executive) */}
                    <div className="flex flex-wrap gap-4 overflow-x-auto pb-2 custom-scrollbar">
                        {["No Gestionado", "Por Contactar", "En Proceso", "Visita", "No Efectivo", "Venta Cerrada"].map((status) => {
                            const count = leads.filter(l => l.estado_gestion === status).length;
                            return (
                                <div key={status} className="flex-none bg-[#18181b]/40 border border-white/5 px-5 py-3 rounded-2xl flex flex-col items-center min-w-[120px]">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{status}</span>
                                    <span className={`text-xl font-black ${count > 0 ? 'text-white' : 'text-gray-700'}`}>{count}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Priority Follow-ups Section */}
                    {leads.filter(l => l.estado_gestion === 'Por Contactar').length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-primary flex items-center gap-3 italic">
                                    <Calendar className="h-6 w-6" /> COMPROMISOS AGENDADOS
                                </h2>
                                <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] text-primary font-bold">
                                    {leads.filter(l => l.estado_gestion === 'Por Contactar').length} PENDIENTES
                                </span>
                            </div>

                            <div className="grid gap-6">
                                {/* Today Group */}
                                {(() => {
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    const todayLeads = leads
                                        .filter(l => l.estado_gestion === 'Por Contactar' && (l.fecha_proximo_contacto || '').startsWith(todayStr))
                                        .sort((a, b) => new Date(a.fecha_proximo_contacto || '').getTime() - new Date(b.fecha_proximo_contacto || '').getTime());

                                    if (todayLeads.length === 0) return null;

                                    return (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-red-500">
                                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                <span className="text-xs font-black uppercase tracking-widest">URGENTES PARA HOY</span>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {todayLeads.map((lead) => (
                                                    <Card key={lead.id} className="bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] rounded-2xl overflow-hidden ring-2 ring-red-500/20">
                                                        <CardContent className="p-5 flex flex-col justify-between h-full">
                                                            <div>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex flex-col">
                                                                        <h3 className="font-bold text-white text-base leading-tight">{lead.nombre}</h3>
                                                                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter">CONTACTAR AHORA</span>
                                                                    </div>
                                                                    <span className="text-[11px] bg-red-500 text-white font-black px-3 py-1 rounded-full flex items-center gap-1">
                                                                        {new Date(lead.fecha_proximo_contacto || '').toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-400 mb-4 line-clamp-1 opacity-70 italic">{lead.email}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => openManagement(lead)}
                                                                    className="w-full h-10 rounded-xl bg-red-500 text-white font-black hover:bg-red-400 transition-all border-none shadow-lg shadow-red-500/20"
                                                                >
                                                                    Gestionar Urgente
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Upcoming Group */}
                                {(() => {
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    const upcomingLeads = leads
                                        .filter(l => l.estado_gestion === 'Por Contactar' && !(l.fecha_proximo_contacto || '').startsWith(todayStr))
                                        .sort((a, b) => new Date(a.fecha_proximo_contacto || '').getTime() - new Date(b.fecha_proximo_contacto || '').getTime());

                                    if (upcomingLeads.length === 0) return null;

                                    return (
                                        <div className="space-y-4">
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">PRÓXIMOS DÍAS</span>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {upcomingLeads.map((lead) => (
                                                    <Card key={lead.id} className="bg-primary/5 border-primary/20 shadow-lg shadow-primary/5 rounded-2xl overflow-hidden ring-1 ring-primary/20 hover:ring-primary/40 transition-all">
                                                        <CardContent className="p-5 flex flex-col justify-between h-full">
                                                            <div>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h3 className="font-bold text-white text-base">{lead.nombre}</h3>
                                                                    <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/30">
                                                                        {new Date(lead.fecha_proximo_contacto || '').toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-400 mb-4 line-clamp-1">{lead.email}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => openManagement(lead)}
                                                                    className="w-full h-9 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary hover:text-black transition-all border border-primary/20"
                                                                >
                                                                    Ver Agendamiento
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <h2 className="text-xl font-black text-white flex items-center gap-3 italic">
                            <LayoutList className="h-6 w-6 text-gray-500" /> TODA TU CARTERA
                        </h2>
                        {Array.isArray(leads) && leads.length === 0 && (
                            <div className="col-span-3 text-center py-20 bg-[#18181b]/30 border border-white/5 rounded-3xl text-gray-500">
                                <div className="mb-4 opacity-20 flex justify-center"><LayoutList className="h-12 w-12" /></div>
                                No hay leads asignados a tu cuenta actualmente.
                            </div>
                        )}
                        {Array.isArray(leads) && leads.map((lead) => (
                            <Card key={lead.id} className="group hover:scale-[1.02] transition-all duration-300 bg-[#18181b] border-white/5 hover:border-primary/30 shadow-xl rounded-2xl overflow-hidden ring-1 ring-white/5">
                                <CardHeader className="pb-4 bg-white/[0.01]">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-2">
                                            <CardTitle className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate">{lead.nombre}</CardTitle>
                                            <CardDescription className="text-gray-500 truncate">{lead.email}</CardDescription>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(lead.estado_gestion)} border border-white/5`}>
                                            {lead.estado_gestion}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-between pt-2">
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-gray-500 font-medium">Renta Declarada</span>
                                            <span className="font-bold text-white">${lead.renta}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-500 font-medium">Asignación</span>
                                            <span className="text-gray-300 font-mono text-xs">{new Date(lead.fecha_registro).toLocaleDateString('es-CL')}</span>
                                        </div>

                                        {lead.fecha_proximo_contacto && (
                                            <div className="flex justify-between items-center py-2 px-3 bg-primary/5 border border-primary/10 rounded-xl">
                                                <span className="text-primary font-black text-[10px] uppercase tracking-wider">Próximo Contacto</span>
                                                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3 text-primary" />
                                                    {new Date(lead.fecha_proximo_contacto).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}

                                        {/* Exec Name Display */}
                                        <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest pt-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                                    <UserIcon className="h-2.5 w-2.5" />
                                                </div>
                                                {lead.nombre_ejecutivo || 'Sin Asignar'}
                                            </div>
                                            {lead.contact_event_id && <span className="text-primary/60 border border-primary/20 px-1 rounded" title="Carga Masiva">MASIVA</span>}
                                        </div>

                                        <div className="flex justify-between items-center pt-5 gap-3">
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-primary bg-primary/5 hover:bg-primary/20 border border-primary/10 rounded-xl transition-all">
                                                    <Phone className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-400 bg-blue-400/5 hover:bg-blue-400/20 border border-blue-400/10 rounded-xl transition-all">
                                                    <MessageCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => openManagement(lead)}
                                                className="h-9 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition-all"
                                            >
                                                Gestionar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            {/* History Modal */}
            {historyLead && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <Card className="w-full max-w-2xl bg-[#18181b] border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <CardHeader className="border-b border-white/5 pb-4 shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                                        <History className="h-5 w-5 text-primary" /> Historial de {historyLead.nombre}
                                    </CardTitle>
                                    <CardDescription className="text-gray-400">Trazabilidad de gestiones y cambios de estado.</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setHistoryLead(null)} className="h-8 w-8 text-gray-500 hover:text-white">
                                    <LayoutList className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-y-auto custom-scrollbar py-6">
                            {loadingHistory ? (
                                <div className="text-center py-10 text-gray-500 italic">Cargando historial...</div>
                            ) : leadHistoryData.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 italic">No hay registros históricos para este lead.</div>
                            ) : (
                                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-white/5 before:to-transparent">
                                    {leadHistoryData.map((entry, idx) => (
                                        <div key={entry.id} className="relative flex items-start gap-6 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="absolute left-0 mt-1.5 w-10 h-10 rounded-full bg-black border-2 border-primary/40 flex items-center justify-center z-10 shadow-[0_0_10px_rgba(163,230,53,0.2)]">
                                                <Calendar className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="ml-14 flex-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                            {new Date(entry.changed_at).toLocaleString('es-CL')}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-white">
                                                            <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(entry.new_status).includes('green') ? 'bg-primary' : 'bg-blue-400'}`} />
                                                            {entry.new_status}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                        <UserIcon className="h-3 w-3 text-primary/40" />
                                                        {entry.changed_by_name || 'Sistema'}
                                                    </div>
                                                </div>
                                                {entry.notes && (
                                                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl text-sm text-gray-300 leading-relaxed italic relative">
                                                        <div className="absolute -left-1.5 top-3 w-3 h-3 bg-[#18181b] border-l border-t border-white/5 rotate-[-45deg]" />
                                                        "{entry.notes}"
                                                    </div>
                                                )}
                                                {entry.old_status !== entry.new_status && !entry.notes && (
                                                    <div className="text-[11px] text-gray-500 italic flex items-center gap-1">
                                                        Cambio de estado: <span className="line-through">{entry.old_status}</span> <ChevronRight className="h-2 w-2" /> <span className="text-gray-400">{entry.new_status}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <div className="p-4 border-t border-white/5 shrink-0 bg-white/[0.01]">
                            <Button className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10" onClick={() => setHistoryLead(null)}>
                                Cerrar Historial
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Reassignment Modal */}
            {reassignLeadId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                    <Card className="w-full max-w-sm bg-[#18181b] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-xl font-bold text-white">Reasignar Lead</CardTitle>
                            <CardDescription className="text-gray-400">Selecciona el nuevo ejecutivo comercial.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid gap-2">
                                {users.filter(u => u.role !== 'admin').map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => handleReassign(reassignLeadId, u.id)}
                                        disabled={isReassigning}
                                        className="flex items-center justify-between p-4 bg-white/5 hover:bg-primary/20 border border-white/5 hover:border-primary/40 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <UserIcon className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="font-bold text-gray-200 group-hover:text-white">{u.nombre}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-primary transition-colors" />
                                    </button>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full text-gray-500 hover:text-white"
                                onClick={() => setReassignLeadId(null)}
                            >
                                Cancelar
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
