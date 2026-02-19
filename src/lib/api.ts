import type { Lead, User } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// --- Token Management ---
export const getToken = (): string | null => localStorage.getItem('visor_token');
export const saveToken = (token: string) => localStorage.setItem('visor_token', token);
export const clearToken = () => localStorage.removeItem('visor_token');

// Auth headers helper
const authHeaders = (): Record<string, string> => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Generic authenticated fetch
const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
            ...(options.headers as Record<string, string> || {}),
        },
    });
};

// --- Auth ---
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (data.success && data.token) {
            saveToken(data.token);
            localStorage.setItem('visor_user', JSON.stringify(data.user));
            return { success: true };
        }
        return { success: false, error: data.error || 'Credenciales inválidas' };
    } catch (e) {
        console.error('[login]', e);
        return { success: false, error: 'Error de conexión' };
    }
}

export function logout() {
    clearToken();
    localStorage.removeItem('visor_user');
}

// --- Leads ---
export interface LeadsResponse {
    data: Lead[];
    total: number;
    page: number;
    pageSize: number;
}

export async function getLeads(
    userId?: string,
    role?: string,
    filters: Record<string, string> = {},
    page = 0,
    pageSize = 100
): Promise<LeadsResponse> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const filterKeys = ['ejecutivo_id', 'proyecto', 'estado', 'jefe_id', 'fecha_desde', 'fecha_hasta'];
    filterKeys.forEach(key => { if (filters[key]) params.append(key, filters[key]); });

    const response = await apiFetch(`/leads?${params.toString()}`, { method: 'GET', headers: {} });
    if (response.status === 401 || response.status === 403) {
        logout();
        window.location.href = '/login';
        return { data: [], total: 0, page: 0, pageSize };
    }
    if (!response.ok) throw new Error('Failed to fetch leads');
    return response.json();
}

export const getUsers = async (): Promise<User[]> => {
    try {
        const response = await apiFetch('/users', { method: 'GET', headers: {} });
        if (!response.ok) throw new Error('Error fetching users');
        return await response.json();
    } catch (error) {
        console.error('[getUsers]', error);
        return [];
    }
};

export const assignLead = async (leadId: string, userId: string, adminId: string): Promise<boolean> => {
    try {
        const response = await apiFetch('/leads/assign', {
            method: 'POST',
            body: JSON.stringify({ leadId, userId, adminId }),
            headers: {},
        });
        return response.ok;
    } catch (error) {
        console.error('[assignLead]', error);
        return false;
    }
};

export async function uploadLeads(file: File, allocations: Record<string, number>, adminId: string): Promise<{ success: boolean; count?: number; eventId?: string; error?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('allocations', JSON.stringify(allocations));
    formData.append('adminId', adminId);

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: authHeaders(),
            body: formData,
        });
        return await response.json();
    } catch (e) {
        console.error('[uploadLeads]', e);
        return { success: false, error: 'Upload failed' };
    }
}

export async function updateLeadStatus(id: string, status: string, userId: string, notes = '', scheduledDate?: string): Promise<boolean> {
    try {
        const response = await apiFetch(`/leads/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, userId, notes, scheduledDate }),
            headers: {},
        });
        return response.ok;
    } catch (e) {
        console.error('[updateLeadStatus]', e);
        return false;
    }
}

export async function getDashboardSummary(): Promise<unknown[]> {
    try {
        const response = await apiFetch('/dashboard/summary', { method: 'GET', headers: {} });
        if (!response.ok) throw new Error('Failed to fetch summary');
        return await response.json();
    } catch (e) {
        console.error('[getDashboardSummary]', e);
        return [];
    }
}

export async function getLeadHistory(leadId: string): Promise<unknown[]> {
    try {
        const response = await apiFetch(`/leads/${leadId}/history`, { method: 'GET', headers: {} });
        if (!response.ok) throw new Error('Failed to fetch history');
        return await response.json();
    } catch (e) {
        console.error('[getLeadHistory]', e);
        return [];
    }
}

export async function getContactEvents(): Promise<unknown[]> {
    try {
        const response = await apiFetch('/contact-events', { method: 'GET', headers: {} });
        if (!response.ok) throw new Error('Failed to fetch contact events');
        return await response.json();
    } catch (e) {
        console.error('[getContactEvents]', e);
        return [];
    }
}

export async function downloadCsv(eventId: string, fileName: string) {
    try {
        const response = await fetch(`${API_URL}/download-csv/${eventId}`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (e) {
        console.error('[downloadCsv]', e);
        alert('Error al descargar el archivo');
    }
}

export async function deleteContactEvent(eventId: string): Promise<boolean> {
    try {
        const response = await apiFetch(`/contact-events/${eventId}`, { method: 'DELETE', headers: {} });
        return response.ok;
    } catch (e) {
        console.error('[deleteContactEvent]', e);
        return false;
    }
}

export async function getAdminUsers(): Promise<User[]> {
    try {
        const response = await apiFetch('/admin/users', { method: 'GET', headers: {} });
        return await response.json();
    } catch (e) {
        console.error('[getAdminUsers]', e);
        return [];
    }
}

export async function createAdminUser(userData: Omit<User, 'id'> & { password: string }): Promise<{ id: string } | { error: string }> {
    try {
        const response = await apiFetch('/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData),
            headers: {},
        });
        return await response.json();
    } catch (e) {
        console.error('[createAdminUser]', e);
        return { error: 'Error de red' };
    }
}

export async function updateAdminUser(userId: string, userData: Partial<User>): Promise<{ success: boolean } | { error: string }> {
    try {
        const response = await apiFetch(`/admin/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(userData),
            headers: {},
        });
        return await response.json();
    } catch (e) {
        console.error('[updateAdminUser]', e);
        return { error: 'Error de red' };
    }
}

export async function resetAdminUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
        const response = await apiFetch(`/admin/users/${userId}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ newPassword }),
            headers: {},
        });
        return response.ok;
    } catch (e) {
        console.error('[resetAdminUserPassword]', e);
        return false;
    }
}

export async function purgeLeads(): Promise<boolean> {
    try {
        const response = await apiFetch('/leads/purge', { method: 'DELETE', headers: {} });
        return response.ok;
    } catch (e) {
        console.error('[purgeLeads]', e);
        return false;
    }
}
