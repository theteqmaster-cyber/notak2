// src/db/migrate.js — Runs DDL on startup (idempotent)
const pool = require('./index');
const bcrypt = require('bcrypt');

const SQL = `
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

  CREATE TABLE IF NOT EXISTS semesters (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    academic_year TEXT,
    status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
    start_date    DATE,
    end_date      DATE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS courses (
    id          SERIAL PRIMARY KEY,
    semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    code        TEXT,
    color       TEXT DEFAULT '#4F6EF7',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS napts_items (
    id             SERIAL PRIMARY KEY,
    course_id      INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    uploaded_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type           CHAR(1) NOT NULL CHECK (type IN ('N','A','P','T','S')),
    title          TEXT NOT NULL,
    description    TEXT,
    tags           TEXT,
    file_key       TEXT,
    file_name      TEXT,
    file_mime      TEXT,
    file_size      BIGINT,
    external_url   TEXT,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

  CREATE TABLE IF NOT EXISTS semester_archives (
    id           SERIAL PRIMARY KEY,
    semester_id  INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    zip_key      TEXT,
    zip_name     TEXT,
    zip_size     BIGINT,
    status       TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating','ready','failed')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log('[migrate] Schema up to date');

    // Seed default admin
    const adminEmail = 'admin@notak2.app';
    const adminExists = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (!adminExists.rows.length) {
      const adminHash = await bcrypt.hash('changeme_admin_2026!', 12);
      await client.query(
        `INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)`,
        ['Notak2 Admin', adminEmail, adminHash, 'admin', true]
      );
      console.log('[migrate] Seeded default admin account');
    }

    // Seed default CI
    const ciEmail = 'ci@notak2.app';
    const ciExists = await client.query('SELECT id FROM users WHERE email = $1', [ciEmail]);
    if (!ciExists.rows.length) {
      const ciHash = await bcrypt.hash('changeme_ci_2026!', 12);
      await client.query(
        `INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)`,
        ['Cyber Inspector', ciEmail, ciHash, 'ci', true]
      );
      console.log('[migrate] Seeded default CI account');
    }
  } finally {
    client.release();
  }
}

module.exports = migrate;
