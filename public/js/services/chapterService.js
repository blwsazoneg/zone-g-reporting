import api from '../api.js';

export async function getAllChapters() {
    try {
        const response = await api.get('/chapters');
        return response.data;
    } catch (error) {
        console.error('Error fetching chapters:', error);
        throw error;
    }
}

export async function createChapter(chapterData) {
    // chapterData = { chapter_name: 'string', group_id: 'UUID' }
    try {
        const response = await api.post('/chapters', chapterData);
        return response.data;
    } catch (error) {
        console.error('Error creating chapter:', error);
        throw error;
    }
}

export async function updateChapter(chapterId, chapterData) {
    try {
        const response = await api.put(`/chapters/${chapterId}`, chapterData);
        return response.data;
    } catch (error) {
        console.error(`Error updating chapter ${chapterId}:`, error);
        throw error;
    }
}

export async function deleteChapter(chapterId) {
    try {
        await api.delete(`/chapters/${chapterId}`);
    } catch (error) {
        console.error(`Error deleting chapter ${chapterId}:`, error);
        throw error;
    }
}