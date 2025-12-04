// routes/auth.routes.js
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// IMPORTANT: Add these secrets to your .env file
const KC_CLIENT_ID = process.env.KC_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

if (!KC_CLIENT_ID || !JWT_SECRET) {
    console.error("FATAL ERROR: KingsChat Client ID and JWT Secret must be defined in .env file.");
    process.exit(1); // Exit the application if secrets are not set
}


/**
 * @api {post} /api/auth/login (CORRECTED)
 * @description Handles the KingsChat login flow.
 * Receives an accessToken from the client, uses it to get the user's profile,
 * verifies the user exists, and returns a session JWT.
 */
router.post('/login', async (req, res) => {
    const { accessToken } = req.body; // <-- We now expect an accessToken

    if (!accessToken) {
        return res.status(400).json({ error: 'KingsChat access token is required.' });
    }

    try {
        // Step 1: Use the access token provided by the client to get the user's profile
        // This step securely verifies that the token is valid and belongs to a real user.
        const profileResponse = await axios.get('https://connect.kingsch.at/developer/api/profile', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const kcProfile = profileResponse.data?.profile; // Get the whole profile object

        const kingschatUsername = profileResponse.data?.profile?.username; // Use optional chaining for safety

        if (!kingschatUsername) {
            return res.status(401).json({ error: 'Failed to retrieve KingsChat username from token.' });
        }

        // Step 2: Check if the user exists in our database
        // --- NEW LOGIC START ---
        // We assume the user exists, but we want to update their avatar URL every time they login
        // to keep it fresh.
        let userResult = await query(`
            UPDATE Users 
            SET avatar_url = $1 
            WHERE kingschat_username = $2 
            RETURNING *
        `, [kcProfile.avatar, kingschatUsername]);


        // If UPDATE returned no rows, it means user doesn't exist (or we need to fetch them to check)
        if (userResult.rows.length === 0) {
            return res.status(403).json({ error: 'User is not authorized to access this application.' });
        }

        // Re-fetch with Chapter Name (since the UPDATE above didn't join tables)
        userResult = await query(`
            SELECT u.*, c.chapter_name 
            FROM Users u 
            LEFT JOIN Chapters c ON u.chapter_id = c.id 
            WHERE u.kingschat_username = $1
        `, [kingschatUsername]);

        const user = userResult.rows[0];

        // Step 3: Get the user's roles from our database
        const rolesResult = await query(
            'SELECT r.role_name FROM Roles r JOIN UserRoles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
            [user.id]
        );
        const roles = rolesResult.rows.map(r => r.role_name);

        // Step 4: Generate our application's session JWT
        const payload = {
            userId: user.id,
            username: user.kingschat_username,
            roles: roles,
        };

        const sessionToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        // Step 5: Send the session token and user info back to the frontend
        res.status(200).json({
            token: sessionToken,
            user: {
                id: user.id,
                fullName: user.full_name,
                username: user.kingschat_username,
                avatarUrl: user.avatar_url, // <--- Add this
                roles: roles,
                chapter_id: user.chapter_id,
                chapter_name: user.chapter_name
            }
        });

    } catch (error) {
        // If KingsChat returns a 401, it means the token was invalid.
        if (error.response && error.response.status === 401) {
            return res.status(401).json({ error: 'Invalid or expired KingsChat access token.' });
        }
        console.error('KingsChat login error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'An error occurred during the login process.' });
    }
});



export default router;