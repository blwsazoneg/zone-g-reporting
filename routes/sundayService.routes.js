import express from 'express';
import { query } from '../db.js';
import { protect, restrictTo } from '../authMiddleware.js'; // <-- IMPORT

const router = express.Router();

router.use(protect);

// === SUNDAY SERVICE EVENTS ===
/**
 * @description Create a new Sunday Service Event
 * @body { "event_title": "string", "event_date": "YYYY-MM-DD", "created_by": "user_id" }
 */
router.post('/events', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { event_title, event_date, created_by } = req.body;
    if (!event_title || !event_date || !created_by) {
        return res.status(400).json({
            error: 'Event title, event date and created_by user ID are required.'
        });
    }

    try {
        const result = await query(
            'INSERT INTO SundayServiceEvents (event_title, event_date, created_by) VALUES ($1, $2, $3) RETURNING *',
            [event_title, event_date, created_by]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating Sunday Service event:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

/** 
 * @description Get a list of all Sunday Service Events
 */
router.get('/events', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM SundayServiceEvents ORDER BY event_date DESC'
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching Sunday service events:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

/**
 * @description Update a Sunday Service Event
 * @body { "event_title": "string", "event_date": "YYYY-MM-DD" }
 */
router.put('/events/:id', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { id } = req.params;
    const { event_title, event_date } = req.body;

    if (!event_title || !event_date) {
        return res.status(400).json({
            error: 'Event title and event date are required.'
        });
    }

    try {
        const result = await query(
            'UPDATE SundayServiceEvents SET event_title = $1, event_date = $2 WHERE id = $3 RETURNING *',
            [event_title, event_date, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating Sunday service event:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

/**
 * @description Delete a Sunday Service Event (and all its reports due to CASCADE)
 */
router.delete('/events/:id', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            'DELETE FROM SundayServiceEvents WHERE id = $1 RETURNING *', [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }
        res.status(204).send(); // Success, no content
    } catch (error) {
        console.error('Error deleting Sunday service event:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

// === SUNDAY SERVICE REPORTS API ENDPOINTS ===

/**
 * @description Submit a new Sunday Service Report for a specific event and chapter
 * @body { "event_id", "chapter_id", "submitted_by", "attendance", "first_timers", "new_converts", "holy_ghost_filled", "offering", "tithe" }
 */
router.post('/', restrictTo('Developer', 'Zonal Admin', 'Group Admin', 'Chapter Admin'), async (req, res) => {
    const {
        event_id, chapter_id, submitted_by, attendance, first_timers,
        new_converts, holy_ghost_filled, offering, tithe
    } = req.body;

    // Basic validation
    if (!event_id || !chapter_id || !submitted_by) {
        return res.status(400).json({ error: 'event_id, chapter_id, and submitted_by are required.' });
    }

    try {
        const result = await query(
            `INSERT INTO SundayServiceReports (event_id, chapter_id, submitted_by, attendance, first_timers, new_converts, holy_ghost_filled, offering, tithe)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [event_id, chapter_id, submitted_by, attendance, first_timers, new_converts, holy_ghost_filled, offering, tithe]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        // Handle the unique constraint violation (chapter already submitted for this event)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'A report for this chapter has already been submitted for this event.' });
        }
        console.error('Error submitting Sunday service report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @description Get all reports for a specific event, including chapter and group names
 */
router.get('/event/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
        const result = await query(`
            SELECT 
                ssr.*,
                ch.chapter_name,
                g.group_name
            FROM SundayServiceReports ssr
            JOIN Chapters ch ON ssr.chapter_id = ch.id
            JOIN Groups g ON ch.group_id = g.id
            WHERE ssr.event_id = $1
            ORDER BY g.group_name, ch.chapter_name
        `, [eventId]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching reports for event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @description Update an existing Sunday Service Report
 * @body { "attendance", "first_timers", "new_converts", "holy_ghost_filled", "offering", "tithe", "submitted_by" }
 */
router.put('/:reportId', restrictTo('Developer', 'Zonal Admin', 'Group Admin', 'Chapter Admin'), async (req, res) => {
    const { reportId } = req.params;
    const {
        attendance, first_timers, new_converts, holy_ghost_filled, offering, tithe, submitted_by
    } = req.body;

    if (!submitted_by) {
        return res.status(400).json({ error: 'submitted_by (the user ID of the editor) is required.' });
    }

    try {
        const result = await query(
            `UPDATE SundayServiceReports 
             SET 
                attendance = $1, 
                first_timers = $2, 
                new_converts = $3, 
                holy_ghost_filled = $4, 
                offering = $5, 
                tithe = $6, 
                submitted_by = $7,
                last_updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [attendance, first_timers, new_converts, holy_ghost_filled, offering, tithe, submitted_by, reportId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating Sunday service report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;