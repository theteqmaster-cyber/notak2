// src/routes/admin.js — Admin dashboard (user + device management, audit log)
const router = require('express').Router();
const pool   = require('../db');
const bcrypt = require('bcrypt');

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [users, devices, logs] = await Promise.all([
      pool.query('SELECT id,name,email,role,is_active,created_at FROM users ORDER BY created_at DESC'),
      pool.query('SELECT d.*,u.email FROM devices d LEFT JOIN users u ON d.user_id=u.id ORDER BY d.last_seen DESC LIMIT 50'),
      pool.query('SELECT l.*,u.email FROM activity_logs l LEFT JOIN users u ON l.user_id=u.id ORDER BY l.created_at DESC LIMIT 100'),
    ]);
    res.render('admin/dashboard', {
      title: 'Admin',
      users: users.rows,
      devices: devices.rows,
      logs: logs.rows,
      flash: req.session.flash || null,
    });
    delete req.session.flash;
  } catch (e) {
    res.status(500).render('error', { title: 'Error', code: 500, message: e.message });
  }
});

// ── Toggle user active/inactive ───────────────────────────────────────────────
router.post('/users/:id/toggle', async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active=NOT is_active WHERE id=$1 AND role!=\'admin\'', [req.params.id]);
    req.session.flash = { type: 'success', message: 'User status updated.' };
  } catch (e) {
    req.session.flash = { type: 'error', message: e.message };
  }
  res.redirect('/admin');
});

// ── Delete user ───────────────────────────────────────────────────────────────
router.post('/users/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1 AND role NOT IN (\'admin\',\'ci\')', [req.params.id]);
    req.session.flash = { type: 'success', message: 'User deleted.' };
  } catch (e) {
    req.session.flash = { type: 'error', message: e.message };
  }
  res.redirect('/admin');
});

// ── Reset password ────────────────────────────────────────────────────────────
router.post('/users/:id/reset-password', async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    req.session.flash = { type: 'error', message: 'Password must be at least 8 characters.' };
    return res.redirect('/admin');
  }
  try {
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.params.id]);
    req.session.flash = { type: 'success', message: 'Password reset.' };
  } catch (e) {
    req.session.flash = { type: 'error', message: e.message };
  }
  res.redirect('/admin');
});

// ── Remove device ─────────────────────────────────────────────────────────────
router.post('/devices/:id/remove', async (req, res) => {
  try {
    await pool.query('DELETE FROM devices WHERE id=$1', [req.params.id]);
    req.session.flash = { type: 'success', message: 'Device removed.' };
  } catch (e) {
    req.session.flash = { type: 'error', message: e.message };
  }
  res.redirect('/admin');
});

// ── API: stats for admin dashboard widgets ─────────────────────────────────────
router.get('/api/stats', async (req, res) => {
  try {
    const [uc, dc, nc, fc] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM devices'),
      pool.query('SELECT COUNT(*) FROM notes WHERE deleted_at IS NULL'),
      pool.query('SELECT COUNT(*) FROM files WHERE deleted_at IS NULL'),
    ]);
    res.json({
      users:   parseInt(uc.rows[0].count),
      devices: parseInt(dc.rows[0].count),
      notes:   parseInt(nc.rows[0].count),
      files:   parseInt(fc.rows[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
