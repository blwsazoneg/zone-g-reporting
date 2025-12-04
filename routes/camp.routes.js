import express from 'express';
import { query, pool } from '../db.js';
import multer from 'multer';
import Papa from 'papaparse';
import { protect, restrictTo } from '../authMiddleware.js'; // <-- IMPORT
import { Readable } from 'stream';

const router = express.Router();
const upload = multer({ stirage: multer.memoryStorage() });

router.use(protect);

// === CAMP EVENTS API ENDPOINTS ===

/**
 * @description Create a new Camp Event
 * @body { "camp_title": "string", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "created_by": "user_id" }
 */
router.post('/events', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { camp_title, start_date, end_date, created_by } = req.body;
    if (!camp_title || !created_by) {
        return res.status(400).json({ error: 'Camp title and created_by user ID are required.' });
    }

    try {
        const result = await query(
            'INSERT INTO CampEvents (camp_title, start_date, end_date, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [camp_title, start_date, end_date, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating camp event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/events/camp
 * @description Get a list of all Camp Events
 */
router.get('/events', async (req, res) => {
    try {
        const result = await query('SELECT * FROM CampEvents ORDER BY start_date DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching camp events:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {put} /api/events/camp/:id
 * @description Update a Camp Event
 * @body { "camp_title": "string", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD" }
 */
router.put('/events/:id', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { id } = req.params;
    const { camp_title, start_date, end_date } = req.body;

    if (!camp_title) {
        return res.status(400).json({ error: 'Camp title is required.' });
    }

    try {
        const result = await query(
            'UPDATE CampEvents SET camp_title = $1, start_date = $2, end_date = $3 WHERE id = $4 RETURNING *',
            [camp_title, start_date, end_date, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Camp event not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating camp event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {delete} /api/events/camp/:id
 * @description Delete a Camp Event (and all its associated reports and attendees)
 */
router.delete('/events/:id', restrictTo('Developer', 'Zonal Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query('DELETE FROM CampEvents WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Camp event not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting camp event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// === CAMP REPORTS API ENDPOINTS ===

/**
 * @api {post} /api/reports/camp/attendance
 * @description Submit or update daily attendance for a chapter
 */
router.post('/attendance', restrictTo('Developer', 'Zonal Admin', 'Group Admin', 'Chapter Admin'), async (req, res) => {
    const { camp_id, chapter_id, submitted_by, report_date, attendance_count } = req.body;
    if (!camp_id || !chapter_id || !submitted_by || !report_date || attendance_count === undefined) {
        return res.status(400).json({ error: 'camp_id, chapter_id, submitted_by, report_date, and attendance_count are required.' });
    }

    try {
        // This is an "UPSERT" operation. It tries to INSERT, but if the unique constraint (camp_id, chapter_id, report_date)
        // is violated, it will UPDATE the existing row instead. This is perfect for daily attendance.
        const upsertQuery = `
            INSERT INTO CampChapterAttendance (camp_id, chapter_id, submitted_by, report_date, attendance_count)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (camp_id, chapter_id, report_date)
            DO UPDATE SET 
                attendance_count = EXCLUDED.attendance_count,
                submitted_by = EXCLUDED.submitted_by,
                last_updated_at = NOW()
            RETURNING *;
        `;
        const result = await query(upsertQuery, [camp_id, chapter_id, submitted_by, report_date, attendance_count]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting camp attendance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {post} /api/reports/camp/summary
 * @description Submit or update a group's summary report for a camp
 */
router.post('/summary', restrictTo('Developer', 'Zonal Admin', 'Group Admin'), async (req, res) => {
    const { camp_id, group_id, submitted_by, ...summaryFields } = req.body;
    if (!camp_id || !group_id || !submitted_by) {
        return res.status(400).json({ error: 'camp_id, group_id, and submitted_by are required.' });
    }

    try {
        // Another "UPSERT" to allow group admins to submit and later edit their summary
        const upsertQuery = `
            INSERT INTO CampGroupSummaries (camp_id, group_id, submitted_by, total_pastors, total_coordinators, total_leaders, total_members, total_first_timers, total_baptised)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (camp_id, group_id)
            DO UPDATE SET
                total_pastors = EXCLUDED.total_pastors,
                total_coordinators = EXCLUDED.total_coordinators,
                total_leaders = EXCLUDED.total_leaders,
                total_members = EXCLUDED.total_members,
                total_first_timers = EXCLUDED.total_first_timers,
                total_baptised = EXCLUDED.total_baptised,
                submitted_by = EXCLUDED.submitted_by,
                last_updated_at = NOW()
            RETURNING *;
        `;
        const result = await query(upsertQuery, [
            camp_id, group_id, submitted_by,
            summaryFields.total_pastors || 0,
            summaryFields.total_coordinators || 0,
            summaryFields.total_leaders || 0,
            summaryFields.total_members || 0,
            summaryFields.total_first_timers || 0,
            summaryFields.total_baptised || 0
        ]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting camp group summary:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/**
 * @api {get} /api/reports/camp/:campId/full-report
 * @description Get all report data for a specific camp
 */
router.get('/:campId/full-report', async (req, res) => {
    const { campId } = req.params;
    try {
        const attendancePromise = query(`
            SELECT ca.*, ch.chapter_name, g.group_name FROM CampChapterAttendance ca
            JOIN Chapters ch ON ca.chapter_id = ch.id
            JOIN Groups g ON ch.group_id = g.id
            WHERE ca.camp_id = $1 ORDER BY ca.report_date, g.group_name
        `, [campId]);

        const summariesPromise = query(`
            SELECT cgs.*, g.group_name FROM CampGroupSummaries cgs
            JOIN Groups g ON cgs.group_id = g.id
            WHERE cgs.camp_id = $1 ORDER BY g.group_name
        `, [campId]);

        const attendeesPromise = query('SELECT * FROM CampAttendees WHERE camp_id = $1', [campId]);

        // Run all queries in parallel for efficiency
        const [attendanceResult, summariesResult, attendeesResult] = await Promise.all([
            attendancePromise,
            summariesPromise,
            attendeesPromise
        ]);

        res.status(200).json({
            daily_attendance: attendanceResult.rows,
            group_summaries: summariesResult.rows,
            attendees: attendeesResult.rows
        });

    } catch (error) {
        console.error('Error fetching full camp report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {post} /api/reports/camp/:campId/attendees/upload
 * @description Upload a CSV file of attendees for a camp
 */
router.post('/:campId/attendees/upload', restrictTo('Developer', 'Zonal Admin', 'Group Admin'), upload.single('attendeeFile'), async (req, res) => {
    const { campId } = req.params;
    const { uploaded_by, group_id } = req.body; // We need to know who uploaded and for which group

    if (!req.file) {
        return res.status(400).json({ error: 'No file was uploaded.' });
    }
    if (!uploaded_by || !group_id) {
        return res.status(400).json({ error: 'uploaded_by (user ID) and group_id are required.' });
    }

    try {
        // Convert the file buffer to a string for parsing
        const csvData = req.file.buffer.toString('utf8');

        // Use PapaParse to convert CSV string to JSON
        const parsed = Papa.parse(csvData, {
            header: true, // This assumes the first row of the CSV is the header
            skipEmptyLines: true,
        });

        const attendees = parsed.data;

        // Start a database transaction
        const client = await pool.connect(); // Assuming you've imported 'pool' from '../db.js'
        try {
            await client.query('BEGIN');

            // Optional: Delete previous attendees for this group to prevent duplicates on re-upload
            await client.query('DELETE FROM CampAttendees WHERE camp_id = $1 AND group_id = $2', [campId, group_id]);

            // Loop through each parsed row and insert into the database
            for (const attendee of attendees) {
                const insertQuery = `
                    INSERT INTO CampAttendees (camp_id, group_id, title, full_name, chapter_name, got_tshirt, uploaded_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;
                // Normalize "yes/no" to boolean
                const gotTshirt = attendee['got the t-shirt']?.toLowerCase() === 'yes';

                await client.query(insertQuery, [
                    campId,
                    group_id,
                    attendee.title,
                    attendee['full name'], // Access by header name
                    attendee.chapter,
                    gotTshirt,
                    uploaded_by
                ]);
            }

            await client.query('COMMIT'); // Commit the transaction
            res.status(201).json({ message: `${attendees.length} attendees successfully uploaded.` });

        } catch (e) {
            await client.query('ROLLBACK'); // Rollback on error
            throw e;
        } finally {
            client.release(); // Release the client back to the pool
        }

    } catch (error) {
        console.error('Error processing attendee upload:', error);
        res.status(500).json({ error: 'Failed to process CSV file.' });
    }
});

export default router;