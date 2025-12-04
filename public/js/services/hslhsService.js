import api from '../api.js';

export async function submitHslhsReport(data) {
    // data includes group_id, program_title, and all stats
    const response = await api.post('/reports/hslhs', data);
    return response.data;
}

export async function getHslhsReports(params) {
    // params: { group_id, program_title }
    const response = await api.get('/reports/hslhs', { params });
    return response.data;
}

export async function deleteHslhsReport(reportId) {
    await api.delete(`/reports/hslhs/${reportId}`);
}