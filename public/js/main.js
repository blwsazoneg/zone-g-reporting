import { login } from './auth.js';

// Find the login button and attach the login function to its click event
const loginButton = document.getElementById('loginBtn');
if (loginButton) {
    loginButton.addEventListener('click', () => {
        login();
    });
}