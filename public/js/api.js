// public/js/api.js
import { getToken } from './auth.js';

// Create a pre-configured instance of axios
const api = axios.create({
    baseURL: 'http://localhost:3000/api', // All requests will be prefixed with this
});

// This is an interceptor. It's a function that runs BEFORE every single request is sent.
api.interceptors.request.use(
    (config) => {
        // Get the token from our auth module
        const token = getToken();
        if (token) {
            // If the token exists, add it to the Authorization header
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config; // Continue with the request
    },
    (error) => {
        // Handle request errors
        return Promise.reject(error);
    }
);

export default api;