import { logout, getCurrentUser, isAuthenticated } from './auth.js';
import { getEvents, createEvent, deleteEvent, getReportsForEvent, submitReport, updateReport } from './services/sundayService.js';
import { getAllChapters } from './services/chapterService.js'; // Helper to get chapters for dropdown

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
    Alpine.data('sundayServiceComponent', () => ({
        activeTab: 'reports',
        currentUser: getCurrentUser(),
        events: [],
        currentReports: [],
        userChapters: [],
        loading: false,

        // --- Search & Pagination (Events) ---
        searchQuery: '',
        currentPage: 1,
        pageSize: 9,

        // Forms
        newEvent: { event_title: '', event_date: '' },
        selectedEventId: '',
        reportForm: { id: null, chapter_id: '', attendance: 0, first_timers: 0, new_converts: 0, holy_ghost_filled: 0, offering: 0, tithe: 0 },

        isEditingReport: false,
        reportModalInstance: null,
        eventModalInstance: null,

        // --- Computed Properties ---

        // Filtered Events
        get filteredEvents() {
            if (!this.searchQuery) return this.events;
            return this.events.filter(e => e.event_title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        },
        get totalPages() { return Math.ceil(this.filteredEvents.length / this.pageSize) || 1; },
        get paginatedEvents() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredEvents.slice(start, start + this.pageSize);
        },

        // Report Totals
        get totals() {
            return this.currentReports.reduce((acc, curr) => ({
                attendance: acc.attendance + (parseInt(curr.attendance) || 0),
                first_timers: acc.first_timers + (parseInt(curr.first_timers) || 0),
                new_converts: acc.new_converts + (parseInt(curr.new_converts) || 0),
                offering: acc.offering + (parseFloat(curr.offering) || 0),
                tithe: acc.tithe + (parseFloat(curr.tithe) || 0),
            }), { attendance: 0, first_timers: 0, new_converts: 0, offering: 0, tithe: 0 });
        },

        init() {
            this.reportModalInstance = new bootstrap.Modal(document.getElementById('reportModal'));
            this.eventModalInstance = new bootstrap.Modal(document.getElementById('createEventModal'));
            this.loadInitialData();
        },

        async loadInitialData() {
            this.loading = true;
            try {
                this.events = await getEvents();

                // Chapter Logic
                const isAdmin = this.currentUser.roles.includes('Developer') ||
                    this.currentUser.roles.includes('Zonal Admin') ||
                    this.currentUser.roles.includes('Zonal Secretary');

                if (isAdmin) {
                    this.userChapters = await getAllChapters();
                } else if (this.currentUser.chapter_id) {
                    this.userChapters = [{
                        id: this.currentUser.chapter_id,
                        chapter_name: this.currentUser.chapter_name
                    }];
                    this.reportForm.chapter_id = this.currentUser.chapter_id;
                } else {
                    this.userChapters = [];
                }
            } catch (err) {
                console.error(err);
                alert("Error loading data.");
            } finally {
                this.loading = false;
            }
        },

        // === EVENT ACTIONS ===
        openEventModal() {
            this.newEvent = { event_title: '', event_date: '' };
            this.eventModalInstance.show();
        },

        async saveEvent() {
            try {
                await createEvent({ ...this.newEvent, created_by: this.currentUser.id });
                this.eventModalInstance.hide();
                this.loadInitialData();
                alert("Event created!");
            } catch (err) { alert("Failed to create event."); }
        },

        async confirmDeleteEvent(event) {
            if (confirm(`Delete "${event.event_title}"? This deletes ALL reports in it.`)) {
                try { await deleteEvent(event.id); this.loadInitialData(); }
                catch (err) { alert("Failed to delete."); }
            }
        },

        // === REPORT ACTIONS ===
        async loadReportsForEvent() {
            if (!this.selectedEventId) { this.currentReports = []; return; }
            this.loading = true;
            try {
                this.currentReports = await getReportsForEvent(this.selectedEventId);
            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },

        openReportModal() {
            this.isEditingReport = false;
            // Reset form but keep chapter if user only has one
            const defaultChapter = (this.userChapters.length === 1) ? this.userChapters[0].id : '';
            this.reportForm = { id: null, chapter_id: defaultChapter, attendance: 0, first_timers: 0, new_converts: 0, holy_ghost_filled: 0, offering: 0, tithe: 0 };
            this.reportModalInstance.show();
        },

        editReport(report) {
            this.isEditingReport = true;
            this.reportForm = { ...report };
            this.reportModalInstance.show();
        },

        async saveReport() {
            const payload = {
                attendance: this.reportForm.attendance,
                first_timers: this.reportForm.first_timers,
                new_converts: this.reportForm.new_converts,
                holy_ghost_filled: this.reportForm.holy_ghost_filled,
                offering: this.reportForm.offering,
                tithe: this.reportForm.tithe,
                submitted_by: this.currentUser.id
            };

            try {
                if (this.isEditingReport) {
                    await updateReport(this.reportForm.id, payload);
                } else {
                    payload.event_id = this.selectedEventId;
                    payload.chapter_id = this.reportForm.chapter_id;
                    await submitReport(payload);
                }
                this.reportModalInstance.hide();
                this.loadReportsForEvent();
            } catch (err) {
                // --- NEW ERROR LOGIC ---
                const message = err.response?.data?.error || 'Failed to save report.';
                alert(message);
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return '';
            return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        },
        formatCurrency(amount) { return 'R ' + Number(amount).toFixed(2); }
    }));
});