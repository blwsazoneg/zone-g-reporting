// public/js/dashboard.js
import { logout, getCurrentUser, isAuthenticated } from './auth.js';
import { getAllGroups, deleteGroup, createGroup } from './services/groupService.js';

// --- Authentication Check ---
// If the user is not authenticated, redirect them to the login page.
// This is our client-side protection.
// --- SIDEBAR TOGGLE LOGIC ---
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
    Alpine.data('groupsComponent', () => ({
        groups: [],
        searchQuery: '',
        currentPage: 1,
        pageSize: 9,
        newGroupName: '',
        modalInstance: null,

        async init() {
            // const user = getCurrentUser();
            // if (user) document.getElementById('currentUserDisplay').innerText = 'Welcome,' + ' ' + user.fullName;
            // document.getElementById('logoutBtn').addEventListener('click', logout);

            this.modalInstance = new bootstrap.Modal(document.getElementById('createGroupModal'));
            await this.fetchGroups();
        },

        async fetchGroups() {
            try { this.groups = await getAllGroups(); } catch (e) { console.error(e); }
        },

        get filteredGroups() {
            if (!this.searchQuery) return this.groups;
            return this.groups.filter(g => g.group_name.toLowerCase().includes(this.searchQuery.toLowerCase()));
        },

        get totalPages() { return Math.ceil(this.filteredGroups.length / this.pageSize); },

        get paginatedGroups() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredGroups.slice(start, start + this.pageSize);
        },

        showCreateModal() { this.newGroupName = ''; this.modalInstance.show(); },

        async addGroup() {
            if (!this.newGroupName) return alert("Enter a name");
            try {
                await createGroup({ group_name: this.newGroupName });
                this.modalInstance.hide();
                await this.fetchGroups();
            } catch (err) {
                // --- NEW ERROR LOGIC ---
                // If the server sent a specific error message, use it. Otherwise, use a default.
                const message = err.response?.data?.error || 'Failed to create group.';
                alert(message);
            }
        },

        async deleteGroup(id) {
            if (!confirm("Are you sure you want to delete this group?")) return;
            try {
                await deleteGroup(id);
                await this.fetchGroups();
            } catch (err) {
                // --- NEW ERROR LOGIC ---
                const message = err.response?.data?.error || 'Failed to delete group.';
                alert(message);
            }
        }
    }));
});