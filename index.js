// --- Imports ---
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import all the router files
import authRoutes from './routes/auth.routes.js'; // Auth routes are now separate
import groupRoutes from './routes/groups.routes.js';
import chapterRoutes from './routes/chapters.routes.js';
import userRoutes from './routes/users.routes.js';
import sundayServiceRoutes from './routes/sundayService.routes.js';
import campRoutes from './routes/camp.routes.js';
import pfccRoutes from './routes/pfcc.routes.js';
import financeRoutes from './routes/finance.routes.js';
import materialsRoutes from './routes/materials.routes.js';
import hslhsRoutes from './routes/hslhs.routes.js';

// --- App Initialization ---
const app = express();
const PORT = 3000;

// RATE LIMITING INITIALIZATION

// General Limiter: Allow 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requuests from this IP, please try again in 15 minutes.'
});

// Auth limiter: Allow only 10 login attempts per hour
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many login attempts from this IP, please try again in 1 hour.'
});

// --- Middleware ---
app.use(express.json());

// --- Serve Static Files ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// =================================================================
// --- THE FIX IS HERE ---
// =================================================================

// --- APPLY LIMITERS ---

// Apply strict limit to auth routes
app.use('/api/auth', authLimiter);

// Apply general limit to all other API routes
app.use('/api', apiLimiter);


// 1. PUBLIC API ROUTES
// These routes do NOT require a token. They come first.
app.use('/api/auth', authRoutes);


// 2. PROTECTED API ROUTES
// All routes defined after this point will be protected by the middleware
// that we placed inside each respective router file.
app.use('/api/groups', groupRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports/sunday', sundayServiceRoutes); // More specific path
app.use('/api/reports/camp', campRoutes);         // More specific path
app.use('/api/reports/pfcc', pfccRoutes);
app.use('/api/reports/finance', financeRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/reports/hslhs', hslhsRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('BLW SA Zone G DSP Reporting API is running!');
});

// A catch-all for frontend routing (helps with refresh issues in single-page apps)
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });


// --- Server Start ---
// Only listen on port if running locally. Vercel handles this automatically.
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export the app for Vercel
export default app;