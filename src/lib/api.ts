import type { Lead, User } from "@/types";

const API_URL = "http://localhost:3000/api";

export async function getLeads(userId?: string, role?: string): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);

    const response = await fetch(`${API_URL}/leads?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Failed to fetch leads");
    }
    return response.json();
}

export const getUsers = async (): Promise<User[]> => {
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Error fetching users');
        return await response.json();
    } catch (error) {
        console.error("Error getting users:", error);
        return [];
    }
};

export const assignLead = async (leadId: string, userId: string, adminId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/leads/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, userId, adminId })
        });
        return response.ok;
    } catch (error) {
        console.error("Error assigning lead:", error);
        return false;
    }
};

export async function uploadLeads(file: File, allocations: Record<string, number>, adminId: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('allocations', JSON.stringify(allocations));
    formData.append('adminId', adminId);

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });
        return await response.json();
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Upload failed' };
    }
}

export async function login(email: string, password: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.success) {
            // Save user to local storage if needed or context
            localStorage.setItem('visor_user', JSON.stringify(data.user));
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function updateLeadStatus(id: string, status: string, userId: string, notes: string = "", scheduledDate?: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, userId, notes, scheduledDate }),
        });
        return response.ok;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function getDashboardSummary(): Promise<any[]> {
    try {
        const response = await fetch(`${API_URL}/dashboard/summary`);
        if (!response.ok) throw new Error("Failed to fetch summary");
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function getLeadHistory(leadId: string): Promise<any[]> {
    try {
        const response = await fetch(`${API_URL}/leads/${leadId}/history`);
        if (!response.ok) throw new Error("Failed to fetch history");
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}
