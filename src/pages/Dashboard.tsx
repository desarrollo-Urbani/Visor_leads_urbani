import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getUsers, uploadLeads, updateLeadStatus, getLeadHistory, assignLead, getContactEvents, downloadCsv, deleteContactEvent, getAdminUsers, createAdminUser, updateAdminUser, resetAdminUserPassword, purgeLeads, logout } from "@/lib/api";
import type { Lead, User } from "@/types";
import { User as UserIcon, LayoutList, Upload, CheckSquare, Square, Search, History, Calendar, ChevronRight, Download, Clock, BarChart2, Trash2, UserPlus, X, RefreshCw, Edit, Power, Phone, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import BulkActionsBar from "@/components/BulkActionsBar";
import LeadCard from "@/components/LeadCard";
import MetricsDashboard from "@/components/MetricsDashboard";

export default function Dashboard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // View States
    const [showUpload, setShowUpload] = useState(false);
    const [showCampaigns, setShowCampaigns] = useState(false);
    const [showUsersAdmin, setShowUsersAdmin] = useState(false);
    const [showAudit, _setShowAudit] = useState(false); // Deprecated but kept for compatibility if needed

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProyectoLead, setFilterProyectoLead] = useState<string>(() => {
        try { return JSON.parse(localStorage.getItem('visor_filters') || '{}').proyecto ?? ''; } catch { return ''; }
    });
    const [filterStatusLead, setFilterStatusLead] = useState<string>(() => {
        try { return JSON.parse(localStorage.getItem('visor_filters') || '{}').status ?? ''; } catch { return ''; }
    });
    const [filterQualityLead, setFilterQualityLead] = useState<string>(() => {
        try { return JSON.parse(localStorage.getItem('visor_filters') || '{}').quality ?? ''; } catch { return ''; }
    });
    const [filterEjecutivo, setFilterEjecutivo] = useState("");
    const [filterJefe, setFilterJefe] = useState("");

    // History & Reassign
    const [historyLead, setHistoryLead] = useState<Lead | null>(null);
    const [leadHistoryData, setLeadHistoryData] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);
    const [isReassigning, setIsReassigning] = useState(false);

    // Admin/Upload Specific
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [allocations, setAllocations] = useState<Record<string, number>>({});
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState<{ count: number, eventId: string } | null>(null);
    const [campaignsData, setCampaignsData] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [adminUsersList, setAdminUsersList] = useState<User[]>([]);
    const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState({ nombre: '', email: '', role: 'ejecutivo', password: '', jefe_id: '', company_id: 'Urbani' });
    const [bulkUserFile, setBulkUserFile] = useState<File | null>(null);
    const [uploadingUsers, setUploadingUsers] = useState(false);

    // Navigation state
    const [activeMainView, setActiveMainView] = useState<'dashboard' | 'gestionar'>('dashboard');

    // Multi-selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const isAdmin = currentUser?.role === 'admin';

    const loadCampaigns = async () => {
        setLoadingCampaigns(true);
        try {
            const data = await getContactEvents();
            setCampaignsData(Array.isArray(data) ? data : []);
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
            setAdminUsersList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading admin users:", err);
        } finally {
            setLoadingAdminUsers(false);
        }
    };

    const refreshData = useCallback((user: User | null) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (user?.id) params.append('userId', user.id);
        if (user?.role) params.append('role', user.role.toLowerCase());
        if (filterEjecutivo) params.append('ejecutivo_id', filterEjecutivo);
        if (filterJefe) params.append('jefe_id', filterJefe);

        Promise.all([
            fetch(`/api/leads?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('visor_token') || ''}` }
            }).then(r => r.json()),
            getUsers()
        ])
            .then(([leadsResponse, usersData]) => {
                const rawLeads = Array.isArray(leadsResponse) ? leadsResponse : (leadsResponse?.data || []);
                setLeads(rawLeads);
                setUsers(Array.isArray(usersData) ? usersData : []);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [filterEjecutivo, filterJefe]);

    useEffect(() => {
        const stored = localStorage.getItem('visor_user');
        if (stored) {
            try {
                const user = JSON.parse(stored);
                if (user?.id) {
                    setCurrentUser(user);
                    refreshData(user);
                    if (user.role === 'admin') loadAdminUsers();
                } else {
                    window.location.href = '/login';
                }
            } catch {
                window.location.href = '/login';
            }
        } else {
            window.location.href = '/login';
        }
    }, [refreshData]);

    useEffect(() => {
        localStorage.setItem('visor_filters', JSON.stringify({
            proyecto: filterProyectoLead,
            status: filterStatusLead,
            quality: filterQualityLead,
        }));
    }, [filterProyectoLead, filterStatusLead, filterQualityLead]);

    const handleLogout = () => {
        if (window.confirm("¿Seguro de salir?")) {
            logout();
            window.location.href = '/login';
        }
    };

    const openHistory = async (lead: Lead) => {
        setHistoryLead(lead);
        setLoadingHistory(true);
        try {
            const history = await getLeadHistory(lead.id);
            setLeadHistoryData(Array.isArray(history) ? history : []);
        } catch (err) {
            console.error("Error history:", err);
            setLeadHistoryData([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile) return;
        setUploading(true);
        setUploadProgress(20);
        try {
            const res = await uploadLeads(uploadFile, allocations, currentUser?.id || '');
            if (res.success) {
                setUploadSuccess({ count: res.count || 0, eventId: res.eventId || '' });
                setUploadFile(null);
                refreshData(currentUser);
            } else {
                alert("Error: " + (res.error || "Carga fallida"));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleReassign = async (leadId: string, newUserId: string) => {
        if (!currentUser) return;
        setIsReassigning(true);
        const success = await assignLead(leadId, newUserId, currentUser.id);
        if (success) {
            setReassignLeadId(null);
            refreshData(currentUser);
        }
        setIsReassigning(false);
    };

    const handleToggleUserStatus = async (user: User) => {
        const res = await updateAdminUser(user.id, { activo: !user.activo });
        if (res && !('error' in res)) loadAdminUsers();
    };

    const handleSaveUser = async () => {
        let res;
        if (editingUser) res = await updateAdminUser(editingUser.id, userForm);
        else res = await createAdminUser(userForm);

        if (res && !('error' in res)) {
            setShowUserModal(false);
            loadAdminUsers();
        }
    };

    const handleBulkUserUpload = async () => {
        if (!bulkUserFile) return;
        setUploadingUsers(true);
        const formData = new FormData();
        formData.append('file', bulkUserFile);
        try {
            const response = await fetch('/api/admin/users/bulk-upload', { method: 'POST', body: formData });
            if (response.ok) loadAdminUsers();
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingUsers(false);
        }
    };

    const loadAudit = () => {
        // Mock or legacy audit logic
    };

    const goBack = () => {
        setShowUpload(false);
        setShowCampaigns(false);
        setShowUsersAdmin(false);
    };

    const filteredLeads = leads.filter(l => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (l.nombre || '').toLowerCase().includes(searchLower) ||
            (l.apellido || '').toLowerCase().includes(searchLower) ||
            (l.email || '').toLowerCase().includes(searchLower) ||
            (l.proyecto || '').toLowerCase().includes(searchLower);
        const matchesProyecto = !filterProyectoLead || l.proyecto === filterProyectoLead;
        const matchesStatus = !filterStatusLead || l.estado_gestion === filterStatusLead;
        const matchesQuality = !filterQualityLead || (filterQualityLead === 'hot' && l.es_caliente) || (filterQualityLead === 'ia' && l.es_ia);
        return matchesSearch && matchesProyecto && matchesStatus && matchesQuality;
    });

    if (loading && !currentUser) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white font-bold animate-pulse">Cargando Sistema...</div>;

    const isShowingSubAdminView = showUpload || showCampaigns || showUsersAdmin;

    return (
        <div className="flex min-h-screen bg-[#0d0d0f] text-white font-sans selection:bg-primary/30 relative overflow-hidden">

            {/* Sidebar */}
            <aside className="w-64 bg-[#09090b] border-r border-white/5 flex flex-col fixed inset-y-0 z-40 p-6">
                <div
                    className="flex items-center gap-3 mb-10 cursor-pointer group"
                    onClick={() => { goBack(); setActiveMainView('dashboard'); }}
                >
                    <div className="w-12 h-12 bg-[#3f5d1e]/20 rounded-2xl flex items-center justify-center border border-[#3f5d1e]/30 group-hover:scale-110 transition-transform">
                        <LayoutList className="h-6 w-6 text-[#9acd32]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white leading-none italic tracking-tight">Lead Console</h1>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">SALES ENTERPRISE V3</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-4">
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            onClick={() => { goBack(); setActiveMainView('dashboard'); }}
                            className={`w-full justify-start h-14 rounded-3xl text-sm font-bold transition-all px-6 ${(!isShowingSubAdminView && activeMainView === 'dashboard') ? 'bg-[#3f5d1e]/20 text-[#9acd32] border border-[#3f5d1e]/30 shadow-[0_0_20px_rgba(63,93,30,0.1)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <LayoutList className="mr-4 h-5 w-5" /> Dashboard
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => { goBack(); setActiveMainView('gestionar'); }}
                            className={`w-full justify-start h-14 rounded-3xl text-sm font-bold transition-all px-6 ${(!isShowingSubAdminView && activeMainView === 'gestionar') ? 'bg-[#3f5d1e]/20 text-[#9acd32] border border-[#3f5d1e]/30 shadow-[0_0_20px_rgba(63,93,30,0.1)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <History className="mr-4 h-5 w-5" /> Gestionar
                        </Button>
                    </div>

                    {isAdmin && (
                        <div className="pt-6 space-y-2">
                            <p className="px-6 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Administración</p>
                            <Button
                                variant="ghost"
                                onClick={() => { goBack(); setShowCampaigns(true); loadCampaigns(); }}
                                className={`w-full justify-start h-11 rounded-xl text-xs font-bold ${showCampaigns ? 'bg-primary/10 text-primary border border-primary/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <BarChart2 className="mr-3 h-4 w-4" /> Campañas
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => { goBack(); setShowUsersAdmin(true); loadAdminUsers(); }}
                                className={`w-full justify-start h-11 rounded-xl text-xs font-bold ${showUsersAdmin ? 'bg-primary/10 text-primary border border-primary/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <UserIcon className="mr-3 h-4 w-4" /> Usuarios
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowUpload(true)}
                                className={`w-full justify-start h-11 rounded-xl text-xs font-bold ${showUpload ? 'bg-primary/10 text-primary border border-primary/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <Upload className="mr-3 h-4 w-4" /> Cargar Base
                            </Button>
                        </div>
                    )}
                </nav>

                <div className="pt-6 border-t border-white/5 space-y-3">
                    {isAdmin && (
                        <Button
                            onClick={() => { if (confirm("¿Borrar todo?")) purgeLeads().then(() => window.location.reload()); }}
                            variant="ghost"
                            className="w-full h-10 rounded-xl text-[9px] text-red-500/40 hover:text-red-500 hover:bg-red-500/5 font-black uppercase tracking-widest"
                        >
                            <Trash2 className="mr-2 h-3 w-3" /> Purga Total
                        </Button>
                    )}
                    <Button
                        onClick={handleLogout}
                        className="w-full h-10 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
                    >
                        Salir
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-10">

                {/* Header Section */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex-1 max-w-xl relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary" />
                        <Input
                            placeholder="Buscar por nombre, email o proyecto..."
                            className="w-full h-12 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-primary/20 focus:border-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                        <div className="text-right hidden sm:block">
                            <span className="block text-xs font-bold text-white">{currentUser?.nombre || "Usuario"}</span>
                            <span className="block text-[9px] font-black text-gray-600 uppercase tracking-widest">{currentUser?.role || "Ejecutivo"}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Sub-views for Admins */}
                {showUpload && isAdmin && (
                    <Card className="mb-10 bg-primary/5 border-primary/20 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Importar Leads</h2>
                                <p className="text-xs text-gray-500 font-medium">Sube tu archivo CSV y asigna los leads a tu equipo.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center bg-black/40 hover:border-primary/50 transition-colors cursor-pointer relative group">
                                <input type="file" accept=".csv" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <Upload className="h-8 w-8 text-gray-600 mb-2 group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold text-gray-400">{uploadFile ? uploadFile.name : "Seleccionar Archivo"}</span>
                            </div>
                            <div className="space-y-4">
                                <Button onClick={handleUpload} disabled={uploading || !uploadFile} className="w-full h-12 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20">
                                    {uploading ? "Procesando..." : "Iniciar Carga Masiva"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {showCampaigns && isAdmin && (
                    <Card className="mb-10 bg-[#121212] border-white/5 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <CardTitle className="text-lg font-bold">Historial de Campañas</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-white/5 text-gray-500 uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Descripción / Fecha</th>
                                            <th className="px-6 py-4">Leads</th>
                                            <th className="px-6 py-4">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {campaignsData.map(c => (
                                            <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white">{c.description || `Carga ${c.id}`}</div>
                                                    <div className="text-[10px] text-gray-600">{new Date(c.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono">{c.total_leads}</td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => downloadCsv(String(c.id), `Carga_${c.id}.csv`)} disabled={!c.has_file} className="h-8 w-8 p-0 text-primary"><Download className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCampaign(String(c.id))} className="h-8 w-8 p-0 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {showUsersAdmin && isAdmin && (
                    <Card className="mb-10 bg-[#121212] border-white/5 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/5 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">Gestión de Usuarios</CardTitle>
                            <Button size="sm" onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="bg-primary text-black font-bold h-9 rounded-lg select-none"><UserPlus className="h-4 w-4 mr-2" /> Agregar</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-white/5 text-gray-500 uppercase font-black tracking-widest text-[9px]">
                                        <tr>
                                            <th className="px-6 py-4">Usuario</th>
                                            <th className="px-6 py-4">Rol</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {adminUsersList.map(u => (
                                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white">{u.nombre || "Sin Nombre"}</div>
                                                    <div className="text-[10px] text-gray-600 font-mono">{u.email || "Sin Email"}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-gray-400'}`}>{u.role}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handleToggleUserStatus(u)} className={`h-8 w-8 p-0 ${u.activo ? 'text-green-500' : 'text-gray-600'}`}><Power className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="sm" onClick={() => { setEditingUser(u); setUserForm({ ...userForm, nombre: u.nombre, email: u.email, role: u.role }); setShowUserModal(true); }} className="h-8 w-8 p-0 text-white"><Edit className="h-4 w-4" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Unified Main View */}
                {!isShowingSubAdminView && (
                    <div className="animate-in fade-in duration-500">

                        {activeMainView === 'dashboard' && (
                            <>
                                {/* Summary Bar */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pendientes</p>
                                        <p className="text-2xl font-black text-white leading-none">
                                            {leads.filter(l => l.estado_gestion === 'No Gestionado').length}
                                        </p>
                                    </div>
                                    <div className="bg-[#3f5d1e]/10 border border-[#3f5d1e]/20 p-5 rounded-2xl">
                                        <p className="text-[10px] font-bold text-[#9acd32] uppercase tracking-widest mb-1">Contactar Hoy</p>
                                        <p className="text-2xl font-black text-white leading-none">
                                            {leads.filter(l => {
                                                if (l.estado_gestion !== 'Por Contactar' || !l.fecha_proximo_contacto) return false;
                                                return l.fecha_proximo_contacto.startsWith(new Date().toISOString().split('T')[0]);
                                            }).length}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">En Proceso</p>
                                        <p className="text-2xl font-black text-white leading-none">
                                            {leads.filter(l => l.estado_gestion === 'En Proceso').length}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Vía AI</p>
                                        <p className="text-2xl font-black text-white leading-none">
                                            {leads.filter(l => l.es_ia).length}
                                        </p>
                                    </div>
                                </div>

                                {/* Metrics for Admins and non-Admins */}
                                <div className="animate-in slide-in-from-bottom-5 duration-700">
                                    <MetricsDashboard leads={leads} />
                                </div>
                            </>
                        )}

                        {activeMainView === 'gestionar' && (
                            <div className="animate-in slide-in-from-bottom-5 duration-700">
                                {/* Filter Bar */}
                                <div className="flex flex-wrap items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl mb-8">
                                    <select
                                        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                        value={filterProyectoLead}
                                        onChange={(e) => setFilterProyectoLead(e.target.value)}
                                    >
                                        <option value="">Todos los Proyectos</option>
                                        {Array.from(new Set(leads.map(l => l.proyecto))).filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <select
                                        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                        value={filterStatusLead}
                                        onChange={(e) => setFilterStatusLead(e.target.value)}
                                    >
                                        <option value="">Todos los Estados</option>
                                        <option value="No Gestionado">No Gestionado</option>
                                        <option value="Por Contactar">Por Contactar</option>
                                        <option value="En Proceso">En Proceso</option>
                                        <option value="Cerrado">Cerrado</option>
                                    </select>
                                    <select
                                        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                        value={filterQualityLead}
                                        onChange={(e) => setFilterQualityLead(e.target.value)}
                                    >
                                        <option value="">Calidad AI/Hot</option>
                                        <option value="hot">🔥 Hot Leads</option>
                                        <option value="ia">🤖 Data AI</option>
                                    </select>
                                    <div className="flex-1" />
                                    <div className="text-[10px] font-black text-gray-600 uppercase">Mostrando: {filteredLeads.length} leads</div>
                                </div>

                                {/* Lead Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                                    {filteredLeads.map(lead => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            currentUser={currentUser}
                                            isSelected={selectedIds.has(lead.id)}
                                            toggleSelect={toggleSelect}
                                            openHistory={openHistory}
                                            refreshData={() => refreshData(currentUser)}
                                        />
                                    ))}
                                    {filteredLeads.length === 0 && (
                                        <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-gray-600 font-bold uppercase tracking-[0.2em] text-sm">No se encontraron resultados</p>
                                        </div>
                                    )}
                                </div>

                                {/* Bulk Actions */}
                                <BulkActionsBar
                                    selectedIds={selectedIds}
                                    users={users}
                                    currentUserId={currentUser?.id || ''}
                                    onClear={() => setSelectedIds(new Set())}
                                    onDone={() => refreshData(currentUser)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Modals */}
            {historyLead && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <Card className="w-full max-w-xl bg-[#121212] border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">Historial: {historyLead.nombre}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setHistoryLead(null)}><X className="h-4 w-4" /></Button>
                        </CardHeader>
                        <CardContent className="overflow-y-auto p-6 space-y-6">
                            {loadingHistory ? <p className="text-center italic text-gray-600">Cargando...</p> :
                                leadHistoryData.map((h, i) => (
                                    <div key={i} className="relative pl-8 border-l border-white/5">
                                        <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-primary" />
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-white uppercase tracking-wider">{h.estado_nuevo || h.new_status}</span>
                                            <span className="text-[9px] text-gray-600 font-mono">{new Date(h.created_at || h.changed_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 italic">"{h.comentario || h.notes || 'Sin comentario'}"</p>
                                        <div className="text-[9px] text-gray-600 mt-1">— {h.changed_by_name || 'Sistema'}</div>
                                    </div>
                                ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            {showUserModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
                    <Card className="w-full max-w-sm bg-[#18181b] border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-6">{editingUser ? "Editar Acceso" : "Nuevo Acceso"}</h2>
                        <div className="space-y-4">
                            <Input placeholder="Nombre" value={userForm.nombre} onChange={e => setUserForm({ ...userForm, nombre: e.target.value })} className="bg-black border-white/10" />
                            <Input placeholder="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="bg-black border-white/10" />
                            <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full h-10 bg-black border border-white/10 rounded-lg px-3 text-xs text-white">
                                <option value="ejecutivo">Ejecutivo</option>
                                <option value="gerente">Gerente</option>
                                <option value="admin">Administrador</option>
                            </select>
                            <Button onClick={handleSaveUser} className="w-full bg-primary text-black font-bold h-11 rounded-xl mt-4">Guardar Usuario</Button>
                            <Button variant="ghost" onClick={() => setShowUserModal(false)} className="w-full h-11 text-gray-500">Cancelar</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

// Fixed handleDeleteCampaign function (added fallback to campaign logic)
async function handleDeleteCampaign(id: string) {
    if (confirm("¿Seguro de borrar esta carga?")) {
        const success = await deleteContactEvent(id);
        if (success) window.location.reload();
    }
}
