import api from '../api.js';

export async function getBooks() {
    const response = await api.get('/materials/books');
    return response.data;
}

export async function createBook(data) {
    const response = await api.post('/materials/books', data);
    return response.data;
}

export async function updateBook(bookId, data) {
    const response = await api.put(`/materials/books/${bookId}`, data);
    return response.data;
}

export async function deleteBook(bookId) {
    await api.delete(`/materials/books/${bookId}`);
}

// MONTHLY BOOK REPORTS
export async function submitBookReport(data) {
    const response = await api.post('/materials/book-reports', data);
    return response.data;
}

export async function getBookReports(params) {
    const response = await api.get('/materials/book-reports', { params });
    return response.data;
}

// PCDL Subscriptions
export async function submitPcdl(data) {
    const response = await api.post('/materials/pcdl-subscriptions', data);
    return response.data;
}

export async function getPcdlSubscriptions(params) {
    // params: { group_id, chapter_id }
    const response = await api.get('/materials/pcdl-subscriptions', { params });
    return response.data;
}

export async function deletePcdl(subId) {
    await api.delete(`/materials/pcdl-subscriptions/${subId}`);
}
