import { logout, getCurrentUser, isAuthenticated } from './auth.js';
import { getAllGroups } from './services/groupService.js';
import { getAllChapters, createChapter, updateChapter, deleteChapter } from './services/chapterService.js';

// Sidebar Toggle Logic (Global for this page)
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const btnOpen = document.getElementById('sidebarOpen');
const btnClose = document.getElementById('sidebarClose');

function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

if (btnOpen) btnOpen.addEventListener('click', toggleSidebar);
if (btnClose) btnClose.addEventListener('click', toggleSidebar);
if (overlay) overlay.addEventListener('click', toggleSidebar);

// Auth Check
if (!isAuthenticated()) {
    window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Name
        const display = document.getElementById('currentUserDisplay');
        if (display) display.innerText = 'Welcome,' + ' ' + currentUser.fullName;

        // Avatar
        const avatarContainer = document.getElementById('currentUserAvatar');
        if (avatarContainer && currentUser.avatarUrl) {
            avatarContainer.innerHTML = `<img src="${currentUser.avatarUrl}" class="rounded-circle border border-secondary" style="width: 40px; height: 40px; object-fit: cover;">`;
        }
    }
    document.getElementById('logoutBtn').addEventListener('click', () => logout());
});

document.addEventListener('alpine:init', () => {
    Alpine.data('chaptersComponent', () => ({
        chapters: [],
        groups: [],
        loading: false,

        // --- NEW: Search & Pagination State ---
        searchQuery: '',
        currentPage: 1,
        pageSize: 9, // 9 Cards per page

        // Form State
        chapter: { id: null, chapter_name: '', group_id: '' },
        isEditing: false,

        // Modals
        modal: { title: '', body: '', confirmText: 'Confirm', confirmAction: () => { } },
        confirmModalInstance: null,
        formModalInstance: null,

        // Computed Properties for Form
        get formTitle() { return this.isEditing ? 'Edit Chapter' : 'Create New Chapter'; },
        get formButtonText() { return this.isEditing ? 'Save Changes' : 'Create Chapter'; },

        // --- NEW: Computed Properties for Grid ---
        get filteredChapters() {
            if (!this.searchQuery) return this.chapters;
            const lowerQuery = this.searchQuery.toLowerCase();
            return this.chapters.filter(ch =>
                ch.chapter_name.toLowerCase().includes(lowerQuery) ||
                (ch.group_name && ch.group_name.toLowerCase().includes(lowerQuery))
            );
        },

        get totalPages() {
            return Math.ceil(this.filteredChapters.length / this.pageSize) || 1;
        },

        get paginatedChapters() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredChapters.slice(start, start + this.pageSize);
        },

        init() {
            this.fetchInitialData();
            // Initialize Bootstrap Modals
            this.confirmModalInstance = new bootstrap.Modal(document.getElementById('confirmationModal'));
            this.formModalInstance = new bootstrap.Modal(document.getElementById('chapterFormModal'));
        },

        async fetchInitialData() {
            this.loading = true;
            try {
                const [chaptersData, groupsData] = await Promise.all([
                    getAllChapters(),
                    getAllGroups()
                ]);
                this.chapters = chaptersData;
                this.groups = groupsData;
            } catch (error) {
                console.error('Failed to load initial data:', error);
            } finally {
                this.loading = false;
            }
        },

        // --- UI Actions ---
        openCreateModal() {
            this.chapter = { id: null, chapter_name: '', group_id: '' };
            this.isEditing = false;
            this.formModalInstance.show();
        },

        startEdit(chapterToEdit) {
            this.chapter = { ...chapterToEdit };
            this.isEditing = true;
            this.formModalInstance.show();
        },

        // --- CRUD Operations ---
        async saveChapter() {
            try {
                if (this.isEditing) {
                    await updateChapter(this.chapter.id, {
                        chapter_name: this.chapter.chapter_name,
                        group_id: this.chapter.group_id
                    });
                } else {
                    await createChapter({
                        chapter_name: this.chapter.chapter_name,
                        group_id: this.chapter.group_id
                    });
                }
                this.formModalInstance.hide();
                await this.fetchInitialData(); // Refresh data
                // alert(this.isEditing ? "Chapter updated" : "Chapter created");
            } catch (error) {
                alert('Failed to save chapter.');
            }
        },

        startDelete(chapterToDelete) {
            this.modal.title = 'Confirm Deletion';
            this.modal.body = `Are you sure you want to delete the chapter "${chapterToDelete.chapter_name}"?`;
            this.modal.confirmText = 'Delete';
            this.modal.confirmAction = () => this.confirmDelete(chapterToDelete.id);
            this.confirmModalInstance.show();
        },

        async confirmDelete(chapterId) {
            try {
                await deleteChapter(chapterId);
                await this.fetchInitialData();
            } catch (error) {
                alert('Failed to delete chapter.');
            } finally {
                this.confirmModalInstance.hide();
            }
        }
    }));
});