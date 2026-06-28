// src/db/local.js — better-sqlite3 local database (runs on PC only)
// Lives at ~/.notak2/local.db — persists across app updates
const path = require('path');
const os   = require('os');
const fs   = require('fs');

const DATA_DIR = path.join(os.homedir(), '.notak2');
const DB_PATH  = path.join(DATA_DIR, 'local.db');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;
try {
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH, { verbose: null });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (e) {
  console.warn('[local.db] better-sqlite3 unavailable (web mode):', e.message);
  db = null;
}

module.exports = db;
