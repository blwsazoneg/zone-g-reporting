// We import the bundled SDK we just created.
import './kc-sdk-bundle.js';

// KingsChat SDK is now available on the global 'kingsChatWebSdk' object
const kcSdk = window.kingsChatWebSdk;

const API_URL = 'https://zone-g-reporting.vercel.app/api'; // Our backend API
const KC_CLIENT_ID = 'c2aafff1-d440-4900-9267-f3757d425451'; // IMPORTANT: Replace with your actual Client ID

// CONFIGURATION

// Inacivity - time in milliseconds before auto-logout (15 minutes [15 * 60 * 1000])
const INACTIVITY_LIMIT = 900000;

let authToken = null;
let currentUser = null;
let inactivityTimer;

// Function to handle the login process
export async function login() {
    try {
        const loginOptions = {
            clientId: KC_CLIENT_ID,
            scopes: ['profile'], // Request access to user's profile
        };

        // 1. Get the accessToken directly from the KingsChat SDK
        const tokenResponse = await kcSdk.login(loginOptions);
        const { accessToken } = tokenResponse;

        if (!accessToken) {
            throw new Error('Could not retrieve accessToken from KingsChat SDK.');
        }

        // 2. Send this accessToken to our backend for verification and session creation
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: accessToken }), // <-- We are now sending the accessToken
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Backend authentication failed.');
        }

        const session = await response.json();

        // 3. Store the token and user data in localStorage
        localStorage.setItem('authToken', session.token);
        localStorage.setItem('currentUser', JSON.stringify(session.user));

        // 4. Redirect to a dashboard page
        window.location.href = '/dashboard.html';

    } catch (error) {
        console.error('Login failed:', error);
        alert(`Login failed: ${error.message}`);
    }
}

// Function to handle logout
export function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    // Clear the timer so it does not fire after logout
    clearTimeout(inactivityTimer);
    window.location.href = '/index.html'; // Redirect to login page
}

// Function to get the stored auth token
export function getToken() {
    if (!authToken) {
        authToken = localStorage.getItem('authToken');
    }
    return authToken;
}

// Function to get the current user's data
export function getCurrentUser() {
    if (!currentUser) {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            currentUser = JSON.parse(userStr);
        }
    }
    return currentUser;
}

// Function to check if a user is currently logged in
export function isAuthenticated() {
    return !!getToken();
}

// AUTO-LOGOUT LOGIC
function resetInactivityTimer() {
    // Clear existing timer
    if (inactivityTimer) clearTimeout(inactivityTimer);

    // If the user is logged in, start a new timer
    if (isAuthenticated()) {
        inactivityTimer = setTimeout(() => {
            alert('You have been logged out due to inactivity.');
            logout();
        }, INACTIVITY_LIMIT);
    }
}

function setupActivityListeners() {
    // List of events that count as "activity"
    const events = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart'
    ];

    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });

    // Start the timer immediately upon load
    resetInactivityTimer();
}

// Initialize listeners immediately if this file is imported
setupActivityListeners();