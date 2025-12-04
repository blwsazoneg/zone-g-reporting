import api from '../api.js';

// === EVENTS ===
export async function getCampEvents() {
    const response = await api.get('/reports/camp/events');
    return response.data;
}

export async function createCampEvent(eventData) {
    const response = await api.post('/reports/camp/events', eventData);
    return response.data;
}

export async function deleteCampEvent(eventId) {
    await api.delete(`/reports/camp/events/${eventId}`);
}

// === REPORTS ===
export async function submitAttendance(data) {
    const response = await api.post('/reports/camp/attendance', data);
    return response.data;
}

export async function submitSummary(data) {
    const response = await api.post('/reports/camp/summary', data);
    return response.data;
}

export async function getFullCampReport(campId) {
    const response = await api.get(`/reports/camp/${campId}/full-report`);
    return response.data;
}

export async function uploadAttendees(campId, formData) {
    // Note: formData is needed for file uploads, axios handles headers automatically
    const response = await api.post(`/reports/camp/${campId}/attendees/upload`, formData);
    return response.data;
}