import { logout, getCurrentUser, isAuthenticated } from './auth.js';
import { getCampEvents, createCampEvent, submitAttendance, submitSummary, uploadAttendees, getFullCampReport, deleteCampEvent } from './services/campService.js';
import { getAllChapters } from './services/chapterService.js';
import { getAllGroups } from './services/groupService.js';

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
    Alpine.data('campComponent', () => ({
        currentUser: getCurrentUser(),
        events: [],
        loading: false,

        // --- Search & Pagination (Events) ---
        searchQuery: '',
        currentPage: 1,
        pageSize: 9,

        // Reporting State
        selectedCampId: '',
        activeTab: 'attendance',
        userChapters: [],
        userGroups: [],
        reportData: { daily_attendance: [], group_summaries: [] },

        // Forms
        newEvent: { camp_title: '', start_date: '', end_date: '' },
        attForm: { chapter_id: '', report_date: '', attendance_count: 0 },
        sumForm: { group_id: '', total_pastors: 0, total_coordinators: 0, total_leaders: 0, total_members: 0, total_first_timers: 0, total_baptised: 0 },
        uploadForm: { group_id: '' },

        // Modals
        eventModalInstance: null,

        // --- Computed ---
        get isAdmin() {
            return this.currentUser.roles.includes('Developer') || this.currentUser.roles.includes('Zonal Admin');
        },
        get isGroupAdmin() {
            return this.isAdmin || this.currentUser.roles.includes('Group Admin') || this.currentUser.roles.includes('Group Pastor');
        },

        get filteredEvents() {
            if (!this.searchQuery) return this.events;
            return this.events.filter(e => e.camp_title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        },
        get totalPages() { return Math.ceil(this.filteredEvents.length / this.pageSize) || 1; },
        get paginatedEvents() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredEvents.slice(start, start + this.pageSize);
        },

        init() {
            this.eventModalInstance = new bootstrap.Modal(document.getElementById('createEventModal'));
            this.loadInitialData();
        },

        async loadInitialData() {
            this.loading = true;
            try {
                this.events = await getCampEvents();

                // Chapter Logic
                if (this.isAdmin || this.isGroupAdmin) {
                    this.userChapters = await getAllChapters();
                } else if (this.currentUser.chapter_id) {
                    this.userChapters = [{ id: this.currentUser.chapter_id, chapter_name: this.currentUser.chapter_name }];
                    this.attForm.chapter_id = this.currentUser.chapter_id;
                }

                // Group Logic
                this.userGroups = await getAllGroups();

            } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },

        async loadCampData() {
            if (!this.selectedCampId) return;
            if (this.isAdmin) {
                // If admin, default to showing full report view
                this.activeTab = 'view';
                try {
                    this.reportData = await getFullCampReport(this.selectedCampId);
                } catch (err) { console.error(err); }
            } else {
                this.activeTab = 'attendance';
            }
        },

        // === EVENT ACTIONS ===
        openEventModal() {
            this.newEvent = { camp_title: '', start_date: '', end_date: '' };
            this.eventModalInstance.show();
        },

        async saveEvent() {
            try {
                await createCampEvent({ ...this.newEvent, created_by: this.currentUser.id });
                this.eventModalInstance.hide();
                this.loadInitialData();
                alert("Camp Created");
            } catch (err) { alert(err.response?.data?.error || "Error creating camp"); }
        },

        async confirmDeleteEvent(event) {
            if (confirm(`Delete camp "${event.camp_title}"? This deletes ALL reports associated with it.`)) {
                try {
                    await deleteCampEvent(event.id);
                    this.loadInitialData();
                } catch (err) { alert(err.response?.data?.error || "Failed to delete camp"); }
            }
        },

        // === REPORT ACTIONS ===
        async submitAttendanceForm() {
            try {
                await submitAttendance({
                    camp_id: this.selectedCampId,
                    chapter_id: this.attForm.chapter_id,
                    report_date: this.attForm.report_date,
                    attendance_count: this.attForm.attendance_count,
                    submitted_by: this.currentUser.id
                });
                alert("Attendance Submitted");
                // Refresh view if admin
                if (this.isAdmin) this.loadCampData();
            } catch (err) { alert(err.response?.data?.error || "Error submitting attendance"); }
        },

        async submitSummaryForm() {
            try {
                await submitSummary({
                    camp_id: this.selectedCampId,
                    group_id: this.sumForm.group_id,
                    submitted_by: this.currentUser.id,
                    ...this.sumForm
                });
                alert("Summary Submitted");
            } catch (err) { alert(err.response?.data?.error || "Error submitting summary"); }
        },

        async submitUpload() {
            const file = this.$refs.attendeeFile.files[0];
            if (!file) return alert("Select a file");

            const formData = new FormData();
            formData.append('attendeeFile', file);
            formData.append('group_id', this.uploadForm.group_id);
            formData.append('uploaded_by', this.currentUser.id);

            try {
                await uploadAttendees(this.selectedCampId, formData);
                alert("Upload Successful");
                this.$refs.attendeeFile.value = '';
            } catch (err) { alert(err.response?.data?.error || "Upload Failed"); }
        },

        formatDate(d) { return new Date(d).toLocaleDateString(); }
    }));
});