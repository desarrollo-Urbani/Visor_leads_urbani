import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, CheckSquare, Calendar } from 'lucide-react';
import type { Lead } from "@/types";

interface MetricsDashboardProps {
    leads: Lead[];
}

const COLORS = ['#84CC16', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function MetricsDashboard({ leads }: MetricsDashboardProps) {

    const metrics = useMemo(() => {
        const total = leads.length;
        const contacted = leads.filter(l => l.estado_gestion !== 'No Gestionado').length;

        // Parse rent logic: average of reported incomes
        const rents = leads.map(l => {
            const rentaStr = String(l.renta || "0");
            const val = parseFloat(rentaStr.replace(/[^0-9.-]+/g, ""));
            return isNaN(val) ? 0 : val;
        }).filter(v => v > 0);

        const avgRent = rents.length > 0 ? rents.reduce((a, b) => a + b, 0) / rents.length : 0;

        return {
            total,
            contacted,
            pendingFollowUp: leads.filter(l => l.estado_gestion === 'Por Contactar').length,
            conversionRate: total > 0 ? ((contacted / total) * 100).toFixed(1) : 0,
            avgRent: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(avgRent)
        };
    }, [leads]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        leads.forEach(l => {
            counts[l.estado_gestion] = (counts[l.estado_gestion] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [leads]);

    const executionData = useMemo(() => {
        const counts: Record<string, number> = {};
        leads.forEach(l => {
            const exec = l.nombre_ejecutivo || 'Sin Asignar';
            counts[exec] = (counts[exec] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [leads]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="bg-[#18181b] border-white/5 shadow-xl rounded-2xl ring-1 ring-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Leads</CardTitle>
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                            <BarChart3 className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-white">{metrics.total}</div>
                        <p className="text-[10px] text-primary font-bold mt-1 uppercase">+12% vs mes anterior</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#18181b] border-white/5 shadow-xl rounded-2xl ring-1 ring-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">Gestión Efectiva</CardTitle>
                        <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                            <CheckSquare className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-white">{metrics.conversionRate}%</div>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">{metrics.contacted} leads gestionados</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#18181b] border-white/5 shadow-xl rounded-2xl ring-1 ring-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">Por Contactar</CardTitle>
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                            <Calendar className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-white">{metrics.pendingFollowUp}</div>
                        <p className="text-[10px] text-primary font-bold mt-1 uppercase">Agendados para hoy/mañana</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#18181b] border-white/5 shadow-xl rounded-2xl ring-1 ring-white/5 overflow-hidden border-b-primary/30 border-b-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">Renta Promedio</CardTitle>
                        <div className="h-8 w-8 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                            <span className="text-green-500 font-bold">$</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-white">{metrics.avgRent}</div>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">Promedio de rentas informadas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1 bg-[#18181b] border-white/5 shadow-xl rounded-2xl ring-1 ring-white/5 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-white">Embudo de Ventas</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#84CC16" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#84CC16" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                    itemStyle={{ color: '#84CC16' }}
                                />
                                <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1 bg-[#18181b] border-white/5 shadow-xl rounded-2xl ring-1 ring-white/5 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-white">Market Share por Ejecutivo</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={executionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {executionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
