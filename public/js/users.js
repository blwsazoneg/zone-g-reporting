import { logout, getCurrentUser, isAuthenticated } from './auth.js';
import { getAllChapters } from './services/chapterService.js';
import {
    getAllUsers, createUser, updateUser, deleteUser,
    getAllRoles, getUserRoles, assignRolesToUser
} from './services/userService.js';

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
    Alpine.data('usersComponent', () => ({
        // Data
        users: [],
        chapters: [],
        allRoles: [],
        loading: false,

        // Search & Pagination
        searchQuery: '',
        currentPage: 1,
        pageSize: 9,

        // Form State
        user: {
            id: null,
            full_name: '',
            kingschat_username: '',
            email: '',
            contact_number: '',
            chapter_id: '',
            assignedRoles: [],
        },
        isEditing: false,

        // Modals
        modal: { title: '', body: '', confirmText: 'Confirm', confirmAction: () => { } },
        formModalInstance: null,
        confirmModalInstance: null,

        // Computed
        get formTitle() { return this.isEditing ? 'Edit User' : 'Add New User'; },
        get formButtonText() { return this.isEditing ? 'Save Changes' : 'Create User'; },

        // --- FILTERING ---
        get filteredUsers() {
            if (!this.searchQuery) return this.users;
            const q = this.searchQuery.toLowerCase();
            return this.users.filter(u =>
                u.full_name.toLowerCase().includes(q) ||
                u.kingschat_username.toLowerCase().includes(q) ||
                (u.chapter_name && u.chapter_name.toLowerCase().includes(q))
            );
        },

        get totalPages() { return Math.ceil(this.filteredUsers.length / this.pageSize) || 1; },

        get paginatedUsers() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredUsers.slice(start, start + this.pageSize);
        },

        init() {
            this.fetchInitialData();
            this.formModalInstance = new bootstrap.Modal(document.getElementById('userFormModal'));
            this.confirmModalInstance = new bootstrap.Modal(document.getElementById('confirmationModal'));
        },

        async fetchInitialData() {
            this.loading = true;
            try {
                const [usersData, chaptersData, rolesData] = await Promise.all([
                    getAllUsers(),
                    getAllChapters(),
                    getAllRoles()
                ]);
                this.users = usersData;
                this.chapters = chaptersData;
                this.allRoles = rolesData;
            } catch (error) {
                console.error('Failed to load initial data:', error);
            } finally {
                this.loading = false;
            }
        },

        // --- ACTIONS ---
        openCreateModal() {
            this.user = { id: null, full_name: '', kingschat_username: '', email: '', contact_number: '', chapter_id: '', assignedRoles: [] };
            this.isEditing = false;
            this.formModalInstance.show();
        },

        async startEdit(userToEdit) {
            this.isEditing = true;
            // Fetch roles specifically for this user
            try {
                const userRoles = await getUserRoles(userToEdit.id);
                this.user = {
                    ...userToEdit,
                    assignedRoles: userRoles.map(role => role.id)
                };
                this.formModalInstance.show();
            } catch (error) {
                alert("Error fetching user details");
            }
        },

        async saveUser() {
            const userData = {
                full_name: this.user.full_name,
                kingschat_username: this.user.kingschat_username,
                email: this.user.email,
                contact_number: this.user.contact_number,
                chapter_id: this.user.chapter_id,
            };

            try {
                let savedUser;
                if (this.isEditing) {
                    savedUser = await updateUser(this.user.id, userData);
                } else {
                    savedUser = await createUser(userData);
                }

                // Assign Roles
                await assignRolesToUser(savedUser.id, this.user.assignedRoles);

                this.formModalInstance.hide();
                this.fetchInitialData(); // Refresh list
            } catch (error) {
                alert('Failed to save user. KC Username might already exist.');
            }
        },

        startDelete(userToDelete) {
            this.modal.title = 'Confirm Deletion';
            this.modal.body = `Are you sure you want to delete user "${userToDelete.full_name}"?`;
            this.modal.confirmText = 'Delete';
            this.modal.confirmAction = () => this.confirmDelete(userToDelete.id);
            this.confirmModalInstance.show();
        },

        async confirmDelete(userId) {
            try {
                await deleteUser(userId);
                await this.fetchInitialData();
            } catch (error) {
                alert('Failed to delete user.');
            } finally {
                this.confirmModalInstance.hide();
            }
        }
    }));
});