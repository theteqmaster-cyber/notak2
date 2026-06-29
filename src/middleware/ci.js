// src/middleware/ci.js — Passive Intelligence Layer
// ─────────────────────────────────────────────────────────────────────────────
// CI DOCTRINE:
//   CI sees everything. CI flags everything. CI reports to admin.
//   CI NEVER blocks a request. CI NEVER redirects. CI NEVER destroys a session.
//   The admin is the only one who takes action.
// ─────────────────────────────────────────────────────────────────────────────
const pool = require('../db');

// In-memory counters for short-window surveillance (reset on server restart).
// These are used only to DETECT and FLAG anomalies — not to block anything.
const loginAttempts = new Map(); // key: IP → { count, windowStart }
const apiHits       = new Map(); // key: IP → { count, windowStart }

const LOGIN_WINDOW_MS  = 15 * 60 * 1000; // 15 min
const LOGIN_FLAG_AFTER = 10;              // flag after 10 login attempts in window
const API_WINDOW_MS    = 60 * 1000;      // 1 min
const API_FLAG_AFTER   = 300;            // flag after 300 API hits in window

// ── Login surveillance (observe only, never block) ───────────────────────────
exports.loginLimiter = async (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - entry.windowStart > LOGIN_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count++;
  loginAttempts.set(ip, entry);

  // Flag to admin if threshold crossed — but still let the request through
  if (entry.count === LOGIN_FLAG_AFTER) {
    await logEvent(req, 'ci:login_anomaly',
      `IP ${ip} has made ${entry.count} login attempts in 15 min — flagged for admin review`, true);
  }

  next(); // CI never blocks — always continue
};

// ── API surveillance (observe only, never block) ─────────────────────────────
exports.apiLimiter = async (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const entry = apiHits.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > API_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count++;
  apiHits.set(ip, entry);

  // Flag anomaly to admin at threshold — but still let the request through
  if (entry.count === API_FLAG_AFTER) {
    await logEvent(req, 'ci:api_anomaly',
      `IP ${ip} has made ${entry.count} API requests in 60s — flagged for admin review`, true);
  }

  next(); // CI never blocks — always continue
};

// ── Session surveillance (observe only, never destroy) ───────────────────────
exports.sessionGuard = (req, res, next) => {
  if (!req.session.user) return next();

  const currentIP = req.ip;

  // Detect IP change and log it — but NEVER destroy the session.
  // IP changes happen legitimately (WiFi ↔ mobile, ISP rotation, CDN edge nodes).
  if (req.session.originIP && req.session.originIP !== currentIP) {
    logEvent(req, 'ci:session_ip_change',
      `Session IP changed: ${req.session.originIP} → ${currentIP} (user: ${req.session.user.email}) — logged for review`, false);
    req.session.originIP = currentIP;
  }
  if (!req.session.originIP) req.session.originIP = currentIP;

  next(); // CI never invalidates — always continue
};

// ── Audit log middleware (attach to any route) ────────────────────────────────
exports.auditLog = (eventType, description, isFlagged = false) => async (req, res, next) => {
  await logEvent(req, eventType, description, isFlagged);
  next();
};

// ── Core event logger ─────────────────────────────────────────────────────────
async function logEvent(req, eventType, description, isFlagged = false) {
  try {
    const userId = req.session?.user?.id || null;
    const ip     = req.ip;
    const meta   = {
      method: req.method,
      path:   req.path,
      ua:     req.headers['user-agent'],
    };
    await pool.query(
      `INSERT INTO activity_logs (user_id, event_type, description, ip_address, metadata, is_flagged)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, eventType, description, ip, JSON.stringify(meta), isFlagged]
    );
  } catch { /* logging must never block a request */ }
}

exports.logEvent = logEvent;
