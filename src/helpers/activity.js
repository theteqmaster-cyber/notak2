// src/helpers/activity.js — Append-only audit log
const pool = require('../db');

async function log(userId, eventType, description, req, opts = {}) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, event_type, description, ip_address, metadata, is_flagged)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        userId || null,
        eventType,
        description,
        req?.ip || null,
        opts.metadata ? JSON.stringify(opts.metadata) : null,
        opts.flagged || false,
      ]
    );
  } catch (e) {
    console.error('[activity] Log failed:', e.message);
  }
}

module.exports = { log };
