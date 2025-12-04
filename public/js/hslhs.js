import { logout, getCurrentUser, isAuthenticated } from './auth.js';
import { getAllGroups } from './services/groupService.js';
import { submitHslhsReport, getHslhsReports, deleteHslhsReport } from './services/hslhsService.js';

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
    Alpine.data('hslhsComponent', () => ({
        activeTab: 'submit',
        currentUser: getCurrentUser(),
        groups: [],
        reports: [],
        loading: false,

        // --- Search & Pagination ---
        searchQuery: '',
        currentPage: 1,
        pageSize: 5, // Larger cards, so fewer per page looks better

        // Form Object (Full Schema)
        form: {
            group_id: '', program_title: '',
            prayer_clouds_activated: 0, prayer_clouds_prayed: 0, prayer_cloud_target: 0, total_prayer_clouds: 0, hours_prayed: 0, prayer_outreaches: 0,
            magazines_distributed: 0, flyers_distributed: 0, tshirts_printed: 0, healing_outreaches: 0,
            online_souls_reached: 0, online_souls_won: 0, online_views: 0, online_followers: 0,
            online_comments: 0, online_likes: 0, online_videos_posted: 0, online_flyers_posted: 0,
            celebrities_reached: 0, dignitaries_reached: 0,
            feedback_texts_received: 0, feedback_calls_received: 0, feedback_people_reached_out: 0,
            pen_souls_reached_campus: 0, pen_souls_reached_res: 0, pen_souls_reached_hospital: 0, pen_families_reached: 0, pen_souls_won: 0,
            pen_campuses_reached: 0, pen_residences_reached: 0, pen_hospitals_reached: 0, pen_other_centers_visited_list: '',
            reg_individuals: 0, reg_families: 0, reg_sick_disabled: 0,
            reg_physical_centers: 0, reg_confirmed_strategic_centers: 0,
            herald_total: 0, herald_bulk_registrations: 0, herald_amplify_registrations: 0, herald_countries_amplified: 0, herald_total_zonal_registrations: 0,
            partnership_total_amount: 0, partnership_new_partners: 0, partnership_helper_initiatives: 0, partnership_total_partners: 0,
            att_physical_centers_count: 0, att_family_centers_count: 0, att_virtual_centers_count: 0, att_hospital_centers_count: 0, att_targeted_countries_count: 0,
            att_total_physical_center: 0, att_total_family_center: 0, att_total_virtual_center: 0,
            att_total_hospital_center: 0, att_total_other_center: 0, att_total_individual: 0,
            att_total_first_timers: 0, att_total_new_converts: 0, att_testimonies: 0, att_general_total: 0
        },

        modal: { title: '', body: '' },
        modalInstance: null,

        // --- Computed Properties ---
        get filteredReports() {
            if (!this.searchQuery) return this.reports;
            const q = this.searchQuery.toLowerCase();
            return this.reports.filter(r =>
                r.program_title.toLowerCase().includes(q) ||
                r.group_name.toLowerCase().includes(q)
            );
        },

        get totalPages() { return Math.ceil(this.filteredReports.length / this.pageSize) || 1; },

        get paginatedReports() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredReports.slice(start, start + this.pageSize);
        },

        init() {
            this.modalInstance = new bootstrap.Modal(document.getElementById('statusModal'));
            this.loadInitialData();
            this.loadReports();
        },

        async loadInitialData() {
            try { this.groups = await getAllGroups(); } catch (err) { console.error(err); }
        },

        async loadReports() {
            this.loading = true;
            try { this.reports = await getHslhsReports(); } catch (err) { console.error(err); }
            finally { this.loading = false; }
        },

        async submitForm() {
            try {
                const payload = { ...this.form, submitted_by: this.currentUser.id };
                await submitHslhsReport(payload);
                this.showModal("Success", "Report Submitted Successfully");
                this.loadReports();
            } catch (err) {
                this.showModal("Error", "Failed to submit report. Please check inputs.");
                console.error(err);
            }
        },

        async deleteReport(id) {
            if (!confirm("Are you sure you want to delete this report?")) return;
            try {
                await deleteHslhsReport(id);
                this.loadReports();
            } catch (err) { this.showModal("Error", "Delete failed"); }
        },

        showModal(title, body) {
            this.modal.title = title;
            this.modal.body = body;
            this.modalInstance.show();
        },

        formatCurrency(a) { return 'R ' + Number(a).toFixed(2); },
        formatDate(d) { return new Date(d).toLocaleDateString(); }
    }));
});