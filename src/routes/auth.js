// src/routes/auth.js — Registration, login, logout
const router  = require('express').Router();
const bcrypt  = require('bcrypt');
const pool    = require('../db');
const { requireGuest } = require('../middleware/auth');
const { loginLimiter, logEvent } = require('../middleware/ci');
const logger  = require('../helpers/logger');

// ── GET /login ────────────────────────────────────────────────────────────────
router.get('/login', requireGuest, (req, res) => {
  res.render('auth/login', { title: 'Sign In', flash: req.session.flash || null });
  delete req.session.flash;
});

// ── GET /register ─────────────────────────────────────────────────────────────
router.get('/register', requireGuest, (req, res) => {
  res.render('auth/register', { title: 'Create Account', flash: req.session.flash || null });
  delete req.session.flash;
});

// ── POST /register ────────────────────────────────────────────────────────────
router.post('/register', requireGuest, async (req, res) => {
  const { name, email, password, confirm } = req.body;
  if (!name || !email || !password) {
    req.session.flash = { type: 'error', message: 'All fields are required.' };
    return res.redirect('/register');
  }
  if (password !== confirm) {
    req.session.flash = { type: 'error', message: 'Passwords do not match.' };
    return res.redirect('/register');
  }
  if (password.length < 8) {
    req.session.flash = { type: 'error', message: 'Password must be at least 8 characters.' };
    return res.redirect('/register');
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (existing.rows.length) {
      req.session.flash = { type: 'error', message: 'An account with that email already exists.' };
      return res.redirect('/register');
    }
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name,email,password,role,is_active) VALUES ($1,$2,$3,'viewer',true) RETURNING id,name,email,role`,
      [name.trim(), email.toLowerCase(), hash]
    );
    req.session.user = rows[0];
    req.session.originIP = req.ip;
    await logEvent(req, 'auth:register', `New user registered: ${email}`, false);
    res.redirect('/app');
  } catch (err) {
    logger.error(err, '[auth] register error');
    req.session.flash = { type: 'error', message: 'Registration failed. Try again.' };
    res.redirect('/register');
  }
});

// ── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', requireGuest, loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.session.flash = { type: 'error', message: 'Email and password are required.' };
    return res.redirect('/login');
  }
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !user.is_active) {
      req.session.flash = { type: 'error', message: 'Invalid credentials.' };
      await logEvent(req, 'auth:login_fail', `Failed login: ${email}`, false);
      return res.redirect('/login');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.session.flash = { type: 'error', message: 'Invalid credentials.' };
      await logEvent(req, 'auth:login_fail', `Failed login: ${email}`, false);
      return res.redirect('/login');
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    req.session.originIP = req.ip;

    await logEvent(req, 'auth:login', `User logged in: ${email}`, false);

    const dest = { admin: '/admin', ci: '/ci' }[user.role] || '/app';
    res.redirect(dest);
  } catch (err) {
    logger.error(err, '[auth] login error');
    req.session.flash = { type: 'error', message: 'Login failed. Try again.' };
    res.redirect('/login');
  }
});

// ── POST /logout ──────────────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  await logEvent(req, 'auth:logout', `User logged out: ${req.session.user?.email}`, false);
  req.session.destroy(() => res.redirect('/login'));
});

router.get('/logout', async (req, res) => {
  await logEvent(req, 'auth:logout', `User logged out: ${req.session.user?.email}`, false);
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
