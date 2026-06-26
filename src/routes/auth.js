// src/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const { log } = require('../helpers/activity');
const { requireGuest } = require('../middleware/auth');

const loginLimiter = rateLimit({ windowMs: 60_000, max: 10, skipSuccessfulRequests: true });

router.get('/login', requireGuest, (req, res) => res.render('auth/login', { title: 'Sign In', error: null }));

router.post('/login', requireGuest, loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email?.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await log(null, 'login_failed', `Failed login for ${email}`, req, { flagged: true });
      return res.render('auth/login', { title: 'Sign In', error: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.render('auth/login', { title: 'Sign In', error: 'Your account has been suspended.' });
    }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    await log(user.id, 'login', `${user.name} signed in`, req);
    const dest = { admin: '/admin', ci: '/ci' }[user.role] || '/dashboard';
    res.redirect(dest);
  } catch (e) {
    console.error(e);
    res.render('auth/login', { title: 'Sign In', error: 'Server error. Try again.' });
  }
});

router.get('/register', requireGuest, (req, res) => res.render('auth/register', { title: 'Create Account', error: null }));

router.post('/register', requireGuest, async (req, res) => {
  const { name, email, password, password_confirm } = req.body;
  if (!name || !email || !password) return res.render('auth/register', { title: 'Create Account', error: 'All fields required.' });
  if (password !== password_confirm) return res.render('auth/register', { title: 'Create Account', error: 'Passwords do not match.' });
  if (password.length < 8) return res.render('auth/register', { title: 'Create Account', error: 'Password must be at least 8 characters.' });
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) return res.render('auth/register', { title: 'Create Account', error: 'Email already registered.' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,'viewer') RETURNING id, name, email, role`,
      [name.trim(), email.toLowerCase(), hash]
    );
    const user = rows[0];
    req.session.user = user;
    await log(user.id, 'register', `New viewer account: ${user.email}`, req);
    res.redirect('/dashboard');
  } catch (e) {
    console.error(e);
    res.render('auth/register', { title: 'Create Account', error: 'Server error. Try again.' });
  }
});

router.post('/logout', (req, res) => {
  const uid = req.session.user?.id;
  req.session.destroy(() => {
    if (uid) log(uid, 'logout', 'User signed out', req);
    res.redirect('/login');
  });
});

module.exports = router;
