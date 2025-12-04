import express from 'express';
import { query } from '../db.js';
import { protect, restrictTo } from '../authMiddleware.js'; // <-- IMPORT

const router = express.Router();

router.use(protect);

// === ROLES ROUTES ===

/**
 * @description Create a new role
 */
router.post('/roles', restrictTo('Developer'), async (req, res) => {
    const { role_name } = req.body;
    if (!role_name) {
        return res.status(400).json({
            error: 'Role name is required'
        });
    }

    try {
        const result = await query(
            'INSERT INTO Roles (role_name) VALUES ($1) RETURNING *',
            [role_name.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'A role with this name already exists.'
            });
        }
        console.error('Error creating role:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

/**
 * @description Get a list of all roles
 */
router.get('/roles', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM Roles ORDER BY id'
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

// === USERS ROUTES ===

/**
 * @description Create a new user
 */
router.post('/', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { kingschat_username, full_name, email, contact_number, chapter_id } = req.body;

    if (!kingschat_username || !full_name || !chapter_id) {
        return res.status(400).json({
            error: 'KingsChat handle, full name and chapter ID are required.'
        });
    }

    try {
        // Check if chapter_id is valid before inserting
        const chapterExists = await query(
            'SELECT id FROM Chapters WHERE id = $1', [chapter_id]
        );
        if (chapterExists.rows.length === 0) {
            return res.status(404).json({
                error: 'The specified chapter does not exists.'
            });
        }

        const result = await query(
            `INSERT INTO Users 
            (kingschat_username, full_name, email, contact_number, chapter_id) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [kingschat_username, full_name, email, contact_number, chapter_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Handle unique username violation
            return res.status(409).json({
                error: 'A user with this KingsChat username already exists.'
            });
        }
        console.error('Error creating user:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

/**
 * @description Get a list of all users with their chapter and group info
 */
router.get('/', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    try {
        const result = await query(`
      SELECT 
        u.id, 
        u.kingschat_username, 
        u.full_name, 
        u.email, 
        u.contact_number,
        u.chapter_id,
        u.avatar_url,  -- <--- THIS WAS MISSING. WE ADD IT HERE.
        ch.chapter_name,
        g.group_name
      FROM Users u
      LEFT JOIN Chapters ch ON u.chapter_id = ch.id
      LEFT JOIN Groups g ON ch.group_id = g.id
      ORDER BY u.full_name
    `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @description Get a single user by their ID
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(`
        SELECT 
            u.id, u.kingschat_username, u.full_name, u.email, u.contact_number,
            u.chapter_id, ch.chapter_name, g.group_name
        FROM Users u
        LEFT JOIN Chapters ch ON u.chapter_id = ch.id
        LEFT JOIN Groups g ON ch.group_id = g.id
        WHERE u.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});


/**
 * @description Update a user's details
 */
router.put('/:id', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { id } = req.params;
    const { kingschat_username, full_name, email, contact_number, chapter_id } = req.body;

    // We can build the query dynamically to only update fields that are provided.
    // This is more robust than the chapter update logic we wrote earlier.
    const existingUser = await query('SELECT * FROM Users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    const newKingschatUsername = kingschat_username || existingUser.rows[0].kingschat_username;
    const newFullName = full_name || existingUser.rows[0].full_name;
    const newEmail = email || existingUser.rows[0].email;
    const newContactNumber = contact_number || existingUser.rows[0].contact_number;
    const newChapterId = chapter_id || existingUser.rows[0].chapter_id;

    try {
        const result = await query(
            `UPDATE Users SET 
                kingschat_username = $1, 
                full_name = $2, 
                email = $3, 
                contact_number = $4, 
                chapter_id = $5 
             WHERE id = $6 RETURNING *`,
            [newKingschatUsername, newFullName, newEmail, newContactNumber, newChapterId, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'A user with this KingsChat username already exists.'
            });
        }
        console.error('Error updating user:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});


/**
 * @description Delete a user
 */
router.delete('/:id', restrictTo('Developer'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            'DELETE FROM Users WHERE id = $1 RETURNING *', [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        res.status(204).send(); // Success, no content
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

// === USER-ROLE ASSIGNMENT ROUTES ===

/**
 * @description Assign one or more roles to a user
 */
router.post('/:userId/roles', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { userId } = req.params;
    const { roles } = req.body; // Expect an array of role IDs, e.g., [1, 5]

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: 'An array of role IDs is required.' });
    }

    try {
        // We will insert all roles in a single transaction for efficiency
        // First, let's delete existing roles for this user to make it a simple "set" operation
        await query('DELETE FROM UserRoles WHERE user_id = $1', [userId]);

        // Now, prepare the multi-value insert statement
        const values = roles.map((roleId, index) => `($1, $${index + 2})`).join(', ');
        const params = [userId, ...roles];

        const insertQuery = `INSERT INTO UserRoles (user_id, role_id) VALUES ${values}`;

        await query(insertQuery, params);

        res.status(201).json({ message: `Roles successfully assigned to user ${userId}` });
    } catch (error) {
        // 23503 is a foreign key violation, e.g., user_id or role_id doesn't exist
        if (error.code === '23503') {
            return res.status(404).json({ error: 'Invalid user ID or one or more role IDs do not exist.' });
        }
        console.error('Error assigning roles to user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/**
 * @description Get all roles for a specific user
 */
router.get('/:userId/roles', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await query(`
            SELECT r.id, r.role_name 
            FROM Roles r
            JOIN UserRoles ur ON r.id = ur.role_id
            WHERE ur.user_id = $1
        `, [userId]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching user roles:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;