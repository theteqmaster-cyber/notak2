// src/routes/admin.js — Admin-only routes
const router = require('express').Router();
const multer = require('multer');
const { v4: uuid } = require('crypto').webcrypto ? { v4: () => require('crypto').randomUUID() } : { v4: require('crypto').randomUUID.bind(require('crypto')) };
const pool = require('../db');
const r2 = require('../storage/r2');
const { log } = require('../helpers/activity');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB

const TYPE_LABELS = { N: 'Notes', A: 'Assignments', P: 'Presentations', T: 'Tests', S: 'Sources' };

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [totals, typeCounts, recent] = await Promise.all([
      pool.query(`SELECT
        (SELECT COUNT(*) FROM napts_items) AS items,
        (SELECT COUNT(*) FROM courses) AS courses,
        (SELECT COUNT(*) FROM users WHERE role='viewer') AS students,
        (SELECT COUNT(*) FROM semesters) AS semesters`),
      pool.query(`SELECT type, COUNT(*) FROM napts_items GROUP BY type`),
      pool.query(`SELECT ni.*, c.name AS course_name FROM napts_items ni
                  JOIN courses c ON c.id = ni.course_id ORDER BY ni.created_at DESC LIMIT 8`),
    ]);
    const stats = { ...totals.rows[0], types: {} };
    typeCounts.rows.forEach(r => { stats.types[r.type] = parseInt(r.count); });
    res.render('admin/dashboard', { title: 'Admin Dashboard', stats, recent: recent.rows, TYPE_LABELS });
  } catch (e) { res.render('error', { title: 'Error', code: 500, message: e.message }); }
});

// ── Semesters ─────────────────────────────────────────────────────────────────
router.get('/semesters', async (req, res) => {
  const { rows } = await pool.query(`SELECT s.*, COUNT(c.id) AS course_count FROM semesters s LEFT JOIN courses c ON c.semester_id = s.id GROUP BY s.id ORDER BY s.created_at DESC`);
  res.render('admin/semesters', { title: 'Semesters', semesters: rows });
});

router.post('/semesters', async (req, res) => {
  const { name, academic_year, start_date, end_date } = req.body;
  if (!name) return res.redirect('/admin/semesters');
  await pool.query(`UPDATE semesters SET status='archived' WHERE status='active'`);
  await pool.query(`INSERT INTO semesters (name,academic_year,start_date,end_date) VALUES ($1,$2,$3,$4)`, [name, academic_year||null, start_date||null, end_date||null]);
  await log(req.session.user.id, 'semester_created', `Created semester: ${name}`, req);
  res.redirect('/admin/semesters');
});

router.post('/semesters/:id/archive', async (req, res) => {
  await pool.query(`UPDATE semesters SET status='archived', end_date=NOW() WHERE id=$1`, [req.params.id]);
  await log(req.session.user.id, 'semester_archived', `Archived semester #${req.params.id}`, req);
  res.redirect('/admin/semesters');
});

// ── Courses ───────────────────────────────────────────────────────────────────
router.get('/courses', async (req, res) => {
  const { rows: courses } = await pool.query(`SELECT c.*, s.name AS semester_name, COUNT(ni.id) AS item_count FROM courses c JOIN semesters s ON s.id = c.semester_id LEFT JOIN napts_items ni ON ni.course_id = c.id GROUP BY c.id, s.name ORDER BY s.created_at DESC, c.name`);
  const { rows: [active] } = await pool.query(`SELECT id, name FROM semesters WHERE status='active' LIMIT 1`);
  res.render('admin/courses', { title: 'Courses', courses, activeSemester: active || null });
});

router.post('/courses', async (req, res) => {
  const { name, code, color, semester_id } = req.body;
  if (!name || !semester_id) return res.redirect('/admin/courses');
  await pool.query(`INSERT INTO courses (semester_id,name,code,color) VALUES ($1,$2,$3,$4)`, [semester_id, name, code||null, color||'#4F6EF7']);
  await log(req.session.user.id, 'course_created', `Created course: ${name}`, req);
  res.redirect('/admin/courses');
});

router.post('/courses/:id/delete', async (req, res) => {
  await pool.query('DELETE FROM courses WHERE id=$1', [req.params.id]);
  res.redirect('/admin/courses');
});

