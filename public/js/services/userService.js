import api from '../api.js';

// --- User Functions ---
export async function getAllUsers() {
    try {
        const response = await api.get('/users');
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

export async function createUser(userData) {
    try {
        const response = await api.post('/users', userData);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

export async function updateUser(userId, userData) {
    try {
        const response = await api.put(`/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error;
    }
}

export async function deleteUser(userId) {
    try {
        await api.delete(`/users/${userId}`);
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        throw error;
    }
}

// --- Role Functions ---
export async function getAllRoles() {
    try {
        const response = await api.get('/users/roles');
        return response.data;
    } catch (error) {
        console.error('Error fetching roles:', error);
        throw error;
    }
}

// --- User-Role Assignment Functions ---
export async function getUserRoles(userId) {
    try {
        const response = await api.get(`/users/${userId}/roles`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching roles for user ${userId}:`, error);
        throw error;
    }
}

export async function assignRolesToUser(userId, roleIds) {
    // roleIds should be an array of numbers, e.g., [1, 3]
    try {
        const response = await api.post(`/users/${userId}/roles`, { roles: roleIds });
        return response.data;
    } catch (error) {
        console.error(`Error assigning roles to user ${userId}:`, error);
        throw error;
    }
}