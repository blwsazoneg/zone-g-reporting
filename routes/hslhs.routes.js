// routes/hslhs.routes.js
import express from 'express';
import { query } from '../db.js';
import { protect, restrictTo } from '../authMiddleware.js'; // <-- IMPORT

const router = express.Router();
router.use(protect);

/**
 * @api {post} /api/reports/hslhs
 * @description Submit or update a comprehensive HSLHS report for a group (UPSERT).
 */
router.post('/', restrictTo('Developer', 'Zonal Admin', 'Zonal Healing Streams Manager', 'Group Healing Streams Officer'), async (req, res) => {
    // Dynamically get all column names from the request body
    const { group_id, program_title, submitted_by, ...fields } = req.body;

    if (!group_id || !program_title || !submitted_by) {
        return res.status(400).json({ error: 'group_id, program_title, and submitted_by are required.' });
    }

    // Prepare for UPSERT
    const columns = ['group_id', 'program_title', 'submitted_by', ...Object.keys(fields)];
    const values = [group_id, program_title, submitted_by, ...Object.values(fields)];
    const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    const updateSet = Object.keys(fields).map(key => `${key} = EXCLUDED.${key}`).join(', ');

    try {
        const upsertQuery = `
            INSERT INTO HSLHSReports (${columns.join(', ')})
            VALUES (${valuePlaceholders})
            ON CONFLICT (group_id, program_title)
            DO UPDATE SET
                ${updateSet},
                submitted_by = EXCLUDED.submitted_by,
                last_updated_at = NOW()
            RETURNING *;
        `;
        const result = await query(upsertQuery, values);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting HSLHS report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/reports/hslhs
 * @description Get HSLHS reports, filterable by group_id and/or program_title.
 */
router.get('/', async (req, res) => {
    const { group_id, program_title } = req.query;

    let filterQuery = 'WHERE 1=1';
    const params = [];

    if (group_id) {
        params.push(group_id);
        filterQuery += ` AND r.group_id = $${params.length}`;
    }
    if (program_title) {
        params.push(program_title);
        filterQuery += ` AND r.program_title ILIKE $${params.length}`; // Case-insensitive search
    }

    try {
        const result = await query(`
            SELECT r.*, g.group_name
            FROM HSLHSReports r
            JOIN Groups g ON r.group_id = g.id
            ${filterQuery}
            ORDER BY r.created_at DESC, g.group_name
        `, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching HSLHS reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {delete} /api/reports/hslhs/:reportId
 * @description Delete an HSLHS report.
 */
router.delete('/:reportId', restrictTo('Developer', 'Zonal Admin', 'Zonal Healing Streams Manager', 'Group Healing Streams Officer'), async (req, res) => {
    const { reportId } = req.params;
    try {
        const result = await query('DELETE FROM HSLHSReports WHERE id = $1 RETURNING *', [reportId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'HSLHS Report not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting HSLHS report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;