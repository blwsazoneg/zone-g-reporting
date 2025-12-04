import express from 'express';
import { query } from '../db.js';
import { protect, restrictTo } from '../authMiddleware.js'; // <-- IMPORT

const router = express.Router();

// Apply authentication to ALL routes in this file
router.use(protect);

/**
 * @description Create a new chapter and link it to a group
 * @body { "chapter_name": "string", "group_id": "UUID" }
 */
router.post('/', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { chapter_name, group_id } = req.body;

    // Validate that both chapter_name and group_id are provided
    if (!chapter_name || !group_id) {
        return res.status(400).json({
            error: 'Chapter name and group ID are required'
        });
    }

    try {
        // We first check if the group_id provided actually exists in the Groups table
        const groupExists = await query(
            'SELECT id FROM Groups WHERE id = $1', [group_id]
        );
        if (groupExists.rows.length === 0) {
            return res.status(404).json({
                error: 'The specified group does not exist.'
            });
        }

        const result = await query(
            'INSERT INTO Chapters (chapter_name, group_id) VALUES ($1, $2) RETURNING *',
            [chapter_name, group_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        // Handle potential duplicate chapter name error
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                error: 'A chapter with this name already exists.'
            });
        }
        console.error('Error creating chapter:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/chapters
 * @description Get a list of all chapters, including their group name
 */
router.get('/', async (req, res) => {
    try {
        // We use a JOIN to fetch the group_name from the Groups table along with chapter details
        const result = await query(`
      SELECT 
        c.id, 
        c.chapter_name, 
        c.group_id, 
        g.group_name 
      FROM Chapters c
      LEFT JOIN Groups g ON c.group_id = g.id
      ORDER BY g.group_name, c.chapter_name
    `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching chapters:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

/**
 * @api {get} /api/chapters/:id
 * @description Get a single chapter by its ID, including its group name
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(`
      SELECT 
        c.id, 
        c.chapter_name, 
        c.group_id, 
        g.group_name 
      FROM Chapters c
      LEFT JOIN Groups g ON c.group_id = g.id
      WHERE c.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Chapter not found'
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

/**
 * @description Update an existing chapter's name or its parent group
 * @body { "chapter_name": "string", "group_id": "UUID" } (at least one is required)
 */
router.put('/:id', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { id } = req.params;
    const { chapter_name, group_id } = req.body;

    // A chapter must have a name, so we only update if it's provided.
    // A group_id can also be updated.
    if (!chapter_name && !group_id) {
        return res.status(400).json({
            error: 'At least one field (chapter_name or group_id) is required to update.'
        });
    }

    try {
        // If a new group_id is provided, validate it first
        if (group_id) {
            const groupExists = await query(
                'SELECT id FROM Groups WHERE id = $1', [group_id]
            );
            if (groupExists.rows.length === 0) {
                return res.status(404).json({
                    error: 'The specified group does not exist.'
                });
            }
        }

        // Build the query dynamically based on which fields are provided
        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (chapter_name) {
            fields.push(`chapter_name = $${queryIndex++}`);
            values.push(chapter_name);
        }
        if (group_id) {
            fields.push(`group_id = $${queryIndex++}`);
            values.push(group_id);
        }

        values.push(id); // The WHERE clause parameter

        const updateQuery = `UPDATE Chapters SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`;

        const result = await query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Chapter not found'
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'A chapter with this name already exists.'
            });
        }
        console.error('Error updating chapter:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});


/**
 * @api {delete} /api/chapters/:id
 * @description Delete a chapter
 */
router.delete('/:id', restrictTo('Developer'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            'DELETE FROM Chapters WHERE id = $1 RETURNING *', [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Chapter not found'
            });
        }
        // Successfully deleted, return 204 No Content
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting chapter:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

export default router;