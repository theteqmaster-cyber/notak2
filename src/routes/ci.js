// src/routes/ci.js — CI internal dashboard (audit log, flagged events, rate limit overrides)
// Access: ci role only. Invisible to all other users.
const router = require('express').Router();
const pool   = require('../db');

router.get('/', async (req, res) => {
  try {
    const [flagged, recent, blocked] = await Promise.all([
      pool.query(`SELECT l.*,u.email FROM activity_logs l
                  LEFT JOIN users u ON l.user_id=u.id
                  WHERE l.is_flagged=true ORDER BY l.created_at DESC LIMIT 200`),
      pool.query(`SELECT l.*,u.email FROM activity_logs l
                  LEFT JOIN users u ON l.user_id=u.id
                  ORDER BY l.created_at DESC LIMIT 500`),
      pool.query(`SELECT ip_address, COUNT(*) as count, MAX(created_at) as last_seen
                  FROM activity_logs WHERE event_type='ci:rate_limit'
                  GROUP BY ip_address ORDER BY count DESC LIMIT 50`),
    ]);
    res.render('ci/dashboard', {
      title: 'CI Dashboard',
      flagged: flagged.rows,
      recent:  recent.rows,
      blocked: blocked.rows,
      flash: req.session.flash || null,
    });
    delete req.session.flash;
  } catch (e) {
    res.status(500).render('error', { title: 'Error', code: 500, message: e.message });
  }
});

// ── Clear a flag ──────────────────────────────────────────────────────────────
router.post('/clear-flag/:id', async (req, res) => {
  try {
    await pool.query('UPDATE activity_logs SET is_flagged=false WHERE id=$1', [req.params.id]);
    req.session.flash = { type: 'success', message: 'Flag cleared.' };
  } catch (e) {
    req.session.flash = { type: 'error', message: e.message };
  }
  res.redirect('/ci');
});

// ── API stats for CI widgets ──────────────────────────────────────────────────
router.get('/api/stats', async (req, res) => {
  try {
    const [flagged, rateLimited, logins, registrations] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM activity_logs WHERE is_flagged=true"),
      pool.query("SELECT COUNT(*) FROM activity_logs WHERE event_type='ci:rate_limit' AND created_at>NOW()-INTERVAL '24h'"),
      pool.query("SELECT COUNT(*) FROM activity_logs WHERE event_type='auth:login' AND created_at>NOW()-INTERVAL '24h'"),
      pool.query("SELECT COUNT(*) FROM activity_logs WHERE event_type='auth:register' AND created_at>NOW()-INTERVAL '24h'"),
    ]);
    res.json({
      flagged:       parseInt(flagged.rows[0].count),
      rateLimited:   parseInt(rateLimited.rows[0].count),
      logins24h:     parseInt(logins.rows[0].count),
      registrations: parseInt(registrations.rows[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
