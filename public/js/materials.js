import { logout, getCurrentUser, isAuthenticated } from './auth.js';
import { getAllGroups } from './services/groupService.js';
import { getAllChapters } from './services/chapterService.js';
import {
    getBooks, createBook, updateBook, deleteBook,
    getBookReports, submitBookReport,
    getPcdlSubscriptions, submitPcdl, deletePcdl
} from './services/materialsService.js';

// --- Sidebar Toggle Logic ---
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
// ---------------------------

if (!isAuthenticated()) window.location.href = '/index.html';

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
    Alpine.data('materialsComponent', () => ({
        activeTab: 'books',
        currentUser: getCurrentUser(),
        groups: [],
        chapters: [],

        // Data Lists
        books: [],
        reports: [],
        pcdlSubs: [],

        // UI State
        loading: false,
        searchQuery: '',
        currentPage: 1,
        pageSize: 9,
        selectedItem: null, // For Details Modal

        // Forms
        bookForm: { id: null, book_title: '', category: '', price: 0 },
        isEditingBook: false,
        reportForm: { group_id: '', report_month: '', books_ordered: 0, mini_books_ordered: 0, total_amount: 0, book_names_details: '' },
        pcdlForm: { group_id: '', chapter_id: '', title: '', full_name: '', contact_number: '', kc_handle: '', leadership_role: '', subscription_type: '1 Month', commitment: 'Paid' },

        // Modals
        bookModalInstance: null,
        reportModalInstance: null,
        pcdlModalInstance: null,
        detailsModalInstance: null,
        statusModalInstance: null,
        statusTitle: '', statusBody: '',

        // --- FILTERING & PAGINATION ---
        get filteredList() {
            const q = this.searchQuery.toLowerCase();
            let list = [];

            if (this.activeTab === 'books') list = this.books;
            else if (this.activeTab === 'monthly') list = this.reports;
            else if (this.activeTab === 'pcdl') list = this.pcdlSubs;

            if (!q) return list;

            return list.filter(item => {
                // Generic search based on active tab
                if (this.activeTab === 'books') return item.book_title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
                if (this.activeTab === 'monthly') return item.group_name.toLowerCase().includes(q);
                if (this.activeTab === 'pcdl') return item.full_name.toLowerCase().includes(q) || item.kc_handle.toLowerCase().includes(q);
                return false;
            });
        },

        get totalPages() { return Math.ceil(this.filteredList.length / this.pageSize) || 1; },

        get paginatedList() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredList.slice(start, start + this.pageSize);
        },

        init() {
            this.bookModalInstance = new bootstrap.Modal(document.getElementById('bookModal'));
            this.reportModalInstance = new bootstrap.Modal(document.getElementById('reportModal'));
            this.pcdlModalInstance = new bootstrap.Modal(document.getElementById('pcdlModal'));
            this.detailsModalInstance = new bootstrap.Modal(document.getElementById('detailsModal'));
            this.statusModalInstance = new bootstrap.Modal(document.getElementById('statusModal'));

            this.loadInitialData();
            this.switchTab('books');
        },

        async loadInitialData() {
            try {
                this.groups = await getAllGroups();
                this.chapters = await getAllChapters();
            } catch (err) { console.error(err); }
        },

        switchTab(tab) {
            this.activeTab = tab;
            this.searchQuery = '';
            this.currentPage = 1;
            if (tab === 'books') this.loadBooks();
            if (tab === 'monthly') this.loadReports();
            if (tab === 'pcdl') this.loadPcdl();
        },

        // --- DATA LOADING ---
        async loadBooks() { this.loading = true; try { this.books = await getBooks(); } catch (err) { console.error(err); } finally { this.loading = false; } },
        async loadReports() { this.loading = true; try { this.reports = await getBookReports(); } catch (err) { console.error(err); } finally { this.loading = false; } },
        async loadPcdl() { this.loading = true; try { this.pcdlSubs = await getPcdlSubscriptions(); } catch (err) { console.error(err); } finally { this.loading = false; } },

        // --- ACTIONS ---
        viewDetails(item) {
            this.selectedItem = item;
            this.detailsModalInstance.show();
        },

        // Books
        openBookModal(book = null) {
            if (book) {
                this.bookForm = { ...book };
                this.isEditingBook = true;
            } else {
                this.bookForm = { id: null, book_title: '', category: '', price: 0 };
                this.isEditingBook = false;
            }
            this.bookModalInstance.show();
        },
        async saveBook() {
            try {
                const payload = { ...this.bookForm, created_by: this.currentUser.id };
                if (this.isEditingBook) await updateBook(this.bookForm.id, payload);
                else await createBook(payload);

                this.bookModalInstance.hide();
                this.showStatus("Success", "Book Saved");
                this.loadBooks();
            } catch (err) { this.showStatus("Error", "Failed to save book"); }
        },

        // Monthly Reports
        openReportModal() {
            this.reportForm = { group_id: '', report_month: '', books_ordered: 0, mini_books_ordered: 0, total_amount: 0, book_names_details: '' };
            this.reportModalInstance.show();
        },
        async saveMonthlyReport() {
            try {
                await submitBookReport({ ...this.reportForm, submitted_by: this.currentUser.id });
                this.reportModalInstance.hide();
                this.showStatus("Success", "Report Submitted");
                this.loadReports();
            } catch (err) { this.showStatus("Error", "Failed to submit report"); }
        },

        // PCDL
        openPcdlModal() {
            this.pcdlForm = { group_id: '', chapter_id: '', title: '', full_name: '', contact_number: '', kc_handle: '', leadership_role: '', subscription_type: '1 Month', commitment: 'Paid' };
            this.pcdlModalInstance.show();
        },
        async savePcdl() {
            try {
                await submitPcdl({ ...this.pcdlForm, submitted_by: this.currentUser.id });
                this.pcdlModalInstance.hide();
                this.showStatus("Success", "Subscription Added");
                this.loadPcdl();
            } catch (err) { this.showStatus("Error", "Failed to add subscription"); }
        },

        // Delete
        async confirmDelete(type, id) {
            if (!confirm("Are you sure?")) return;
            try {
                if (type === 'book') { await deleteBook(id); this.loadBooks(); }
                if (type === 'pcdl') { await deletePcdl(id); this.loadPcdl(); }
            } catch (err) { this.showStatus("Error", "Delete failed"); }
        },

        showStatus(title, body) {
            this.statusTitle = title;
            this.statusBody = body;
            this.statusModalInstance.show();
        },
        formatDate(d) { return new Date(d).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); },
        formatCurrency(a) { return 'R ' + Number(a).toFixed(2); }
    }));
});