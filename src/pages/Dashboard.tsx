import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getUsers, uploadLeads, getDashboardSummary, updateLeadStatus, getLeadHistory, assignLead, getContactEvents, downloadCsv, deleteContactEvent, getAdminUsers, createAdminUser, updateAdminUser, resetAdminUserPassword, purgeLeads, logout } from "@/lib/api";
import type { Lead, User } from "@/types";
import { User as UserIcon, LayoutList, Upload, CheckSquare, Square, Search, History, Calendar, ChevronRight, Download, Clock, BarChart2, Trash2, UserPlus, X, RefreshCw, Edit, Power, Phone, Bot } from "lucide-react";
import MetricsDashboard from "@/components/MetricsDashboard";
import { Input } from "@/components/ui/input";
import BulkActionsBar from "@/components/BulkActionsBar";
import LeadCard from "@/components/LeadCard";
import ExecutiveDashboard from "@/components/ExecutiveDashboard";

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

    // Audit Advanced Filters
    const [filterEjecutivo, setFilterEjecutivo] = useState("");
    const [filterJefe, setFilterJefe] = useState("");

    // Main Lead Filters  (initialized from localStorage for persistence)
    const [filterProyectoLead, setFilterProyectoLead] = useState<string>(() => {
        try { return JSON.parse(localStorage.getItem('visor_filters') || '{}').proyecto ?? ''; } catch { return ''; }
    });
    const [filterStatusLead, setFilterStatusLead] = useState<string>(() => {
        try { return JSON.parse(localStorage.getItem('visor_filters') || '{}').status ?? ''; } catch { return ''; }
    });
    const [filterQualityLead, setFilterQualityLead] = useState<string>(() => {
        try { return JSON.parse(localStorage.getItem('visor_filters') || '{}').quality ?? ''; } catch { return ''; }
    });

    // Reassignment State
    const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);
    const [isReassigning, setIsReassigning] = useState(false);

    // Campaigns View State
    const [showCampaigns, setShowCampaigns] = useState(false);
    const [campaignsData, setCampaignsData] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);

    // User Management State
    const [showUsersAdmin, setShowUsersAdmin] = useState(false);
    const [adminUsersList, setAdminUsersList] = useState<User[]>([]);
    const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState({ nombre: '', email: '', role: 'ejecutivo', password: '', jefe_id: '', company_id: 'Urbani' });
    const [bulkUserFile, setBulkUserFile] = useState<File | null>(null);
    const [uploadingUsers, setUploadingUsers] = useState(false);

    // === NEW UX: Bulk selection ===
    const [viewMode, setViewMode] = useState<'dashboard' | 'gestionar'>('dashboard');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);


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

    const loadCampaigns = async () => {
        setLoadingCampaigns(true);
        try {
            const data = await getContactEvents();
            setCampaignsData(data);
        } catch (err) {
            console.error("Error loading campaigns:", err);
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const loadAdminUsers = async () => {
        setLoadingAdminUsers(true);
        try {
            const data = await getAdminUsers();
            setAdminUsersList(data);
        } catch (err) {
            console.error("Error loading admin users:", err);
        } finally {
            setLoadingAdminUsers(false);
        }
    };

    const handleToggleUserStatus = async (user: User) => {
        const res = await updateAdminUser(user.id, { activo: !user.activo });
        if (res && !('error' in res)) loadAdminUsers();
        else alert("Error al cambiar estado de usuario");
    };

    const handleSaveUser = async () => {
        if (!userForm.nombre || !userForm.email) return alert("Nombre y email obligatorios");

        let res;
        if (editingUser) {
            res = await updateAdminUser(editingUser.id, userForm);
        } else {
            if (!userForm.password) return alert("Contraseña obligatoria para nuevos usuarios");
            res = await createAdminUser(userForm);
        }

        if (res && !('error' in res)) {
            setShowUserModal(false);
            setEditingUser(null);
            setUserForm({ nombre: '', email: '', role: 'ejecutivo', password: '', jefe_id: '', company_id: 'Urbani' });
            loadAdminUsers();
        } else {
            alert("Error: " + ('error' in res ? res.error : "Operación fallida"));
        }
    };

    const handleResetPassword = async (userId: string) => {
        const newPass = window.prompt("Ingresa la nueva contraseña:");
        if (newPass) {
            const success = await resetAdminUserPassword(userId, newPass);
            if (success) alert("Contraseña actualizada");
            else alert("Error al actualizar contraseña");
        }
    };

    const handleBulkUserUpload = async () => {
        if (!bulkUserFile) return alert("Selecciona un archivo CSV de usuarios");
        setUploadingUsers(true);
        const formData = new FormData();
        formData.append('file', bulkUserFile);
        try {
            const response = await fetch('/api/admin/users/bulk-upload', {
                method: 'POST',
                body: formData
            });
            const res = await response.json();
            if (res.success) {
                alert(`¡Éxito! Se han importado ${res.count} usuarios.`);
                setBulkUserFile(null);
                loadAdminUsers();
            } else {
                alert("Error: " + res.error);
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión");
        } finally {
            setUploadingUsers(false);
        }
    };


    useEffect(() => {
        if (currentUser?.role === 'admin') {
            loadSummary();
            loadAdminUsers(); // Ensure admin users list is also loaded
        }
    }, [currentUser]);

    const refreshData = (user: User | null) => {
        setLoading(true);
        const userId = user?.id;
        const role = user?.role?.toLowerCase();

        const filters = {
            ejecutivo_id: filterEjecutivo,
            jefe_id: filterJefe,
        };

        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (role) params.append('role', role);
        Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });

        Promise.all([
            fetch(`/api/leads?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('visor_token') || ''}` }
            }).then(r => r.json()),
            getUsers()
        ])
            .then(([leadsResponse, usersData]) => {
                // Handle both paginated {data, total} and legacy array response
                const rawLeads = Array.isArray(leadsResponse) ? leadsResponse : (leadsResponse?.data || []);
                const normalizedLeads = rawLeads.map((l: any) => ({
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
            try {
                const user = JSON.parse(stored);
                if (user && user.id) {
                    setCurrentUser(user);
                    refreshData(user);
                } else {
                    localStorage.removeItem('visor_user');
                    window.location.href = '/login';
                }
            } catch (e) {
                console.error("Session parse error:", e);
                localStorage.removeItem('visor_user');
                window.location.href = '/login';
            }
        } else {
            window.location.href = '/login';
        }
    }, []);

    // Persist lead filters whenever they change
    useEffect(() => {
        localStorage.setItem('visor_filters', JSON.stringify({
            proyecto: filterProyectoLead,
            status: filterStatusLead,
            quality: filterQualityLead,
        }));
    }, [filterProyectoLead, filterStatusLead, filterQualityLead]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedLead(null);
                setHistoryLead(null);
                setReassignLeadId(null);
                setShowUpload(false);
                setShowUserModal(false);
                setSelectedIds(new Set());
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    /* handleAssign removed */

    const handleUpload = async () => {
        if (!uploadFile) return alert("Selecciona un archivo CSV");
        const total = Object.values(allocations).reduce((a: number, b: number) => a + b, 0) as number;
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
                const count = res.count || 0;
                setUploadSuccess({ count, eventId: res.eventId || '' });
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
    const totalAllocated = Object.values(allocations).reduce((a: number, b: number) => a + b, 0) as number;

    const isAdmin = currentUser?.role === 'admin';

    if (loading) return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white p-10">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-xl font-bold tracking-tight">Cargando datos...</p>
            </div>
        </div>
    );

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
        const confirmLogout = window.confirm("¿Estás seguro de que deseas salir del sistema? Tendrás que volver a iniciar sesión para ingresar.");
        if (confirmLogout) {
            logout(); // Clears both visor_token and visor_user from localStorage
            window.location.href = '/login';
        }
    };

    const goBack = () => {
        setShowUpload(false);
        setShowAudit(false);
        setShowCampaigns(false);
        setShowUsersAdmin(false);
    };




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

    const handleDeleteCampaign = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este registro de carga?")) {
            const success = await deleteContactEvent(id);
            if (success) {
                loadCampaigns();
            } else {
                alert("Error al eliminar la carga");
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0d0d0f] text-white font-sans selection:bg-primary/30">
            {/* Sidebar Lateral */}
            <aside className="w-72 bg-[#09090b] border-r border-white/5 flex flex-col fixed inset-y-0 z-40 p-8">
                <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={goBack}>
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 group-hover:bg-primary/30 transition-all">
                        <LayoutList className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tighter leading-none text-white italic">Lead Console</h1>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sales Enterprise v3</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        className={`w-full justify-start h-12 rounded-2xl font-black ${(!showAudit && !showCampaigns && !showUsersAdmin) ? 'bg-primary/10 text-primary border border-primary/10 hover:bg-primary/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutList className="mr-3 h-5 w-5" /> Dashboard
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => { goBack(); setViewMode('gestionar'); }}
                        className={`w-full justify-start h-12 rounded-2xl font-bold ${viewMode === 'gestionar' && !showCampaigns && !showUsersAdmin ? 'bg-primary/10 text-primary border border-primary/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <History className="mr-3 h-5 w-5" /> Gestionar
                    </Button>

                    {isAdmin && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => { goBack(); setShowCampaigns(true); loadCampaigns(); }}
                                className={`w-full justify-start h-12 rounded-2xl font-bold ${showCampaigns ? 'bg-primary/10 text-primary border border-primary/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <BarChart2 className="mr-3 h-5 w-5" /> Campañas/Cargas
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => { goBack(); setShowUsersAdmin(true); loadAdminUsers(); }}
                                className={`w-full justify-start h-12 rounded-2xl font-bold ${showUsersAdmin ? 'bg-primary/10 text-primary border border-primary/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <UserIcon className="mr-3 h-5 w-5" /> Configuración Usuarios
                            </Button>
                        </>
                    )}
                </nav>

                <div className="pt-8 border-t border-white/5 space-y-4">
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Sistema</div>
                    {isAdmin && (
                        <div className="space-y-4">
                            <Button
                                onClick={() => setShowUpload(true)}
                                className="w-full h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black hover:bg-primary hover:text-black transition-all shadow-lg shadow-primary/5 mt-4"
                            >
                                + Cargar Leads
                            </Button>
                            <Button
                                onClick={async () => {
                                    if (confirm("⚠️ ¿ESTÁS SEGURO? Esta acción borrará TODOS los leads, campañas e historiales del sistema. Esta acción es irreversible.")) {
                                        try {
                                            const success = await purgeLeads();
                                            if (success) {
                                                alert("Base de datos limpiada correctamente.");
                                                window.location.reload();
                                            } else {
                                                alert("Error al purgar los datos.");
                                            }
                                        } catch (error) {
                                            console.error("Purge Error:", error);
                                            alert("Error de comunicación con el servidor.");
                                        }
                                    }
                                }}
                                variant="ghost"
                                className="w-full h-10 rounded-xl text-red-500/40 hover:text-red-400 hover:bg-red-500/5 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Trash2 className="mr-2 h-3 w-3" /> Borrar Todo
                            </Button>
                        </div>
                    )}
                    <Button
                        onClick={handleLogout}
                        className="w-full h-10 rounded-xl text-red-500/60 hover:text-red-400 hover:bg-red-500/5 text-xs font-bold transition-all"
                    >
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <main className="flex-1 ml-72 p-12 bg-gradient-to-br from-[#0d0d0f] to-[#09090b]">
                {/* Background Gradient Accents */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
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

                {/* Search Bar & User Profile */}
                <div className="flex items-center justify-between mb-12 gap-8 sticky top-0 z-30 bg-[#0d0d0f]/80 backdrop-blur-xl p-4 -m-4 rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex-1 max-w-2xl relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar leads, proyectos o etiquetas..."
                            className="w-full h-14 pl-12 pr-4 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-primary/20 focus:border-primary/40 transition-all text-lg font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="block text-sm font-black text-white">{currentUser?.nombre}</span>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">{currentUser?.role} Lead</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center p-0.5 shadow-xl">
                            <div className="w-full h-full rounded-xl bg-[#161618] flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

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
                                        <span className="text-[11px] font-bold text-gray-400 group-hover:text-primary transition-colors pointer-events-none relative z-10 truncate w-[240px] px-2 text-center overflow-hidden text-ellipsis">
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
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {adminUsersList.filter(u => u.role !== 'admin' && u.activo).map(u => {
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

                {showCampaigns ? (
                    <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {showCampaigns ? (
                            <Card className="bg-[#18181b] border-white/5 shadow-xl rounded-2xl overflow-hidden ring-1 ring-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <CardHeader className="bg-white/[0.02] py-6 px-8 border-b border-white/5">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-black">
                                                Historial de Cargas y Campañas
                                            </CardTitle>
                                            <CardDescription className="text-gray-500 font-medium">Resumen detallado de importaciones y rendimiento de bases.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] text-primary font-black uppercase tracking-widest">{campaignsData.length} CARGAS</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-white/5">
                                        {loadingCampaigns ? (
                                            <div className="p-20 text-center text-gray-500 italic">Cargando historial de campañas...</div>
                                        ) : campaignsData.length === 0 ? (
                                            <div className="p-20 text-center text-gray-500 italic text-sm">No se han registrado cargas masivas aún.</div>
                                        ) : campaignsData.map((campaign) => (
                                            <div key={campaign.id} className="p-6 hover:bg-white/[0.02] transition-all group">
                                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                                                <BarChart2 className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors tracking-tight">
                                                                {campaign.description}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px] text-gray-500 font-bold uppercase tracking-tighter">
                                                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(campaign.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                                                            <span className="text-gray-400">ID: {String(campaign.id)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-8 lg:gap-12 bg-black/20 p-4 rounded-2xl border border-white/5">
                                                        <div className="text-center">
                                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Destinatarios</p>
                                                            <p className="text-xl font-black text-white">{campaign.total_leads}</p>
                                                            <p className="text-[10px] text-gray-600 font-bold">100%</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[9px] text-primary/60 font-black uppercase tracking-widest mb-1">Cestión</p>
                                                            <p className="text-xl font-black text-primary">{campaign.processed_leads}</p>
                                                            <p className="text-[10px] text-primary/40 font-bold">
                                                                {campaign.total_leads > 0 ? (campaign.processed_leads / campaign.total_leads * 100).toFixed(1) : 0}%
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[9px] text-blue-500/60 font-black uppercase tracking-widest mb-1">Ventas</p>
                                                            <p className="text-xl font-black text-blue-500">{campaign.sales}</p>
                                                            <p className="text-[10px] text-blue-500/40 font-bold">
                                                                {campaign.total_leads > 0 ? (campaign.sales / campaign.total_leads * 100).toFixed(1) : 0}%
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 w-full lg:w-auto">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => downloadCsv(String(campaign.id), `Carga_${String(campaign.id)}.csv`)}
                                                            disabled={!campaign.has_file}
                                                            className="flex-1 lg:flex-none h-11 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 group/btn"
                                                        >
                                                            <Download className={`h-4 w-4 mr-2 ${campaign.has_file ? 'text-primary' : 'text-gray-600'} group-hover/btn:scale-110 transition-transform`} />
                                                            {campaign.has_file ? 'Descargar Original' : 'Sin Archivo'}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handleDeleteCampaign(String(campaign.id))}
                                                            className="flex-none h-11 w-11 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all"
                                                            title="Eliminar Carga"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : showUsersAdmin ? (
                            <div className="space-y-8 relative z-10">
                                <Card className="bg-[#18181b] border-white/5 shadow-xl rounded-2xl overflow-hidden ring-1 ring-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <CardHeader className="bg-white/[0.02] py-6 px-8 border-b border-white/5">
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div>
                                                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                                    Gestión de Accesos y Usuarios
                                                </CardTitle>
                                                <CardDescription className="text-gray-500">Control de permisos jerárquicos y carga masiva.</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex bg-black/20 p-1.5 rounded-xl border border-white/5">
                                                    <Input
                                                        type="file"
                                                        accept=".csv"
                                                        onChange={(e) => setBulkUserFile(e.target.files?.[0] || null)}
                                                        className="w-48 bg-transparent border-none text-[10px] h-8"
                                                    />
                                                    <Button
                                                        onClick={handleBulkUserUpload}
                                                        disabled={uploadingUsers || !bulkUserFile}
                                                        className="h-8 px-4 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 text-[10px] font-black uppercase rounded-lg"
                                                    >
                                                        {uploadingUsers ? "Sincronizando..." : "Carga Masiva de Usuarios"}
                                                    </Button>
                                                </div>
                                                <Button
                                                    onClick={() => { setEditingUser(null); setUserForm({ nombre: '', email: '', role: 'ejecutivo', password: '', jefe_id: '', company_id: 'Urbani' }); setShowUserModal(true); }}
                                                    className="bg-primary hover:bg-[#a3e635] text-black font-black h-11 px-6 rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.2)]"
                                                >
                                                    <UserPlus className="mr-2 h-4 w-4" /> Nuevo Usuario
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-white/[0.03] text-gray-500 uppercase text-[9px] font-black tracking-widest border-b border-white/5">
                                                    <tr>
                                                        <th className="px-8 py-5">Nombre / Email</th>
                                                        <th className="px-8 py-5">Rol / Nivel</th>
                                                        <th className="px-8 py-5">Reporta A</th>
                                                        <th className="px-8 py-5">Password Reset</th>
                                                        <th className="px-8 py-5">Estado</th>
                                                        <th className="px-8 py-5 text-right">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {loadingAdminUsers ? (
                                                        <tr><td colSpan={6} className="p-20 text-center text-gray-500 italic">Cargando usuarios...</td></tr>
                                                    ) : adminUsersList.map(u => (
                                                        <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                                                            <td className="px-8 py-4">
                                                                <div className="font-bold text-white">{u.nombre}</div>
                                                                <div className="text-[10px] text-gray-500 font-mono">{u.email}</div>
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-400'}`}>
                                                                    {u.role}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-4 text-xs text-gray-400 font-medium">
                                                                {adminUsersList.find(boss => boss.id === u.jefe_id)?.nombre || "—"}
                                                            </td>
                                                            <td className="px-8 py-4 text-xs">
                                                                {(u as any).must_reset_password ? (
                                                                    <span className="text-orange-500 font-bold flex items-center gap-1">
                                                                        <RefreshCw className="h-3 w-3" /> Pendiente
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-600">Al día</span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                <div className={`flex items-center gap-1.5 ${u.activo ? 'text-green-500' : 'text-gray-600'}`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} />
                                                                    <span className="text-[10px] font-black uppercase">{u.activo ? 'Activo' : 'Baja'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4 text-right space-x-2">
                                                                <Button variant="ghost" size="sm" onClick={() => handleResetPassword(u.id)} className="h-8 w-8 p-0 hover:bg-orange-500/10 hover:text-orange-500">
                                                                    <RefreshCw className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => { setEditingUser(u); setUserForm({ id: u.id, nombre: u.nombre, email: u.email, role: u.role, password: '', jefe_id: u.jefe_id || '', company_id: 'Urbani' } as any); setShowUserModal(true); }} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleToggleUserStatus(u)} className={`h-8 w-8 p-0 ${u.activo ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-green-500/10 hover:text-green-500'}`}>
                                                                    <Power className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
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
                        )}
                    </div>
                ) : (
                    <>
                        {/* Unified Dashboard View for ALL Users (Admins & Executives) */}


                        {/* Executive Header with Pending Indicator (Replaces Tabs) */}
                        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-6">
                                <h2 className="text-3xl font-black text-white tracking-tighter">Gestión de Leads</h2>
                                {/* Pending Leads Indicator */}
                                <div className="flex items-center gap-3 px-5 py-2.5 bg-orange-500/10 rounded-full border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] animate-pulse">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-black text-orange-500 tracking-wide">
                                        {leads.filter(l => l.estado_gestion === 'No Gestionado').length} PENDIENTES
                                    </span>
                                </div>
                            </div>

                            {/* User Profile Summary */}
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-white leading-none mb-1">{currentUser?.nombre}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{currentUser?.role}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 ring-2 ring-black">
                                    <span className="font-bold text-primary text-sm">{currentUser?.nombre?.charAt(0)}</span>
                                </div>
                            </div>
                        </div>

                        {viewMode === 'dashboard' ? (
                            <>
                                {isAdmin && (
                                    <div className="mb-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
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
                                    </div>
                                )}
                                <ExecutiveDashboard
                                    leads={leads}
                                    currentUser={currentUser}
                                    onOpenManagement={openManagement}
                                />
                            </>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                {/* Daily Summary Bar */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-6 rounded-[2rem] backdrop-blur-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                                <Phone className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Contactar Hoy</p>
                                                <p className="text-2xl font-black text-white leading-none">
                                                    {leads.filter(l => {
                                                        if (l.estado_gestion !== 'Por Contactar' || !l.fecha_proximo_contacto) return false;
                                                        const todayStr = new Date().toISOString().split('T')[0];
                                                        return l.fecha_proximo_contacto.startsWith(todayStr);
                                                    }).length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] backdrop-blur-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                <Clock className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pendientes</p>
                                                <p className="text-2xl font-black text-white leading-none">
                                                    {leads.filter(l => l.estado_gestion === 'No Gestionado').length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] backdrop-blur-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <CheckSquare className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">En Proceso</p>
                                                <p className="text-2xl font-black text-white leading-none">
                                                    {leads.filter(l => l.estado_gestion === 'En Proceso').length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] backdrop-blur-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Bot className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vía Prosper AI</p>
                                                <p className="text-2xl font-black text-white leading-none">
                                                    {leads.filter(l => l.es_ia).length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dedicated Filter Bar */}
                                <div className="flex flex-wrap items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-sm mb-8">
                                    {/* Admin/Manager Filters */}
                                    {(currentUser?.role === 'admin' || currentUser?.role === 'gerente' || currentUser?.role === 'subgerente') && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Filtrar por Ejecutivo</label>
                                                <select
                                                    className="h-12 bg-black/40 border border-white/10 rounded-xl text-xs text-white px-4 outline-none focus:border-primary/50 min-w-[200px] hover:bg-black/60 transition-colors cursor-pointer"
                                                    value={filterEjecutivo}
                                                    onChange={(e) => setFilterEjecutivo(e.target.value)}
                                                >
                                                    <option value="">Todos los Ejecutivos</option>
                                                    {users.filter(u => u.role === 'ejecutivo').map(u => (
                                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-px h-10 bg-white/5 hidden md:block" />
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Filtrar por Jefe</label>
                                                <select
                                                    className="h-12 bg-black/40 border border-white/10 rounded-xl text-xs text-white px-4 outline-none focus:border-primary/50 min-w-[200px] hover:bg-black/60 transition-colors cursor-pointer"
                                                    value={filterJefe}
                                                    onChange={(e) => setFilterJefe(e.target.value)}
                                                >
                                                    <option value="">Todos los Jefes</option>
                                                    {users.filter(u => u.role === 'gerente' || u.role === 'subgerente').map(u => (
                                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-px h-10 bg-white/5 hidden md:block" />
                                        </>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Filtro por Proyecto</label>
                                        <select
                                            className="h-12 bg-black/40 border border-white/10 rounded-xl text-xs text-white px-4 outline-none focus:border-primary/50 min-w-[200px] hover:bg-black/60 transition-colors cursor-pointer"
                                            value={filterProyectoLead}
                                            onChange={(e) => setFilterProyectoLead(e.target.value)}
                                        >
                                            <option value="">Todos los Proyectos</option>
                                            {Array.from(new Set(leads.map(l => l.proyecto))).filter(Boolean).sort().map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="w-px h-10 bg-white/5 hidden md:block" />

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Estado de Gestión</label>
                                        <select
                                            className="h-12 bg-black/40 border border-white/10 rounded-xl text-xs text-white px-4 outline-none focus:border-primary/50 min-w-[200px] hover:bg-black/60 transition-colors cursor-pointer"
                                            value={filterStatusLead}
                                            onChange={(e) => setFilterStatusLead(e.target.value)}
                                        >
                                            <option value="">Todos los Estados</option>
                                            <option value="No Gestionado">No Gestionado</option>
                                            <option value="En Proceso">En Proceso</option>
                                            <option value="Visita">Visita</option>
                                            <option value="Por Contactar">Por Contactar</option>
                                            <option value="Venta Cerrada">Venta Cerrada</option>
                                        </select>
                                    </div>

                                    <div className="w-px h-10 bg-white/5 hidden md:block" />

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Calidad IA</label>
                                        <select
                                            className="h-12 bg-black/40 border border-white/10 rounded-xl text-xs text-white px-4 outline-none focus:border-primary/50 min-w-[200px] hover:bg-black/60 transition-colors cursor-pointer"
                                            value={filterQualityLead}
                                            onChange={(e) => setFilterQualityLead(e.target.value)}
                                        >
                                            <option value="">Cualquier Calidad</option>
                                            <option value="hot">🔥 Hot Lead</option>
                                            <option value="ia">🤖 Data IA</option>
                                        </select>
                                    </div>

                                    <div className="flex-1" />

                                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                                        <span className="text-[10px] font-black text-primary uppercase">Leads: {leads.filter(l => {
                                            const searchLower = searchTerm.toLowerCase();
                                            const matchesSearch = l.nombre.toLowerCase().includes(searchLower) || (l.email || '').toLowerCase().includes(searchLower);
                                            const matchesProyecto = !filterProyectoLead || l.proyecto === filterProyectoLead;
                                            const matchesStatus = !filterStatusLead || l.estado_gestion === filterStatusLead;
                                            const matchesQuality = !filterQualityLead || (filterQualityLead === 'hot' && l.es_caliente) || (filterQualityLead === 'ia' && l.es_ia);
                                            return matchesSearch && matchesProyecto && matchesStatus && matchesQuality;
                                        }).length}</span>
                                    </div>
                                </div>

                                {/* Lead Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                                    {Array.isArray(leads) && leads.length === 0 && (
                                        <div className="col-span-full py-40 flex flex-col items-center justify-center bg-[#1a1d23]/40 border-4 border-dashed border-white/5 rounded-[4rem] group hover:border-primary/20 transition-all duration-700">
                                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                                <LayoutList className="w-10 h-10 text-gray-700 group-hover:text-primary/40 transition-colors" />
                                            </div>
                                            <h3 className="text-3xl font-black text-gray-700 group-hover:text-gray-600 transition-colors tracking-tighter uppercase mb-4">Base de Datos Vacía</h3>
                                            <p className="text-sm font-bold text-gray-500/40 uppercase tracking-[0.3em]">No hay leads registrados en el sistema</p>
                                        </div>
                                    )}
                                    {Array.isArray(leads) && leads
                                        .filter(l => {
                                            const searchLower = searchTerm.toLowerCase();
                                            const matchesSearch = (l.nombre || '').toLowerCase().includes(searchLower) ||
                                                (l.email || '').toLowerCase().includes(searchLower) ||
                                                (l.apellido || '').toLowerCase().includes(searchLower) ||
                                                (l.proyecto || '').toLowerCase().includes(searchLower);

                                            const matchesProyecto = !filterProyectoLead || l.proyecto === filterProyectoLead;
                                            const matchesStatus = !filterStatusLead || l.estado_gestion === filterStatusLead;
                                            const matchesQuality = !filterQualityLead ||
                                                (filterQualityLead === 'hot' && l.es_caliente) ||
                                                (filterQualityLead === 'ia' && l.es_ia);

                                            return matchesSearch && matchesProyecto && matchesStatus && matchesQuality;
                                        })
                                        .map((lead) => (
                                            <LeadCard
                                                key={lead.id}
                                                lead={lead}
                                                currentUser={currentUser}
                                                isSelected={selectedIds.has(lead.id)}
                                                toggleSelect={toggleSelect}
                                                openManagement={openManagement}
                                                openHistory={openHistory}
                                                refreshData={() => refreshData(currentUser)}
                                            />
                                        ))}
                                    {Array.isArray(leads) && leads.length > 0 && leads.filter(l => {
                                        const searchLower = searchTerm.toLowerCase();
                                        const matchesSearch = (l.nombre || '').toLowerCase().includes(searchLower) ||
                                            (l.email || '').toLowerCase().includes(searchLower) ||
                                            (l.apellido || '').toLowerCase().includes(searchLower) ||
                                            (l.proyecto || '').toLowerCase().includes(searchLower);
                                        const matchesProyecto = !filterProyectoLead || l.proyecto === filterProyectoLead;
                                        const matchesStatus = !filterStatusLead || l.estado_gestion === filterStatusLead;
                                        const matchesQuality = !filterQualityLead || (filterQualityLead === 'hot' && l.es_caliente) || (filterQualityLead === 'ia' && l.es_ia);
                                        return matchesSearch && matchesProyecto && matchesStatus && matchesQuality;
                                    }).length === 0 && (
                                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                    <Search className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-lg font-bold text-gray-400">No se encontraron leads con estos filtros.</p>
                                                <Button variant="link" onClick={() => { setSearchTerm(''); setFilterProyectoLead(''); setFilterStatusLead(''); setFilterQualityLead(''); }} className="text-primary">
                                                    Limpiar Filtros
                                                </Button>
                                            </div>
                                        )}
                                </div>

                                {/* Bulk Actions Floating Bar */}
                                <BulkActionsBar
                                    selectedIds={selectedIds}
                                    users={users}
                                    currentUserId={currentUser?.id || ''}
                                    onClear={() => setSelectedIds(new Set())}
                                    onDone={() => refreshData(currentUser)}
                                />
                            </div>
                        )}
                    </>

                )}
            </main>

            {/* History Modal */}
            {
                historyLead && (
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
                                        <X className="h-4 w-4" />
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
                                                                {new Date(entry.created_at || entry.changed_at).toLocaleString('es-CL')}
                                                            </span>
                                                            <div className="flex items-center gap-2 text-[11px] font-bold text-white">
                                                                <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(entry.estado_nuevo || entry.new_status).includes('green') ? 'bg-primary' : 'bg-blue-400'}`} />
                                                                {entry.estado_nuevo || entry.new_status}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                            <UserIcon className="h-3 w-3 text-primary/40" />
                                                            {entry.changed_by_name || 'Sistema'}
                                                        </div>
                                                    </div>
                                                    {(entry.comentario || entry.notes) && (
                                                        <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl text-sm text-gray-300 leading-relaxed italic relative">
                                                            <div className="absolute -left-1.5 top-3 w-3 h-3 bg-[#18181b] border-l border-t border-white/5 rotate-[-45deg]" />
                                                            "{entry.comentario || entry.notes}"
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
                )
            }

            {/* Reassignment Modal */}
            {
                reassignLeadId && (
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
                )
            }

            {/* User Modal */}
            {
                showUserModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                        <Card className="w-full max-w-md bg-[#121212] border-white/10 shadow-2xl rounded-3xl overflow-hidden border-2">
                            <CardHeader className="bg-white/[0.02] p-8 border-b border-white/5 text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                    <UserPlus className="h-8 w-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl font-black text-white">
                                    {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre Completo</label>
                                    <Input
                                        className="bg-white/5 border-white/10 h-12 rounded-xl text-white focus:ring-primary focus:border-primary"
                                        placeholder="Ej: Juan Pérez"
                                        value={userForm.nombre}
                                        onChange={e => setUserForm({ ...userForm, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Correo Electrónico</label>
                                    <Input
                                        className="bg-white/5 border-white/10 h-12 rounded-xl text-white focus:ring-primary focus:border-primary"
                                        placeholder="email@urbani.cl"
                                        type="email"
                                        value={userForm.email}
                                        onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Rol de Usuario</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 h-12 rounded-xl text-white px-4 focus:ring-primary focus:border-primary outline-none"
                                        value={userForm.role}
                                        onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                    >
                                        <option value="ejecutivo" className="bg-[#121212]">Ejecutivo Comercial (Lvl 4)</option>
                                        <option value="subgerente" className="bg-[#121212]">Subgerente Supervisión (Lvl 3)</option>
                                        <option value="gerente" className="bg-[#121212]">Gerente de Ventas (Lvl 2)</option>
                                        <option value="admin" className="bg-[#121212]">Administrador Global (Lvl 1)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Reporta a (Superior)</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 h-12 rounded-xl text-white px-4 focus:ring-primary focus:border-primary outline-none"
                                        value={userForm.jefe_id}
                                        onChange={e => setUserForm({ ...userForm, jefe_id: e.target.value })}
                                    >
                                        <option value="" className="bg-[#121212]">Sin Superior (Independiente)</option>
                                        {adminUsersList.filter(u => u.id !== editingUser?.id).map(u => (
                                            <option key={u.id} value={u.id} className="bg-[#121212]">{u.nombre} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                                {!editingUser && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Contraseña Inicial</label>
                                        <Input
                                            className="bg-white/5 border-white/10 h-12 rounded-xl text-white focus:ring-primary focus:border-primary"
                                            placeholder="••••••••"
                                            type="password"
                                            value={userForm.password}
                                            onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                        />
                                        <p className="text-[10px] text-gray-600 italic ml-1">El usuario podrá cambiarla después.</p>
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-8 pt-0 flex gap-4">
                                <Button variant="ghost" onClick={() => setShowUserModal(false)} className="flex-1 h-12 text-gray-400 hover:text-white rounded-xl">
                                    Cancelar
                                </Button>
                                <Button onClick={handleSaveUser} className="flex-1 h-12 bg-primary hover:bg-[#a3e635] text-black font-black rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.2)]">
                                    {editingUser ? "Guardar Cambios" : "Crear Acceso"}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )
            }
        </div >
    );
}
