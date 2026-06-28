// src/routes/sync.js — Sync queue push/pull endpoints
// PC clients drain their offline queue here when internet returns
const router = require('express').Router();
const pool   = require('../db');
const crypto = require('crypto');

// ── PUSH: PC drains its sync queue to cloud ───────────────────────────────────
// POST /sync/push  body: { device_id, items: [{ entity, entity_id, action, payload, local_seq, created_at }] }
router.post('/push', async (req, res) => {
  const { device_id, items } = req.body;
  if (!device_id || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'device_id and items[] required' });
  }

  const userId = req.session.user.id;
  const client = await pool.connect();
  const results = [];

  try {
    await client.query('BEGIN');

    for (const item of items) {
      const { entity, entity_id, action, payload, local_seq, created_at } = item;

      // Log sync event
      await client.query(
        `INSERT INTO sync_log (device_id,user_id,entity,entity_id,action,payload,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [device_id, userId, entity, entity_id, action, JSON.stringify(payload), created_at || new Date()]
      );

      if (entity === 'note') {
        if (action === 'create' || action === 'update') {
          // Check for conflict: note exists and was modified by another device after our base
          const { rows: existing } = await client.query(
            'SELECT id, vector_clock, updated_at FROM notes WHERE id=$1 AND user_id=$2',
            [entity_id, userId]
          );

          if (existing.length && action === 'update') {
            const remoteVC  = existing[0].vector_clock || {};
            const incomingVC = payload.vector_clock || {};
            const conflict = detectConflict(remoteVC, incomingVC, device_id);

            if (conflict) {
              // Create a conflict copy
              const conflictId = crypto.randomUUID();
              await client.query(
                `INSERT INTO notes (id,user_id,folder_id,title,content,vector_clock,sync_status,created_at,updated_at)
                 VALUES ($1,$2,$3,$4,$5,$6,'conflict',NOW(),NOW())`,
                [conflictId, userId, payload.folder_id || null,
                 `[CONFLICT] ${payload.title}`, payload.content,
                 JSON.stringify(incomingVC)]
              );
              results.push({ entity_id, status: 'conflict', conflict_id: conflictId });
              continue;
            }
          }

          if (action === 'create') {
            await client.query(
              `INSERT INTO notes (id,user_id,folder_id,title,content,vector_clock,sync_status,created_at,updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,'synced',$7,NOW())
               ON CONFLICT (id) DO NOTHING`,
              [entity_id, userId, payload.folder_id||null, payload.title||'Untitled',
               payload.content||'', JSON.stringify(payload.vector_clock||{}), payload.created_at||new Date()]
            );
          } else {
            await client.query(
              `UPDATE notes SET title=$1,content=$2,vector_clock=$3,sync_status='synced',updated_at=NOW()
               WHERE id=$4 AND user_id=$5`,
              [payload.title, payload.content, JSON.stringify(payload.vector_clock||{}), entity_id, userId]
            );
          }
          results.push({ entity_id, status: 'ok' });

        } else if (action === 'delete') {
          await client.query('UPDATE notes SET deleted_at=NOW() WHERE id=$1 AND user_id=$2', [entity_id, userId]);
          results.push({ entity_id, status: 'ok' });
        }
      }
      // Extend here for 'file' entity sync
    }

    await client.query('COMMIT');
    res.json({ ok: true, results });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[sync/push]', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── PULL: PC asks for changes since its last sync ────────────────────────────
// GET /sync/pull?since=<ISO timestamp>&device_id=<id>
router.get('/pull', async (req, res) => {
  const { since, device_id } = req.query;
  const userId = req.session.user.id;
  try {
    const sinceDate = since ? new Date(since) : new Date(0);

    const [notes, files, deletedNotes, deletedFiles] = await Promise.all([
      pool.query(
        `SELECT * FROM notes WHERE user_id=$1 AND updated_at>$2 AND deleted_at IS NULL ORDER BY updated_at ASC`,
        [userId, sinceDate]
      ),
      pool.query(
        `SELECT * FROM files WHERE user_id=$1 AND created_at>$2 AND deleted_at IS NULL ORDER BY created_at ASC`,
        [userId, sinceDate]
      ),
      pool.query(
        `SELECT id,deleted_at FROM notes WHERE user_id=$1 AND deleted_at>$2 ORDER BY deleted_at ASC`,
        [userId, sinceDate]
      ),
      pool.query(
        `SELECT id,deleted_at FROM files WHERE user_id=$1 AND deleted_at>$2 ORDER BY deleted_at ASC`,
        [userId, sinceDate]
      ),
    ]);

    res.json({
      notes:         notes.rows,
      files:         files.rows,
      deletedNotes:  deletedNotes.rows,
      deletedFiles:  deletedFiles.rows,
      serverTime:    new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Conflict detection helper ─────────────────────────────────────────────────
// Returns true if two edits happened in parallel (neither is an ancestor of the other)
function detectConflict(remoteVC, incomingVC, deviceId) {
  // If incoming device's clock is not ahead of remote for all devices → conflict
  for (const [dev, seq] of Object.entries(remoteVC)) {
    if (dev === deviceId) continue;
    if ((incomingVC[dev] || 0) < seq) return true;
  }
  return false;
}

module.exports = router;
