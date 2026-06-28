// src/middleware/ci.js — The invisible security layer (CI)
// Never visible in any UI. Rules live here in code only.
const rateLimit = require('express-rate-limit');
const pool = require('../db');

// ── Rate limiters ─────────────────────────────────────────────────────────────
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min window
  max: 10,                      // max 10 login attempts per window per IP
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await logEvent(req, 'ci:rate_limit', 'Login rate limit exceeded', true);
    if (req.path.startsWith('/api/')) return res.status(429).json({ error: 'Too many requests. Try again later.' });
    req.session.flash = { type: 'error', message: 'Too many login attempts. Please wait 15 minutes.' };
    res.redirect('/login');
  },
});

exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await logEvent(req, 'ci:rate_limit', 'API rate limit exceeded', true);
    res.status(429).json({ error: 'Rate limit exceeded.' });
  },
});

// ── Session integrity check ───────────────────────────────────────────────────
exports.sessionGuard = (req, res, next) => {
  if (!req.session.user) return next();

  // Flag if IP changed mid-session (potential session hijack)
  const currentIP = req.ip;
  if (req.session.originIP && req.session.originIP !== currentIP) {
    logEvent(req, 'ci:session_ip_change',
      `Session IP changed from ${req.session.originIP} to ${currentIP}`, true);
    req.session.destroy();
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Session invalidated.' });
    return res.redirect('/login');
  }
  if (!req.session.originIP) req.session.originIP = currentIP;
  next();
};

// ── Audit logger ──────────────────────────────────────────────────────────────
exports.auditLog = (eventType, description, isFlagged = false) => async (req, res, next) => {
  await logEvent(req, eventType, description, isFlagged);
  next();
};

async function logEvent(req, eventType, description, isFlagged = false) {
  try {
    const userId = req.session?.user?.id || null;
    const ip = req.ip;
    const meta = {
      method: req.method,
      path: req.path,
      ua: req.headers['user-agent'],
      device_id: req.session?.device_id || null,
    };
    await pool.query(
      `INSERT INTO activity_logs (user_id, event_type, description, ip_address, metadata, is_flagged)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, eventType, description, ip, JSON.stringify(meta), isFlagged]
    );
  } catch { /* never block request due to logging failure */ }
}

exports.logEvent = logEvent;
