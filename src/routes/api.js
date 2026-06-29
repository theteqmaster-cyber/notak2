// src/routes/api.js — REST API for the SPA client
// All routes require auth. Returns JSON only.
const router  = require('express').Router();
const crypto  = require('crypto');
const pool    = require('../db');
const { apiLimiter } = require('../middleware/ci');
const multer  = require('multer');
const r2      = require('../storage/r2');
const logger  = require('../helpers/logger');

router.use(apiLimiter);

// ── Multer setup ──────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// ── Helper ────────────────────────────────────────────────────────────────────
const uid = () => req => req.session.user.id;

// ── WORKSPACES ────────────────────────────────────────────────────────────────
router.get('/workspaces', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM workspaces WHERE user_id=$1 ORDER BY created_at ASC',
      [req.session.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/workspaces', async (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO workspaces (user_id,name,color) VALUES ($1,$2,$3) RETURNING *`,
      [req.session.user.id, name.trim(), color || '#4F6EF7']
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/workspaces/:id', async (req, res) => {
  const { name, color } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE workspaces SET name=COALESCE($1,name), color=COALESCE($2,color)
       WHERE id=$3 AND user_id=$4 RETURNING *`,
      [name, color, req.params.id, req.session.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/workspaces/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM workspaces WHERE id=$1 AND user_id=$2', [req.params.id, req.session.user.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── FOLDERS ───────────────────────────────────────────────────────────────────
router.get('/workspaces/:wsId/folders', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.* FROM folders f
       JOIN workspaces w ON f.workspace_id=w.id
       WHERE f.workspace_id=$1 AND w.user_id=$2
       ORDER BY f.name ASC`,
      [req.params.wsId, req.session.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/workspaces/:wsId/folders', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  try {
    // Verify workspace belongs to user
    const { rows: ws } = await pool.query('SELECT id FROM workspaces WHERE id=$1 AND user_id=$2', [req.params.wsId, req.session.user.id]);
    if (!ws.length) return res.status(404).json({ error: 'Workspace not found' });

    const { rows } = await pool.query(
      `INSERT INTO folders (workspace_id,name) VALUES ($1,$2) RETURNING *`,
      [req.params.wsId, name.trim()]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/folders/:id', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM folders f USING workspaces w
       WHERE f.workspace_id=w.id AND f.id=$1 AND w.user_id=$2`,
      [req.params.id, req.session.user.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── NOTES ─────────────────────────────────────────────────────────────────────
router.get('/notes', async (req, res) => {
  const { folder_id, search, page = 1, limit = 50 } = req.query;
  const offset = (Math.max(1, page) - 1) * limit;
  try {
    let q = `SELECT id,folder_id,title,sync_status,created_at,updated_at
             FROM notes WHERE user_id=$1 AND deleted_at IS NULL`;
    const params = [req.session.user.id];
    if (folder_id) { params.push(folder_id); q += ` AND folder_id=$${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      q += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }
    q += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const { rows } = await pool.query(q, params);
    
    // Count query for pagination metadata
    let countQ = `SELECT COUNT(*) FROM notes WHERE user_id=$1 AND deleted_at IS NULL`;
    const countParams = [req.session.user.id];
    if (folder_id) { countParams.push(folder_id); countQ += ` AND folder_id=$${countParams.length}`; }
    if (search) {
      countParams.push(`%${search}%`);
      countQ += ` AND (title ILIKE $${countParams.length} OR content ILIKE $${countParams.length})`;
    }
    const countRes = await pool.query(countQ, countParams);
    
    res.json({
      data: rows,
      meta: { total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/notes/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notes WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [req.params.id, req.session.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/notes', async (req, res) => {
  const { title, content, folder_id, id } = req.body;
  const noteId = id || crypto.randomUUID();
  try {
    const { rows } = await pool.query(
      `INSERT INTO notes (id,user_id,folder_id,title,content)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [noteId, req.session.user.id, folder_id || null, title || 'Untitled', content || '']
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/notes/:id', async (req, res) => {
  const { title, content, folder_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE notes
       SET title=COALESCE($1,title), content=COALESCE($2,content),
           folder_id=COALESCE($3,folder_id), updated_at=NOW()
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [title, content, folder_id, req.params.id, req.session.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/notes/:id', async (req, res) => {
  try {
    await pool.query(
      `UPDATE notes SET deleted_at=NOW() WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.session.user.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── FILES (binary stored in R2, metadata in Postgres) ─────────────────────────
router.get('/files', async (req, res) => {
  const { folder_id, search, page = 1, limit = 50 } = req.query;
  const offset = (Math.max(1, page) - 1) * limit;
  try {
    let q = `SELECT id,folder_id,name,mime,size,r2_key,created_at FROM files WHERE user_id=$1 AND deleted_at IS NULL`;
    const params = [req.session.user.id];
    if (folder_id) { params.push(folder_id); q += ` AND folder_id=$${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      q += ` AND name ILIKE $${params.length}`;
    }
    q += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const { rows } = await pool.query(q, params);
    
    let countQ = `SELECT COUNT(*) FROM files WHERE user_id=$1 AND deleted_at IS NULL`;
    const countParams = [req.session.user.id];
    if (folder_id) { countParams.push(folder_id); countQ += ` AND folder_id=$${countParams.length}`; }
    if (search) {
      countParams.push(`%${search}%`);
      countQ += ` AND name ILIKE $${countParams.length}`;
    }
    const countRes = await pool.query(countQ, countParams);

    res.json({
      data: rows,
      meta: { total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/files', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { folder_id, id } = req.body;
  const fileId = id || crypto.randomUUID();
  const originalName = req.file.originalname;
  
  // Cryptographically secure and unique name for R2 object (obfuscated)
  const ext = originalName.split('.').pop() || '';
  const hashPayload = `${req.session.user.id}:${originalName}:${Date.now()}:${crypto.randomUUID()}`;
  const r2Key = crypto.createHash('sha256').update(hashPayload).digest('hex') + (ext ? `.${ext}` : '');
  
  try {
    // 1. Upload to R2 (flat object storage)
    await r2.upload(r2Key, req.file.buffer, req.file.mimetype);
    
    // 2. Save metadata to Postgres
    const { rows } = await pool.query(
      `INSERT INTO files (id,user_id,folder_id,name,mime,size,r2_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [fileId, req.session.user.id, folder_id || null, originalName, req.file.mimetype, req.file.size, r2Key]
    );
    res.json(rows[0]);
  } catch (e) {
    logger.error(e, '[r2 upload]');
    res.status(500).json({ error: e.message });
  }
});

router.get('/files/:id/download', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT r2_key, name FROM files WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL',
      [req.params.id, req.session.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'File not found' });
    
    // Generate a short-lived presigned URL (1 hour)
    const url = await r2.signedUrl(rows[0].r2_key, 3600);
    res.json({ url, name: rows[0].name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/files/:id', async (req, res) => {
  try {
    await pool.query(
      `UPDATE files SET deleted_at=NOW() WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.session.user.id]
    );
    // Note: We soft-delete in Postgres. A separate cron job can prune R2 objects to save space.
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── USER PROFILE ──────────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  res.json({ user: req.session.user });
});

module.exports = router;
