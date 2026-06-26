// src/routes/ci.js — Cyber Inspector monitoring routes
const router = require('express').Router();
const pool = require('../db');

// Dashboard
router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [statsRes, recentRes, flaggedRes] = await Promise.all([
      pool.query(`SELECT
        (SELECT COUNT(*) FROM activity_logs WHERE event_type='login' AND created_at >= $1) AS logins_today,
        (SELECT COUNT(*) FROM activity_logs WHERE event_type='login_failed' AND created_at >= $1) AS failed_today,
        (SELECT COUNT(*) FROM activity_logs WHERE event_type='upload' AND created_at >= $1) AS uploads_today,
        (SELECT COUNT(*) FROM activity_logs WHERE is_flagged=true) AS flagged_total,
        (SELECT COUNT(*) FROM users) AS total_users`, [today]),
      pool.query(`SELECT al.*, u.email AS user_email FROM activity_logs al LEFT JOIN users u ON u.id=al.user_id ORDER BY al.created_at DESC LIMIT 20`),
      pool.query(`SELECT al.*, u.email AS user_email FROM activity_logs al LEFT JOIN users u ON u.id=al.user_id WHERE al.is_flagged=true ORDER BY al.created_at DESC LIMIT 10`),
    ]);
    res.render('ci/dashboard', { title: 'CI Dashboard', stats: statsRes.rows[0], recent: recentRes.rows, flagged: flaggedRes.rows });
  } catch (e) { res.render('error', { title: 'Error', code: 500, message: e.message }); }
});

// Full logs with filters
router.get('/logs', async (req, res) => {
  const { type, flagged, date } = req.query;
  let q = `SELECT al.*, u.email AS user_email FROM activity_logs al LEFT JOIN users u ON u.id=al.user_id WHERE 1=1`;
  const params = [];
  if (type)    { params.push(type); q += ` AND al.event_type=$${params.length}`; }
  if (flagged) { q += ` AND al.is_flagged=true`; }
  if (date)    { params.push(date); q += ` AND al.created_at::date=$${params.length}`; }
  q += ' ORDER BY al.created_at DESC LIMIT 200';
  const { rows: logs } = await pool.query(q, params);
  res.render('ci/logs', { title: 'Activity Logs', logs, filters: req.query });
});

// Flagged alerts only
router.get('/alerts', async (req, res) => {
  const { rows: logs } = await pool.query(
    `SELECT al.*, u.email AS user_email FROM activity_logs al LEFT JOIN users u ON u.id=al.user_id WHERE al.is_flagged=true ORDER BY al.created_at DESC`
  );
  res.render('ci/alerts', { title: 'Security Alerts', logs });
});

module.exports = router;
