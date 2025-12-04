import api from '../api.js';

export async function submitPfccReport(reportData) {
    // reportData contains cell_name, attendance, etc.
    const response = await api.post('/reports/pfcc', reportData);
    return response.data;
}

export async function getPfccReports() {
    // In a real app, you might pass query params here for filtering
    const response = await api.get('/reports/pfcc');
    return response.data;
}

export async function deletePfccReport(reportId) {
    await api.delete(`/reports/pfcc/${reportId}`);
}