// ── Upload ────────────────────────────────────────────────────────────────────
router.get('/upload', async (req, res) => {
  const { rows: courses } = await pool.query(`SELECT c.id, c.name, s.name AS semester_name FROM courses c JOIN semesters s ON s.id=c.semester_id WHERE s.status='active' ORDER BY c.name`);
  res.render('admin/upload', { title: 'Upload Material', courses, TYPE_LABELS, error: null, old: {} });
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const { course_id, type, title, description, tags, external_url } = req.body;
  const { rows: courses } = await pool.query(`SELECT c.id, c.name, s.name AS semester_name FROM courses c JOIN semesters s ON s.id=c.semester_id WHERE s.status='active' ORDER BY c.name`);
  const fail = (msg) => res.render('admin/upload', { title: 'Upload Material', courses, TYPE_LABELS, error: msg, old: req.body });

  if (!course_id || !type || !title) return fail('Course, type, and title are required.');
  if (!req.file && !external_url) return fail('Provide a file or an external URL.');

  let fileKey = null, fileName = null, fileMime = null, fileSize = null;
  if (req.file) {
    const ext = req.file.originalname.split('.').pop();
    fileKey = `napts/${course_id}/${type}/${require('crypto').randomUUID()}.${ext}`;
    fileName = req.file.originalname;
    fileMime = req.file.mimetype;
    fileSize = req.file.size;
    await r2.upload(fileKey, req.file.buffer, fileMime);
  }

  await pool.query(
    `INSERT INTO napts_items (course_id,uploaded_by,type,title,description,tags,file_key,file_name,file_mime,file_size,external_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [course_id, req.session.user.id, type, title, description||null, tags||null, fileKey, fileName, fileMime, fileSize, external_url||null]
  );
  await log(req.session.user.id, 'upload', `Uploaded: ${title} (${TYPE_LABELS[type]})`, req);
  res.redirect('/admin');
});

// ── Items ─────────────────────────────────────────────────────────────────────
router.get('/items', async (req, res) => {
  const { type, search, course } = req.query;
  let q = `SELECT ni.*, c.name AS course_name, s.name AS semester_name
           FROM napts_items ni JOIN courses c ON c.id=ni.course_id JOIN semesters s ON s.id=c.semester_id WHERE 1=1`;
  const params = [];
  if (type)   { params.push(type);   q += ` AND ni.type=$${params.length}`; }
  if (course) { params.push(course); q += ` AND ni.course_id=$${params.length}`; }
  if (search) { params.push(`%${search}%`); q += ` AND ni.title ILIKE $${params.length}`; }
  q += ' ORDER BY ni.created_at DESC LIMIT 100';
  const { rows: items } = await pool.query(q, params);
  const { rows: courses } = await pool.query('SELECT id, name FROM courses ORDER BY name');
  res.render('admin/items', { title: 'All Items', items, courses, filters: req.query, TYPE_LABELS });
});

router.post('/items/:id/delete', async (req, res) => {
  const { rows: [item] } = await pool.query('SELECT file_key FROM napts_items WHERE id=$1', [req.params.id]);
  if (item?.file_key) await r2.remove(item.file_key).catch(() => {});
  await pool.query('DELETE FROM napts_items WHERE id=$1', [req.params.id]);
  await log(req.session.user.id, 'delete', `Deleted item #${req.params.id}`, req);
  res.redirect('/admin/items');
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { rows: users } = await pool.query('SELECT id,name,email,role,is_active,created_at FROM users ORDER BY created_at DESC');
  res.render('admin/users', { title: 'Users', users });
});

router.post('/users/:id/toggle', async (req, res) => {
  const { rows: [u] } = await pool.query('SELECT role,is_active FROM users WHERE id=$1', [req.params.id]);
  if (!u || u.role === 'admin') return res.redirect('/admin/users');
  await pool.query('UPDATE users SET is_active = NOT is_active WHERE id=$1', [req.params.id]);
  await log(req.session.user.id, 'user_toggled', `Toggled user #${req.params.id}`, req);
  res.redirect('/admin/users');
});

module.exports = router;
