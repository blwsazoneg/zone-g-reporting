import api from '../api.js';

// === MONTHLY GROUP REPORTS ===
export async function submitGroupMonthly(data) {
    const response = await api.post('/reports/finance/group-monthly', data);
    return response.data;
}

export async function getGroupMonthly(params) {
    // params can be { group_id: '...', year: 2025 }
    const response = await api.get('/reports/finance/group-monthly', { params });
    return response.data;
}

// === PASTOR TITHE RECORDS ===
export async function submitPastorTithe(data) {
    const response = await api.post('/reports/finance/pastor-tithe', data);
    return response.data;
}

export async function getPastorTithe(params) {
    const response = await api.get('/reports/finance/pastor-tithe', { params });
    return response.data;
}

// === ZONAL REMITTANCE ===
export async function submitZonalRemittance(data) {
    const response = await api.post('/reports/finance/zonal-remittance', data);
    return response.data;
}

export async function getZonalRemittance(params) {
    const response = await api.get('/reports/finance/zonal-remittance', { params });
    return response.data;
}

// === INDIVIDUAL RECORDS ===
export async function getIndividualRecords(params) {
    const response = await api.get('/reports/finance/individual-records', { params });
    return response.data;
}

export async function uploadIndividualRecords(formData) {
    // Note: When sending FormData, the browser automatically sets the Content-Type to multipart/form-data
    const response = await api.post('/reports/finance/individual-records/upload', formData);
    return response.data;
}