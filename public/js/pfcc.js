import { logout, getCurrentUser, isAuthenticated } from './auth.js';
import { submitPfccReport, getPfccReports, deletePfccReport } from './services/pfccService.js';

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
    Alpine.data('pfccComponent', () => ({
        activeTab: 'submit',
        currentUser: getCurrentUser(),
        reports: [],
        loading: false,

        // --- Search & Pagination ---
        searchQuery: '',
        currentPage: 1,
        pageSize: 9,

        // Data & Form
        form: {
            cell_name: '', report_date: '',
            cell_attendance: 0, cell_first_timers: 0, new_converts: 0, offering: 0,
            cell_church_attendance: 0, cell_church_first_timers: 0,
            souls_reached: 0, souls_saved: 0, souls_retained: 0
        },

        // State for Viewing Details
        selectedReport: null,

        // Modals
        modal: { title: '', body: '' }, // Generic message modal
        messageModalInstance: null,
        detailsModalInstance: null, // New details modal

        // --- Computed Properties ---
        get filteredReports() {
            if (!this.searchQuery) return this.reports;
            const q = this.searchQuery.toLowerCase();
            return this.reports.filter(r =>
                r.cell_name.toLowerCase().includes(q) ||
                (r.cell_leader_name && r.cell_leader_name.toLowerCase().includes(q))
            );
        },

        get totalPages() { return Math.ceil(this.filteredReports.length / this.pageSize) || 1; },

        get paginatedReports() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredReports.slice(start, start + this.pageSize);
        },

        init() {
            this.messageModalInstance = new bootstrap.Modal(document.getElementById('messageModal'));
            this.detailsModalInstance = new bootstrap.Modal(document.getElementById('detailsModal'));
            this.loadReports();
        },

        async loadReports() {
            this.loading = true;
            try {
                this.reports = await getPfccReports();
            } catch (error) {
                console.error(error);
            } finally {
                this.loading = false;
            }
        },

        // --- Actions ---
        viewDetails(report) {
            this.selectedReport = report;
            this.detailsModalInstance.show();
        },

        async submitForm() {
            try {
                const payload = { ...this.form, cell_leader_id: this.currentUser.id, submitted_by: this.currentUser.id };
                await submitPfccReport(payload);
                this.showModal('Success', 'Report submitted successfully!');
                this.resetForm();
                this.loadReports();
            } catch (error) {
                this.showModal('Error', 'Failed to submit report.');
            }
        },

        async confirmDelete(report) {
            if (confirm(`Delete report for "${report.cell_name}"?`)) {
                try {
                    await deletePfccReport(report.id);
                    this.loadReports();
                } catch (error) {
                    this.showModal('Error', 'Failed to delete report.');
                }
            }
        },

        resetForm() {
            this.form = {
                cell_name: '', report_date: '',
                cell_attendance: 0, cell_first_timers: 0, new_converts: 0, offering: 0,
                cell_church_attendance: 0, cell_church_first_timers: 0,
                souls_reached: 0, souls_saved: 0, souls_retained: 0
            };
        },

        showModal(title, body) {
            this.modal.title = title;
            this.modal.body = body;
            this.messageModalInstance.show();
        },

        formatDate(dateStr) { if (!dateStr) return ''; return new Date(dateStr).toLocaleDateString(); },
        formatCurrency(amount) { return 'R ' + Number(amount).toFixed(2); }
    }));
});