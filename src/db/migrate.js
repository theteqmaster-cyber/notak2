// src/db/migrate.js — Idempotent schema for Supabase (cloud)
require('dotenv').config();
const pool   = require('./index');
const bcrypt = require('bcrypt');
const logger = require('../helpers/logger');

// ─── CLOUD SCHEMA (Supabase Postgres) ────────────────────────────────────────
const CLOUD_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','ci','viewer')),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid     TEXT PRIMARY KEY,
    sess    JSONB NOT NULL,
    expire  TIMESTAMPTZ NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);

  CREATE TABLE IF NOT EXISTS devices (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    platform    TEXT,
    app_version TEXT,
    last_seen   TIMESTAMPTZ DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    color       TEXT NOT NULL DEFAULT '#4F6EF7',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS folders (
    id           SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS notes (
    id           TEXT PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id    INTEGER REFERENCES folders(id) ON DELETE SET NULL,
    title        TEXT NOT NULL DEFAULT 'Untitled',
    content      TEXT NOT NULL DEFAULT '',
    vector_clock JSONB NOT NULL DEFAULT '{}',
    sync_status  TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced','conflict','pending')),
    deleted_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS files (
    id           TEXT PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id    INTEGER REFERENCES folders(id) ON DELETE SET NULL,
    name         TEXT NOT NULL,
    mime         TEXT,
    size         BIGINT,
    r2_key       TEXT NOT NULL,
    vector_clock JSONB NOT NULL DEFAULT '{}',
    deleted_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sync_log (
    id         SERIAL PRIMARY KEY,
    device_id  TEXT,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    entity     TEXT NOT NULL,
    entity_id  TEXT NOT NULL,
    action     TEXT NOT NULL,
    payload    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type  TEXT NOT NULL,
    description TEXT,
    ip_address  TEXT,
    metadata    JSONB,
    is_flagged  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS app_versions (
    id          SERIAL PRIMARY KEY,
    version     TEXT NOT NULL,
    notes       TEXT,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;



// ─── SEED DEFAULTS ────────────────────────────────────────────────────────────
async function seedDefaults(client) {
  const adminEmail = 'admin@notak2.app';
  const { rows: adminRows } = await client.query('SELECT id FROM users WHERE email=$1', [adminEmail]);
  if (!adminRows.length) {
    const hash = await bcrypt.hash('changeme_admin_2026!', 12);
    await client.query(
      `INSERT INTO users (name,email,password,role,is_active) VALUES ($1,$2,$3,$4,$5)`,
      ['Notak2 Admin', adminEmail, hash, 'admin', true]
    );
    logger.info('[migrate] Seeded admin account');
  }

  const ciEmail = 'ci@notak2.app';
  const { rows: ciRows } = await client.query('SELECT id FROM users WHERE email=$1', [ciEmail]);
  if (!ciRows.length) {
    const hash = await bcrypt.hash('changeme_ci_2026!', 12);
    await client.query(
      `INSERT INTO users (name,email,password,role,is_active) VALUES ($1,$2,$3,$4,$5)`,
      ['Cyber Inspector', ciEmail, hash, 'ci', true]
    );
    logger.info('[migrate] Seeded CI account');
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(CLOUD_SQL);
    logger.info('[migrate] Cloud schema up to date');
    await seedDefaults(client);
  } finally {
    client.release();
  }
}

module.exports = migrate;
