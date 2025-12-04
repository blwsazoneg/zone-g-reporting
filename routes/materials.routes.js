// routes/materials.routes.js
import express from 'express';
import { query } from '../db.js';
import { protect, restrictTo } from '../authMiddleware.js'; // <-- IMPORT

const router = express.Router();
router.use(protect);

// === BOOKS CRUD API ENDPOINTS ===

/**
 * @api {post} /api/materials/books
 * @description Add a new book to the master list.
 */
router.post('/books', restrictTo('Developer', 'Zonal Admin', 'Zonal Ministry Materials Manager', 'Group Ministry Materials Officer'), async (req, res) => {
    const { book_title, category, price, created_by } = req.body;
    if (!book_title || !category || price === undefined || !created_by) {
        return res.status(400).json({ error: 'book_title, category, price, and created_by are required.' });
    }

    try {
        const result = await query(
            'INSERT INTO Books (book_title, category, price, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [book_title, category, price, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'A book with this title already exists.' });
        }
        console.error('Error creating book:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/materials/books
 * @description Get the list of all available books.
 */
router.get('/books', async (req, res) => {
    try {
        const result = await query('SELECT * FROM Books ORDER BY category, book_title');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {put} /api/materials/books/:bookId
 * @description Update a book's details.
 */
router.put('/books/:bookId', restrictTo('Developer', 'Zonal Admin', 'Zonal Ministry Materials Manager', 'Group Ministry Materials Officer'), async (req, res) => {
    const { bookId } = req.params;
    const { book_title, category, price } = req.body;
    if (!book_title || !category || price === undefined) {
        return res.status(400).json({ error: 'book_title, category, and price are required.' });
    }

    try {
        const result = await query(
            'UPDATE Books SET book_title = $1, category = $2, price = $3 WHERE id = $4 RETURNING *',
            [book_title, category, price, bookId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Book not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'A book with this title already exists.' });
        }
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {delete} /api/materials/books/:bookId
 * @description Delete a book from the master list.
 */
router.delete('/books/:bookId', restrictTo('Developer', 'Zonal Admin', 'Zonal Ministry Materials Manager'), async (req, res) => {
    const { bookId } = req.params;
    try {
        const result = await query('DELETE FROM Books WHERE id = $1 RETURNING *', [bookId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Book not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// === MONTHLY BOOK REPORTS API ENDPOINTS ===

/**
 * @api {post} /api/materials/book-reports
 * @description Submit or update a monthly book report for a group (UPSERT).
 */
router.post('/book-reports', restrictTo('Developer', 'Zonal Admin', 'Zonal Ministry Materials Manager', 'Group Ministry Materials Officer'), async (req, res) => {
    const {
        group_id, report_month, books_ordered, mini_books_ordered,
        total_amount, book_names_details, submitted_by
    } = req.body;

    if (!group_id || !report_month || !submitted_by) {
        return res.status(400).json({ error: 'group_id, report_month, and submitted_by are required.' });
    }

    try {
        const upsertQuery = `
            INSERT INTO MinistryMaterialBookReports (
                group_id, report_month, books_ordered, mini_books_ordered,
                total_amount, book_names_details, submitted_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (group_id, report_month)
            DO UPDATE SET
                books_ordered = EXCLUDED.books_ordered,
                mini_books_ordered = EXCLUDED.mini_books_ordered,
                total_amount = EXCLUDED.total_amount,
                book_names_details = EXCLUDED.book_names_details,
                submitted_by = EXCLUDED.submitted_by,
                last_updated_at = NOW()
            RETURNING *;
        `;
        const result = await query(upsertQuery, [
            group_id, report_month, books_ordered, mini_books_ordered,
            total_amount, book_names_details, submitted_by
        ]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting monthly book report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/materials/book-reports
 * @description Get monthly book reports, filterable by group_id and/or year.
 */
router.get('/book-reports', async (req, res) => {
    const { group_id, year } = req.query;

    let filterQuery = '';
    const params = [];

    if (group_id) {
        params.push(group_id);
        filterQuery += ` WHERE r.group_id = $${params.length}`;
    }
    if (year) {
        params.push(year);
        filterQuery += (params.length > 1 ? ' AND' : ' WHERE') + ` EXTRACT(YEAR FROM r.report_month) = $${params.length}`;
    }

    try {
        const result = await query(`
            SELECT r.*, g.group_name
            FROM MinistryMaterialBookReports r
            JOIN Groups g ON r.group_id = g.id
            ${filterQuery}
            ORDER BY r.report_month DESC, g.group_name
        `, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching monthly book reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// === PCDL SUBSCRIPTIONS API ENDPOINTS ===

/**
 * @api {post} /api/materials/pcdl-subscriptions
 * @description Submit a new PCDL subscription record.
 */
router.post('/pcdl-subscriptions', restrictTo('Developer', 'Zonal Admin', 'Zonal Ministry Materials Manager', 'Group Ministry Materials Officer'), async (req, res) => {
    const {
        group_id, chapter_id, title, full_name, contact_number,
        kc_handle, leadership_role, subscription_type, commitment, submitted_by
    } = req.body;

    if (!group_id || !full_name || !submitted_by) {
        return res.status(400).json({ error: 'group_id, full_name, and submitted_by are required.' });
    }

    try {
        const result = await query(
            `INSERT INTO PcdlSubscriptions (
                group_id, chapter_id, title, full_name, contact_number,
                kc_handle, leadership_role, subscription_type, commitment, submitted_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                group_id, chapter_id, title, full_name, contact_number,
                kc_handle, leadership_role, subscription_type, commitment, submitted_by
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting PCDL subscription:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /api/materials/pcdl-subscriptions
 * @description Get all PCDL subscription records, filterable.
 */
router.get('/pcdl-subscriptions', async (req, res) => {
    const { group_id, chapter_id } = req.query;

    let filterQuery = 'WHERE 1=1';
    const params = [];

    if (group_id) {
        params.push(group_id);
        filterQuery += ` AND p.group_id = $${params.length}`;
    }
    if (chapter_id) {
        params.push(chapter_id);
        filterQuery += ` AND p.chapter_id = $${params.length}`;
    }

    try {
        const result = await query(`
            SELECT
                p.*,
                g.group_name,
                ch.chapter_name
            FROM PcdlSubscriptions p
            JOIN Groups g ON p.group_id = g.id
            LEFT JOIN Chapters ch ON p.chapter_id = ch.id
            ${filterQuery}
            ORDER BY p.created_at DESC
        `, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching PCDL subscriptions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {delete} /api/materials/pcdl-subscriptions/:subId
 * @description Delete a PCDL subscription record.
 */
router.delete('/pcdl-subscriptions/:subId', restrictTo('Developer', 'Zonal Admin', 'Zonal Ministry Materials Manager', 'Group Ministry Materials Officer'), async (req, res) => {
    const { subId } = req.params;
    try {
        const result = await query('DELETE FROM PcdlSubscriptions WHERE id = $1 RETURNING *', [subId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Subscription record not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting PCDL subscription:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;