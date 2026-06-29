// src/db/index.js — PostgreSQL pool (Supabase)
const { Pool } = require('pg');
const logger = require('../helpers/logger');

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  logger.error(err, '[db] Unexpected pool error');
});

module.exports = pool;
