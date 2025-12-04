import { logout, getCurrentUser, isAuthenticated } from './auth.js';
import { getAllGroups } from './services/groupService.js';
import { getAllUsers } from './services/userService.js';
import {
    submitGroupMonthly, getGroupMonthly,
    submitPastorTithe, getPastorTithe,
    submitZonalRemittance, getZonalRemittance,
    uploadIndividualRecords, getIndividualRecords
} from './services/financeService.js';

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
    Alpine.data('financeComponent', () => ({
        activeTab: 'monthly',
        currentUser: getCurrentUser(),
        groups: [],
        users: [],

        // Data Lists
        monthlyReports: [],
        pastorTithes: [],
        individualRecords: [],
        remittances: [],

        // UI State
        loading: false,
        searchQuery: '',
        currentPage: 1,
        pageSize: 9,

        // Selected Item for Details Modal
        selectedItem: null,

        months: [
            { key: 'jan_tithe', remittanceKey: 'jan_amount', label: 'Jan' },
            { key: 'feb_tithe', remittanceKey: 'feb_amount', label: 'Feb' },
            { key: 'mar_tithe', remittanceKey: 'mar_amount', label: 'Mar' },
            { key: 'apr_tithe', remittanceKey: 'apr_amount', label: 'Apr' },
            { key: 'may_tithe', remittanceKey: 'may_amount', label: 'May' },
            { key: 'jun_tithe', remittanceKey: 'jun_amount', label: 'Jun' },
            { key: 'jul_tithe', remittanceKey: 'jul_amount', label: 'Jul' },
            { key: 'aug_tithe', remittanceKey: 'aug_amount', label: 'Aug' },
            { key: 'sep_tithe', remittanceKey: 'sep_amount', label: 'Sep' },
            { key: 'oct_tithe', remittanceKey: 'oct_amount', label: 'Oct' },
            { key: 'nov_tithe', remittanceKey: 'nov_amount', label: 'Nov' },
            { key: 'dec_tithe', remittanceKey: 'dec_amount', label: 'Dec' }
        ],

        // Forms
        monthlyForm: { group_id: '', report_month: '', general_offerings: 0, seed_offerings: 0, alter_seeds: 0, tithes: 0, first_fruits: 0, thanksgiving: 0, communion_offering: 0, number_of_tithers: 0, number_of_new_tithers: 0 },
        pastorForm: { group_id: '', pastor_user_id: '', record_year: new Date().getFullYear(), first_fruits: 0 },
        remittanceForm: { item_name: '', record_year: new Date().getFullYear() },
        uploadForm: { group_id: '', record_year: new Date().getFullYear() },

        // Modals
        statusModalInstance: null,
        detailsModalInstance: null,
        modalTitle: '', modalBody: '',

        // Permissions
        get isDeveloper() { return this.currentUser.roles.includes('Developer'); },
        get isZonalFinance() { return this.isDeveloper || this.currentUser.roles.includes('Zonal Finance Manager'); },
        get isGroupFinance() { return this.isDeveloper || this.currentUser.roles.includes('Group Finance Officer') || this.isZonalFinance; },
        get canViewGeneral() { return this.isGroupFinance; },

        // --- DYNAMIC FILTERING & PAGINATION ---
        get filteredList() {
            const q = this.searchQuery.toLowerCase();
            let list = [];

            if (this.activeTab === 'monthly') list = this.monthlyReports;
            else if (this.activeTab === 'pastor') list = this.pastorTithes;
            else if (this.activeTab === 'upload') list = this.individualRecords;
            else if (this.activeTab === 'remittance') list = this.remittances;

            if (!q) return list;

            return list.filter(item => {
                // Generic search based on common fields
                return (item.group_name && item.group_name.toLowerCase().includes(q)) ||
                    (item.pastor_name && item.pastor_name.toLowerCase().includes(q)) ||
                    (item.full_name && item.full_name.toLowerCase().includes(q)) ||
                    (item.item_name && item.item_name.toLowerCase().includes(q));
            });
        },

        get totalPages() { return Math.ceil(this.filteredList.length / this.pageSize) || 1; },

        get paginatedList() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredList.slice(start, start + this.pageSize);
        },

        init() {
            this.statusModalInstance = new bootstrap.Modal(document.getElementById('statusModal'));
            this.detailsModalInstance = new bootstrap.Modal(document.getElementById('detailsModal'));

            this.months.forEach(m => {
                this.pastorForm[m.key] = 0;
                this.remittanceForm[m.remittanceKey] = 0;
            });

            this.loadInitialData();
            this.switchTab('monthly');
        },

        async loadInitialData() {
            try {
                this.groups = await getAllGroups();
                this.users = await getAllUsers();
            } catch (err) { console.error(err); }
        },

        switchTab(tabName) {
            this.activeTab = tabName;
            this.searchQuery = ''; // Reset search
            this.currentPage = 1;  // Reset page

            if (tabName === 'monthly') this.loadMonthlyReports();
            if (tabName === 'pastor') this.loadPastorTithes();
            if (tabName === 'upload') this.loadIndividualRecords();
            if (tabName === 'remittance') this.loadRemittances();
        },

        // --- DATA LOADING ---
        async loadMonthlyReports() { this.loading = true; try { this.monthlyReports = await getGroupMonthly(); } catch (err) { console.error(err); } finally { this.loading = false; } },
        async loadPastorTithes() { this.loading = true; try { this.pastorTithes = await getPastorTithe(); } catch (err) { console.error(err); } finally { this.loading = false; } },
        async loadIndividualRecords() {
            if (!this.uploadForm.group_id || !this.uploadForm.record_year) { this.individualRecords = []; return; }
            this.loading = true;
            try { this.individualRecords = await getIndividualRecords({ group_id: this.uploadForm.group_id, year: this.uploadForm.record_year }); } catch (err) { console.error(err); } finally { this.loading = false; }
        },
        async loadRemittances() { this.loading = true; try { this.remittances = await getZonalRemittance(); } catch (err) { console.error(err); } finally { this.loading = false; } },

        // --- ACTIONS ---
        viewDetails(item) {
            this.selectedItem = item;
            this.detailsModalInstance.show();
        },

        async submitMonthlyForm() {
            try {
                await submitGroupMonthly({ ...this.monthlyForm, submitted_by: this.currentUser.id });
                this.showModal("Success", "Report Submitted");
                this.loadMonthlyReports();
            } catch (err) { this.showModal("Error", "Failed to submit report"); }
        },

        async submitPastorForm() {
            try {
                await submitPastorTithe({ ...this.pastorForm, submitted_by: this.currentUser.id });
                this.showModal("Success", "Record Saved");
                this.loadPastorTithes();
            } catch (err) { this.showModal("Error", "Failed to save record"); }
        },

        async submitRemittanceForm() {
            try {
                await submitZonalRemittance({ ...this.remittanceForm, submitted_by: this.currentUser.id });
                this.showModal("Success", "Record Saved");
                this.loadRemittances();
            } catch (err) { this.showModal("Error", "Failed to save remittance"); }
        },

        async submitUpload() {
            const file = this.$refs.recordsFile.files[0];
            if (!file) return this.showModal("Error", "Select file");
            const formData = new FormData();
            formData.append('recordsFile', file);
            formData.append('group_id', this.uploadForm.group_id);
            formData.append('record_year', this.uploadForm.record_year);
            formData.append('uploaded_by', this.currentUser.id);

            try {
                this.loading = true;
                const res = await uploadIndividualRecords(formData);
                this.showModal("Success", res.message);
                this.$refs.recordsFile.value = '';
                this.loadIndividualRecords();
            } catch (err) { this.showModal("Error", "Upload failed"); }
            finally { this.loading = false; }
        },

        showModal(title, body) {
            this.modalTitle = title;
            this.modalBody = body;
            this.statusModalInstance.show();
        },
        formatDate(d) { return new Date(d).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); },
        formatCurrency(a) { return 'R ' + Number(a).toFixed(2); }
    }));
});