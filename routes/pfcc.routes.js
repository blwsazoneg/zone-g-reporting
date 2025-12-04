// routes/pfcc.routes.js
import express from 'express';
import { query } from '../db.js';
import { protect, restrictTo } from '../authMiddleware.js'; // <-- IMPORT

const router = express.Router();

router.use(protect);

/**
 * @api {post} /api/reports/pfcc
 * @description Submit or update a weekly PFCC report.
 * This uses an UPSERT model.
 */
router.post('/', restrictTo('Developer', 'Zonal Admin', 'Zonal PFCC Manager', 'Group PFCC Officer', 'Chapter PFCC Officer', 'Cell Leader', 'Cell Assistant'), async (req, res) => {
    const {
        cell_leader_id, report_date, cell_name, cell_attendance, cell_first_timers,
        new_converts, offering, cell_church_attendance, cell_church_first_timers,
        souls_reached, souls_saved, souls_retained, submitted_by
    } = req.body;

    if (!cell_leader_id || !report_date || !cell_name || !submitted_by) {
        return res.status(400).json({ error: 'cell_leader_id, report_date, cell_name, and submitted_by are required.' });
    }

    try {
        const upsertQuery = `
            INSERT INTO PFCCReports (
                cell_leader_id, report_date, cell_name, cell_attendance, cell_first_timers,
                new_converts, offering, cell_church_attendance, cell_church_first_timers,
                souls_reached, souls_saved, souls_retained, submitted_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (cell_leader_id, report_date)
            DO UPDATE SET
                cell_name = EXCLUDED.cell_name,
                cell_attendance = EXCLUDED.cell_attendance,
                cell_first_timers = EXCLUDED.cell_first_timers,
                new_converts = EXCLUDED.new_converts,
                offering = EXCLUDED.offering,
                cell_church_attendance = EXCLUDED.cell_church_attendance,
                cell_church_first_timers = EXCLUDED.cell_church_first_timers,
                souls_reached = EXCLUDED.souls_reached,
                souls_saved = EXCLUDED.souls_saved,
                souls_retained = EXCLUDED.souls_retained,
                submitted_by = EXCLUDED.submitted_by,
                last_updated_at = NOW()
            RETURNING *;
        `;

        const result = await query(upsertQuery, [
            cell_leader_id, report_date, cell_name, cell_attendance, cell_first_timers,
            new_converts, offering, cell_church_attendance, cell_church_first_timers,
            souls_reached, souls_saved, souls_retained, submitted_by
        ]);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting PFCC report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/** 
 * @api {get} /api/reports/pfcc
 * @description Get a list of all PFCC reports with user, chapter, and group info.
 * This endpoint will be expanded later with role-based filtering.
 */
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                pr.*,
                u.full_name as cell_leader_name,
                ch.chapter_name,
                g.group_name
            FROM PFCCReports pr
            JOIN Users u ON pr.cell_leader_id = u.id
            JOIN Chapters ch ON u.chapter_id = ch.id
            JOIN Groups g ON ch.group_id = g.id
            ORDER BY pr.report_date DESC, g.group_name, ch.chapter_name
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching PFCC reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/reports/pfcc/:reportId
 * @description Get a single PFCC report by its ID.
 */
router.get('/:reportId', async (req, res) => {
    const { reportId } = req.params;
    try {
        const result = await query('SELECT * FROM PFCCReports WHERE id = $1', [reportId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'PFCC report not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching PFCC report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/**
 * @api {delete} /api/reports/pfcc/:reportId
 * @description Delete a PFCC report.
 */
router.delete('/:reportId', restrictTo('Developer', 'Zonal Admin', 'Zonal PFCC Manager'), async (req, res) => {
    const { reportId } = req.params;
    try {
        const result = await query('DELETE FROM PFCCReports WHERE id = $1 RETURNING *', [reportId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'PFCC report not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting PFCC report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;