import api from '../api.js';

// === EVENTS ===
export async function getEvents() {
    const response = await api.get('/reports/sunday/events'); // Updated path structure
    return response.data;
}

export async function createEvent(eventData) {
    const response = await api.post('/reports/sunday/events', eventData);
    return response.data;
}

export async function deleteEvent(eventId) {
    await api.delete(`/reports/sunday/events/${eventId}`);
}

// === REPORTS ===
export async function submitReport(reportData) {
    const response = await api.post('/reports/sunday', reportData);
    return response.data;
}

export async function getReportsForEvent(eventId) {
    const response = await api.get(`/reports/sunday/event/${eventId}`);
    return response.data;
}

export async function updateReport(reportId, reportData) {
    const response = await api.put(`/reports/sunday/${reportId}`, reportData);
    return response.data;
}