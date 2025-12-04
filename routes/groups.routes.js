import express from 'express';
import { query } from '../db.js';
import { protect, restrictTo } from '../authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes below are protected

// POST /api/groups
/**
 * @description Create a new group
 */
router.post('/', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { group_name } = req.body;
    if (!group_name) return res.status(400).json({ error: 'Group name is required' });
    try {
        const result = await query('INSERT INTO Groups (group_name) VALUES ($1) RETURNING *', [group_name]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'A group with this name already exists.' });
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/groups
/**
 * @description Get a list of all groups
 */
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM Groups ORDER BY group_name');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/groups/:id
/**
 * @description Get a single group by its ID
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query('SELECT * FROM Groups WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Group not found' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/groups/:id
/**
 * @description Update an existing group's name
 */
router.put('/:id', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { id } = req.params;
    const { group_name } = req.body;
    if (!group_name) return res.status(400).json({ error: 'Group name is required' });
    try {
        const result = await query('UPDATE Groups SET group_name = $1 WHERE id = $2 RETURNING *', [group_name, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Group not found' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'A group with this name already exists.' });
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/groups/:id
/**
 * @description Delete a group
 */
router.delete('/:id', restrictTo('Developer'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query('DELETE FROM Groups WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Group not found' });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); 

export default router;