// src/routes/viewer.js — Viewer/student routes (all authenticated)
const router = require('express').Router();
const pool = require('../db');
const r2 = require('../storage/r2');
const { log } = require('../helpers/activity');

const TYPE_LABELS = { N: 'Notes', A: 'Assignments', P: 'Presentations', T: 'Tests', S: 'Sources' };
const TYPE_ICONS  = { N: 'notebook-pen', A: 'clipboard-list', P: 'presentation', T: 'file-check', S: 'library' };
const TYPE_COLORS = { N: '#4F6EF7', A: '#F59E0B', P: '#8B5CF6', T: '#EF4444', S: '#22C55E' };

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { rows: [semester] } = await pool.query(
      `SELECT s.*, (SELECT COUNT(*) FROM courses WHERE semester_id = s.id) AS course_count
       FROM semesters s WHERE s.status = 'active' ORDER BY s.created_at DESC LIMIT 1`
    );
    const counts = {};
    if (semester) {
      const { rows } = await pool.query(
        `SELECT type, COUNT(*) FROM napts_items ni
         JOIN courses c ON c.id = ni.course_id WHERE c.semester_id = $1 GROUP BY type`,
        [semester.id]
      );
      rows.forEach(r => { counts[r.type] = parseInt(r.count); });
    }
    const { rows: recent } = await pool.query(
      `SELECT ni.*, c.name AS course_name FROM napts_items ni
       JOIN courses c ON c.id = ni.course_id
       ORDER BY ni.created_at DESC LIMIT 6`
    );
    res.render('dashboard', { title: 'Dashboard', semester, counts, recent, TYPE_LABELS, TYPE_ICONS, TYPE_COLORS });
  } catch (e) { console.error(e); res.render('error', { title: 'Error', code: 500, message: e.message }); }
});

// Semester view
router.get('/semester/:id', async (req, res) => {
  try {
    const { rows: [semester] } = await pool.query('SELECT * FROM semesters WHERE id = $1', [req.params.id]);
    if (!semester) return res.status(404).render('error', { title: 'Not Found', code: 404, message: 'Semester not found.' });
    const { rows: courses } = await pool.query(
      `SELECT c.*, COUNT(ni.id) AS item_count FROM courses c
       LEFT JOIN napts_items ni ON ni.course_id = c.id
       WHERE c.semester_id = $1 GROUP BY c.id ORDER BY c.name`,
      [semester.id]
    );
    res.render('semester', { title: semester.name, semester, courses });
  } catch (e) { res.render('error', { title: 'Error', code: 500, message: e.message }); }
});

// Course view (NAPTS tabs)
router.get('/course/:id', async (req, res) => {
  const type = req.query.type || 'N';
  try {
    const { rows: [course] } = await pool.query(
      'SELECT c.*, s.name AS semester_name, s.status AS semester_status FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE c.id = $1',
      [req.params.id]
    );
    if (!course) return res.status(404).render('error', { title: 'Not Found', code: 404, message: 'Course not found.' });
    const { rows: items } = await pool.query(
      `SELECT * FROM napts_items WHERE course_id = $1 AND type = $2 ORDER BY created_at DESC`,
      [course.id, type]
    );
    const { rows: typeCounts } = await pool.query(
      `SELECT type, COUNT(*) FROM napts_items WHERE course_id = $1 GROUP BY type`,
      [course.id]
    );
    const counts = {};
    typeCounts.forEach(r => { counts[r.type] = parseInt(r.count); });
    res.render('course', { title: course.name, course, items, activeType: type, counts, TYPE_LABELS, TYPE_ICONS, TYPE_COLORS });
  } catch (e) { res.render('error', { title: 'Error', code: 500, message: e.message }); }
});

// Item view
router.get('/item/:id', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query(
      `SELECT ni.*, c.name AS course_name, c.id AS course_id, s.name AS semester_name
       FROM napts_items ni JOIN courses c ON c.id = ni.course_id JOIN semesters s ON s.id = c.semester_id
       WHERE ni.id = $1`,
      [req.params.id]
    );
    if (!item) return res.status(404).render('error', { title: 'Not Found', code: 404, message: 'Item not found.' });
    const fileUrl = item.file_key ? await r2.signedUrl(item.file_key) : null;
    res.render('item', { title: item.title, item, fileUrl, TYPE_LABELS, TYPE_ICONS, TYPE_COLORS });
  } catch (e) { res.render('error', { title: 'Error', code: 500, message: e.message }); }
});

// Download — bumps count + redirects to signed URL
router.get('/item/:id/download', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query('SELECT * FROM napts_items WHERE id = $1', [req.params.id]);
    if (!item || !item.file_key) return res.status(404).send('File not found');
    await pool.query('UPDATE napts_items SET download_count = download_count + 1 WHERE id = $1', [item.id]);
    await log(req.session.user.id, 'download', `Downloaded: ${item.title}`, req, { metadata: { item_id: item.id } });
    const url = await r2.signedUrl(item.file_key, 300); // 5 min URL
    res.redirect(url);
  } catch (e) { res.status(500).send('Download error'); }
});

// Archives
router.get('/archives', async (req, res) => {
  try {
    const { rows: semesters } = await pool.query(
      `SELECT s.*, json_agg(c ORDER BY c.name) AS courses
       FROM semesters s LEFT JOIN courses c ON c.semester_id = s.id
       WHERE s.status = 'archived' GROUP BY s.id ORDER BY s.created_at DESC`
    );
    res.render('archives', { title: 'Archives', semesters });
  } catch (e) { res.render('error', { title: 'Error', code: 500, message: e.message }); }
});

module.exports = router;
