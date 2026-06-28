// server.js — Notak2 v2 entry point
// Local-first, multi-device, offline-capable study system
require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const PgSession  = require('connect-pg-simple')(session);
const path       = require('path');
const pool       = require('./src/db');
const migrate    = require('./src/db/migrate');
const updater    = require('./src/updater/agent');
const { requireAuth, requireRole } = require('./src/middleware/auth');
const { sessionGuard }             = require('./src/middleware/ci');

const IS_WEB = process.env.DEVICE_MODE === 'web';

const app = express();

// ── Trust proxy ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── View engine (auth + admin + ci pages only) ────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static SPA files ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

// ── Sessions → Supabase Postgres ──────────────────────────────────────────────
app.use(session({
  store: new PgSession({ pool, tableName: 'sessions', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'notak2-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge:   7 * 24 * 60 * 60 * 1000,
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}));

// ── CI middleware (runs on every request) ─────────────────────────────────────
app.use(sessionGuard);

// ── Locals available in all EJS views ────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user  = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  res.locals.path  = req.path;
  res.locals.isWeb = IS_WEB;
  delete req.session.flash;
  next();
});

// ── Auth routes (login, register, logout) ─────────────────────────────────────
app.use('/', require('./src/routes/auth'));

// ── App shell (SPA) ───────────────────────────────────────────────────────────
app.get('/app', requireAuth, (req, res) => {
  // Only regular users get the SPA
  if (['admin', 'ci'].includes(req.session.user.role)) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/ci');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── REST API (SPA data layer) ─────────────────────────────────────────────────
app.use('/api', requireAuth, require('./src/routes/api'));

// ── Sync endpoints (PC clients) ───────────────────────────────────────────────
app.use('/sync', requireAuth, require('./src/routes/sync'));

// ── Update agent API ──────────────────────────────────────────────────────────
app.get('/api/update-status', requireAuth, (req, res) => {
  res.json(updater.getStatus());
});

app.post('/api/update-perform', requireAuth, (req, res) => {
  if (IS_WEB) return res.status(400).json({ error: 'Web version cannot self-update.' });
  res.json({ ok: true, message: 'Update started. Server will restart shortly.' });
  setTimeout(() => {
    try { updater.performUpdate(); }
    catch (e) { console.error('[update] Failed:', e.message); }
  }, 500);
});

// ── Admin dashboard ───────────────────────────────────────────────────────────
app.use('/admin', requireAuth, requireRole('admin'), require('./src/routes/admin'));

// ── CI dashboard ──────────────────────────────────────────────────────────────
app.use('/ci', requireAuth, requireRole('ci'), require('./src/routes/ci'));

// ── Root redirect ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const dest = { admin: '/admin', ci: '/ci' }[req.session.user.role] || '/app';
  res.redirect(dest);
});

// ── PWA: serve index.html for any unmatched route (SPA deep links) ────────────
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/sync') ||
      req.path.startsWith('/admin') || req.path.startsWith('/ci') ||
      req.path === '/login' || req.path === '/register') return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Render Health Check ───────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/sync')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).render('error', { title: 'Not Found', code: 404, message: 'Page not found.' });
});

// ── 500 ───────────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[server]', err);
  if (req.path.startsWith('/api') || req.path.startsWith('/sync')) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.status(500).render('error', { title: 'Server Error', code: 500, message: 'An unexpected error occurred.' });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;

migrate()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[notak2] ${IS_WEB ? 'WEB' : 'LOCAL'} mode — Binding to 0.0.0.0:${PORT}`);
      console.log(`[notak2] Device: ${IS_WEB ? 'web' : require('./src/db/device').id}`);
      updater.start();
    });
  })
  .catch(err => {
    console.error('[notak2] Boot failed:', err.message);
    process.exit(1);
  });
