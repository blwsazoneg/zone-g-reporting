import api from '../api.js';

export async function getAllGroups() {
    try {
        const response = await api.get('/groups');
        return response.data;
    } catch (error) {
        console.error('Error fetching groups:', error);
        throw error;
    }
}

export async function createGroup(groupData) {
    // groupData should be an object, e.g., { group_name: 'New Group' }
    try {
        const response = await api.post('/groups', groupData);
        return response.data;
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
}

export async function updateGroup(groupId, groupData) {
    try {
        const response = await api.put(`/groups/${groupId}`, groupData);
        return response.data;
    } catch (error) {
        console.error(`Error updating group ${groupId}:`, error);
        throw error;
    }
}

export async function deleteGroup(groupId) {
    try {
        await api.delete(`/groups/${groupId}`);
        // No return value needed for a successful delete
    } catch (error) {
        console.error(`Error deleting group ${groupId}:`, error);
        throw error;
    }
}