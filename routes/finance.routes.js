// routes/finance.routes.js
import express from 'express';
import { query, pool } from '../db.js';
import multer from 'multer';
import Papa from 'papaparse';
import { protect, restrictTo } from '../authMiddleware.js'; // <-- IMPORT

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.use(protect);

// === MONTHLY GROUP FINANCE REPORTS ===

/**
 * @api {post} /api/reports/finance/group-monthly
 * @description Submit or update a monthly finance report for a group (UPSERT).
 */
router.post('/group-monthly', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager', 'Group Finance Officer'), async (req, res) => {
    const {
        group_id, report_month, submitted_by,
        general_offerings, seed_offerings, alter_seeds, tithes, first_fruits,
        thanksgiving, communion_offering, number_of_tithers, number_of_new_tithers
    } = req.body;

    if (!group_id || !report_month || !submitted_by) {
        return res.status(400).json({ error: 'group_id, report_month, and submitted_by are required.' });
    }

    try {
        const upsertQuery = `
            INSERT INTO FinanceMonthlyGroupReports (
                group_id, report_month, submitted_by, general_offerings, seed_offerings, alter_seeds,
                tithes, first_fruits, thanksgiving, communion_offering, number_of_tithers, number_of_new_tithers
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (group_id, report_month)
            DO UPDATE SET
                submitted_by = EXCLUDED.submitted_by,
                general_offerings = EXCLUDED.general_offerings,
                seed_offerings = EXCLUDED.seed_offerings,
                alter_seeds = EXCLUDED.alter_seeds,
                tithes = EXCLUDED.tithes,
                first_fruits = EXCLUDED.first_fruits,
                thanksgiving = EXCLUDED.thanksgiving,
                communion_offering = EXCLUDED.communion_offering,
                number_of_tithers = EXCLUDED.number_of_tithers,
                number_of_new_tithers = EXCLUDED.number_of_new_tithers,
                last_updated_at = NOW()
            RETURNING *;
        `;
        const result = await query(upsertQuery, [
            group_id, report_month, submitted_by, general_offerings, seed_offerings, alter_seeds,
            tithes, first_fruits, thanksgiving, communion_offering, number_of_tithers, number_of_new_tithers
        ]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting monthly group finance report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/reports/finance/group-monthly
 * @description Get monthly finance reports, optionally filtered by group_id and year.
 * @query {string} [group_id] - UUID of the group to filter by.
 * @query {number} [year] - The year to filter by (e.g., 2025).
 */
router.get('/group-monthly', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager', 'Group Finance Officer'), async (req, res) => {
    const { group_id, year } = req.query;

    let filterQuery = '';
    const params = [];

    if (group_id) {
        params.push(group_id);
        filterQuery += ` WHERE f.group_id = $${params.length}`;
    }
    if (year) {
        params.push(year);
        filterQuery += (params.length > 1 ? ' AND' : ' WHERE') + ` EXTRACT(YEAR FROM f.report_month) = $${params.length}`;
    }

    try {
        const result = await query(`
            SELECT f.*, g.group_name
            FROM FinanceMonthlyGroupReports f
            JOIN Groups g ON f.group_id = g.id
            ${filterQuery}
            ORDER BY f.report_month DESC, g.group_name
        `, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching monthly group finance reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {delete} /api/reports/finance/group-monthly/:reportId
 * @description Delete a monthly group finance report.
 */
router.delete('/group-monthly/:reportId', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager'), async (req, res) => {
    const { reportId } = req.params;
    try {
        const result = await query('DELETE FROM FinanceMonthlyGroupReports WHERE id = $1 RETURNING *', [reportId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting monthly group finance report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// === PASTOR TITHE RECORDS ===

/**
 * @api {post} /api/reports/finance/pastor-tithe
 * @description Submit or update a pastor's tithe record for a year (UPSERT).
 */
router.post('/pastor-tithe', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager', 'Group Finance Officer'), async (req, res) => {
    // Destructure all expected fields from the request body
    const {
        pastor_user_id, group_id, record_year, submitted_by, first_fruits,
        jan_tithe, feb_tithe, mar_tithe, apr_tithe, may_tithe, jun_tithe,
        jul_tithe, aug_tithe, sep_tithe, oct_tithe, nov_tithe, dec_tithe
    } = req.body;

    if (!pastor_user_id || !group_id || !record_year || !submitted_by) {
        return res.status(400).json({ error: 'pastor_user_id, group_id, record_year, and submitted_by are required.' });
    }

    try {
        const upsertQuery = `
            INSERT INTO FinancePastorTitheRecords (
                pastor_user_id, group_id, record_year, submitted_by, first_fruits,
                jan_tithe, feb_tithe, mar_tithe, apr_tithe, may_tithe, jun_tithe,
                jul_tithe, aug_tithe, sep_tithe, oct_tithe, nov_tithe, dec_tithe
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (pastor_user_id, record_year)
            DO UPDATE SET
                group_id = EXCLUDED.group_id,
                submitted_by = EXCLUDED.submitted_by,
                first_fruits = EXCLUDED.first_fruits,
                jan_tithe = EXCLUDED.jan_tithe, feb_tithe = EXCLUDED.feb_tithe, mar_tithe = EXCLUDED.mar_tithe,
                apr_tithe = EXCLUDED.apr_tithe, may_tithe = EXCLUDED.may_tithe, jun_tithe = EXCLUDED.jun_tithe,
                jul_tithe = EXCLUDED.jul_tithe, aug_tithe = EXCLUDED.aug_tithe, sep_tithe = EXCLUDED.sep_tithe,
                oct_tithe = EXCLUDED.oct_tithe, nov_tithe = EXCLUDED.nov_tithe, dec_tithe = EXCLUDED.dec_tithe,
                last_updated_at = NOW()
            RETURNING *;
        `;

        const result = await query(upsertQuery, [
            pastor_user_id, group_id, record_year, submitted_by, first_fruits,
            jan_tithe, feb_tithe, mar_tithe, apr_tithe, may_tithe, jun_tithe,
            jul_tithe, aug_tithe, sep_tithe, oct_tithe, nov_tithe, dec_tithe
        ]);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        // Handle case where pastor_user_id doesn't exist in Users table
        if (error.code === '23503') {
            return res.status(404).json({ error: 'The specified pastor user ID does not exist.' });
        }
        console.error('Error submitting pastor tithe record:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/reports/finance/pastor-tithe
 * @description Get pastor tithe records, filtered by group_id and/or year.
 * @query {string} [group_id] - UUID of the group to filter by.
 * @query {number} [year] - The year to filter by (e.g., 2025).
 */
router.get('/pastor-tithe', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager', 'Group Finance Officer'), async (req, res) => {
    const { group_id, year } = req.query;

    let filterQuery = 'WHERE 1=1'; // Start with a truthy condition
    const params = [];

    if (group_id) {
        params.push(group_id);
        filterQuery += ` AND f.group_id = $${params.length}`;
    }
    if (year) {
        params.push(year);
        filterQuery += ` AND f.record_year = $${params.length}`;
    }

    try {
        // We join with Users to get the pastor's name and Groups to get the group name
        const result = await query(`
            SELECT
                f.*,
                u.full_name AS pastor_name,
                g.group_name
            FROM FinancePastorTitheRecords f
            JOIN Users u ON f.pastor_user_id = u.id
            JOIN Groups g ON f.group_id = g.id
            ${filterQuery}
            ORDER BY g.group_name, u.full_name, f.record_year DESC
        `, params);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching pastor tithe records:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {delete} /api/reports/finance/pastor-tithe/:recordId
 * @description Delete a pastor's tithe record.
 */
router.delete('/pastor-tithe/:recordId', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager'), async (req, res) => {
    const { recordId } = req.params;
    try {
        const result = await query('DELETE FROM FinancePastorTitheRecords WHERE id = $1 RETURNING *', [recordId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Record not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting pastor tithe record:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// === ZONAL REMITTANCE REPORTS ===

/**
 * @api {post} /api/reports/finance/zonal-remittance
 * @description Submit or update a zonal remittance record for a year (UPSERT).
 */
router.post('/zonal-remittance', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager'), async (req, res) => {
    // Destructure all expected fields from the request body
    const {
        item_name, record_year, submitted_by,
        jan_amount, feb_amount, mar_amount, apr_amount, may_amount, jun_amount,
        jul_amount, aug_amount, sep_amount, oct_amount, nov_amount, dec_amount
    } = req.body;

    if (!item_name || !record_year || !submitted_by) {
        return res.status(400).json({ error: 'item_name, record_year, and submitted_by are required.' });
    }

    try {
        const upsertQuery = `
            INSERT INTO ZonalRemittances (
                item_name, record_year, submitted_by,
                jan_amount, feb_amount, mar_amount, apr_amount, may_amount, jun_amount,
                jul_amount, aug_amount, sep_amount, oct_amount, nov_amount, dec_amount
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (item_name, record_year)
            DO UPDATE SET
                submitted_by = EXCLUDED.submitted_by,
                jan_amount = EXCLUDED.jan_amount, feb_amount = EXCLUDED.feb_amount, mar_amount = EXCLUDED.mar_amount,
                apr_amount = EXCLUDED.apr_amount, may_amount = EXCLUDED.may_amount, jun_amount = EXCLUDED.jun_amount,
                jul_amount = EXCLUDED.jul_amount, aug_amount = EXCLUDED.aug_amount, sep_amount = EXCLUDED.sep_amount,
                oct_amount = EXCLUDED.oct_amount, nov_amount = EXCLUDED.nov_amount, dec_amount = EXCLUDED.dec_amount,
                last_updated_at = NOW()
            RETURNING *;
        `;

        const result = await query(upsertQuery, [
            item_name, record_year, submitted_by,
            jan_amount, feb_amount, mar_amount, apr_amount, may_amount, jun_amount,
            jul_amount, aug_amount, sep_amount, oct_amount, nov_amount, dec_amount
        ]);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting zonal remittance record:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/reports/finance/zonal-remittance
 * @description Get zonal remittance records, filtered by year.
 * @query {number} [year] - The year to filter by (e.g., 2025).
 */
router.get('/zonal-remittance', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager'), async (req, res) => {
    const { year } = req.query;

    let filterQuery = '';
    const params = [];

    if (year) {
        params.push(year);
        filterQuery = `WHERE record_year = $1`;
    }

    try {
        const result = await query(`
            SELECT zr.*, u.full_name AS submitted_by_name
            FROM ZonalRemittances zr
            LEFT JOIN Users u ON zr.submitted_by = u.id
            ${filterQuery}
            ORDER BY zr.item_name, zr.record_year DESC
        `, params);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching zonal remittance records:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {delete} /api/reports/finance/zonal-remittance/:recordId
 * @description Delete a zonal remittance record.
 */
router.delete('/zonal-remittance/:recordId', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager'), async (req, res) => {
    const { recordId } = req.params;
    try {
        const result = await query('DELETE FROM ZonalRemittances WHERE id = $1 RETURNING *', [recordId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Record not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting zonal remittance record:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// === INDIVIDUAL FINANCE RECORDS UPLOAD ===

/**
 * @api {post} /api/reports/finance/individual-records/upload
 * @description Upload a CSV file of individual tithe and giving records for a group for a specific year.
 */
router.post('/individual-records/upload', restrictTo('Developer', 'Group Finance Officer'), upload.single('recordsFile'), async (req, res) => {
    const { group_id, record_year, uploaded_by } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'No file was uploaded.' });
    }
    if (!group_id || !record_year || !uploaded_by) {
        return res.status(400).json({ error: 'group_id, record_year, and uploaded_by are required.' });
    }

    const client = await pool.connect();
    try {
        const csvData = req.file.buffer.toString('utf8');
        const parsed = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim().toLowerCase(), // Standardize headers
        });

        const records = parsed.data;
        if (records.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or contains no data rows.' });
        }

        await client.query('BEGIN');

        await client.query('DELETE FROM FinanceIndividualRecords WHERE group_id = $1 AND record_year = $2', [group_id, record_year]);

        // This query now casts every non-text column to its correct database type.
        const insertQuery = `
            INSERT INTO FinanceIndividualRecords (
                group_id, chapter_id, title, full_name, contact_number, leadership_role,
                is_new_tither, record_year, first_fruits, thanksgiving,
                jan_tithe, feb_tithe, mar_tithe, apr_tithe, may_tithe, jun_tithe,
                jul_tithe, aug_tithe, sep_tithe, oct_tithe, nov_tithe, dec_tithe, uploaded_by
            )
            SELECT
                p.group_id::uuid,
                ch.id AS chapter_id,
                p.title, p.full_name, p.contact_number, p.leadership_role,
                p.is_new_tither::boolean,
                p.record_year::integer,
                p.first_fruits::numeric, p.thanksgiving::numeric,
                p.jan_tithe::numeric, p.feb_tithe::numeric, p.mar_tithe::numeric,
                p.apr_tithe::numeric, p.may_tithe::numeric, p.jun_tithe::numeric,
                p.jul_tithe::numeric, p.aug_tithe::numeric, p.sep_tithe::numeric,
                p.oct_tithe::numeric, p.nov_tithe::numeric, p.dec_tithe::numeric,
                p.uploaded_by::uuid
            FROM
                (VALUES ${records.map((_, i) => `($${i * 23 + 1}, $${i * 23 + 2}, $${i * 23 + 3}, $${i * 23 + 4}, $${i * 23 + 5}, $${i * 23 + 6}, $${i * 23 + 7}, $${i * 23 + 8}, $${i * 23 + 9}, $${i * 23 + 10}, $${i * 23 + 11}, $${i * 23 + 12}, $${i * 23 + 13}, $${i * 23 + 14}, $${i * 23 + 15}, $${i * 23 + 16}, $${i * 23 + 17}, $${i * 23 + 18}, $${i * 23 + 19}, $${i * 23 + 20}, $${i * 23 + 21}, $${i * 23 + 22}, $${i * 23 + 23})`).join(', ')})
                AS p(group_id, chapter_name, title, full_name, contact_number, leadership_role, is_new_tither, record_year, first_fruits, thanksgiving, jan_tithe, feb_tithe, mar_tithe, apr_tithe, may_tithe, jun_tithe, jul_tithe, aug_tithe, sep_tithe, oct_tithe, nov_tithe, dec_tithe, uploaded_by)
            LEFT JOIN
                Chapters ch ON ch.chapter_name = p.chapter_name;
        `;

        // The JS-side data preparation remains the same. The fix is purely in the SQL query string.
        const flatParams = records.flatMap(record => {
            // Standardize CSV header names to lowercase for robust matching
            const rec = Object.fromEntries(Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]));
            return [
                group_id,
                rec.chapter,
                rec.title,
                `${rec.name || ''} ${rec.surname || ''}`.trim(),
                rec['contact number'],
                rec['leadership role'],
                rec['new tither?']?.toLowerCase() === 'yes',
                record_year,
                parseFloat(rec['first fruits']) || 0,
                parseFloat(rec.thanksgiving) || 0,
                parseFloat(rec.january) || 0, parseFloat(rec.february) || 0, parseFloat(rec.march) || 0,
                parseFloat(rec.april) || 0, parseFloat(rec.may) || 0, parseFloat(rec.june) || 0,
                parseFloat(rec.july) || 0, parseFloat(rec.august) || 0, parseFloat(rec.september) || 0,
                parseFloat(rec.october) || 0, parseFloat(rec.november) || 0, parseFloat(rec.december) || 0,
                uploaded_by
            ];
        });

        await client.query(insertQuery, flatParams);

        await client.query('COMMIT');
        res.status(201).json({ message: `${records.length} individual records successfully uploaded for group ${group_id} for the year ${record_year}.` });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error processing individual records upload:', e);
        res.status(500).json({ error: 'Failed to process CSV file.' });
    } finally {
        client.release();
    }
});

/**
 * @api {get} /api/reports/finance/individual-records
 * @description Get individual finance records, filtered by group, chapter, and/or year.
 */
router.get('/individual-records', restrictTo('Developer', 'Zonal Admin', 'Zonal Finance Manager', 'Group Finance Officer'), async (req, res) => {
    const { group_id, chapter_id, year } = req.query;

    let filterQuery = 'WHERE 1=1';
    const params = [];

    if (group_id) {
        params.push(group_id);
        filterQuery += ` AND f.group_id = $${params.length}`;
    }
    if (chapter_id) {
        params.push(chapter_id);
        filterQuery += ` AND f.chapter_id = $${params.length}`;
    }
    if (year) {
        params.push(year);
        filterQuery += ` AND f.record_year = $${params.length}`;
    }

    try {
        const result = await query(`
            SELECT f.*, ch.chapter_name, g.group_name
            FROM FinanceIndividualRecords f
            LEFT JOIN Chapters ch ON f.chapter_id = ch.id
            LEFT JOIN Groups g ON f.group_id = g.id
            ${filterQuery}
            ORDER BY g.group_name, ch.chapter_name, f.full_name
        `, params);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching individual finance records:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;