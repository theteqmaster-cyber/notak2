// src/sync/engine.js — Local sync engine (PC only)
// Drains local SQLite sync_queue to cloud when internet available
const local  = require('../db/local');
const DEVICE = require('../db/device');

// ── Queue a local change ──────────────────────────────────────────────────────
// Call this whenever a note/file is created/updated/deleted locally
function enqueue(entity, entityId, action, payload) {
  if (!local) return; // web mode — no local queue
  const seq = getNextSeq();
  local.prepare(
    `INSERT INTO sync_queue (entity,entity_id,action,payload,device_id,local_seq)
     VALUES (?,?,?,?,?,?)`
  ).run(entity, entityId, action, JSON.stringify(payload), DEVICE.id, seq);
}

function getNextSeq() {
  const row = local.prepare('SELECT COALESCE(MAX(local_seq),0)+1 as next FROM sync_queue').get();
  return row.next;
}

// ── Drain queue to cloud ──────────────────────────────────────────────────────
// Called on startup and when connectivity is restored
async function drain(serverBaseUrl, sessionCookie) {
  if (!local) return;
  const pending = local.prepare(
    `SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY local_seq ASC LIMIT 100`
  ).all();

  if (!pending.length) return;
  console.log(`[sync] Draining ${pending.length} queued items…`);

  try {
    const fetch = require('node-fetch');
    const res = await fetch(`${serverBaseUrl}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },
      body: JSON.stringify({
        device_id: DEVICE.id,
        items: pending.map(p => ({
          entity:     p.entity,
          entity_id:  p.entity_id,
          action:     p.action,
          payload:    JSON.parse(p.payload),
          local_seq:  p.local_seq,
          created_at: p.created_at,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const now = new Date().toISOString();
      const markSynced = local.prepare('UPDATE sync_queue SET synced_at=? WHERE id=?');
      const markMany   = local.transaction(() => {
        for (const item of pending) markSynced.run(now, item.id);
      });
      markMany();
      console.log(`[sync] Drained ${pending.length} items. Results:`, data.results?.length);
    } else {
      console.warn('[sync] Push failed:', res.status);
    }
  } catch (err) {
    console.warn('[sync] Network unavailable, will retry:', err.message);
  }
}

// ── Pull changes from cloud ───────────────────────────────────────────────────
async function pull(serverBaseUrl, sessionCookie) {
  if (!local) return;
  const row = local.prepare("SELECT value FROM local_meta WHERE key='last_pull'").get();
  const since = row?.value || new Date(0).toISOString();

  try {
    const fetch = require('node-fetch');
    const res = await fetch(
      `${serverBaseUrl}/sync/pull?since=${encodeURIComponent(since)}&device_id=${DEVICE.id}`,
      { headers: { 'Cookie': sessionCookie } }
    );
    if (!res.ok) return;

    const data = await res.json();

    // Apply pulled notes to local SQLite
    const upsertNote = local.prepare(
      `INSERT INTO notes (id,folder_id,title,content,vector_clock,sync_status,created_at,updated_at,cloud_synced)
       VALUES (?,?,?,?,?,?,?,?,1)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, content=excluded.content,
         vector_clock=excluded.vector_clock, sync_status=excluded.sync_status,
         updated_at=excluded.updated_at, cloud_synced=1`
    );
    const deleteNote = local.prepare("UPDATE notes SET deleted_at=datetime('now') WHERE id=?");

    const applyPull = local.transaction(() => {
      for (const n of (data.notes || [])) {
        upsertNote.run(n.id, n.folder_id, n.title, n.content,
          JSON.stringify(n.vector_clock), n.sync_status, n.created_at, n.updated_at);
      }
      for (const n of (data.deletedNotes || [])) deleteNote.run(n.id);
    });
    applyPull();

    // Update last pull timestamp
    local.prepare(
      `INSERT INTO local_meta (key,value) VALUES ('last_pull',?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`
    ).run(data.serverTime);

    console.log(`[sync] Pulled ${data.notes?.length} notes, ${data.deletedNotes?.length} deletions`);
  } catch (err) {
    console.warn('[sync] Pull failed:', err.message);
  }
}

// ── Connectivity check ────────────────────────────────────────────────────────
async function isOnline() {
  try {
    const fetch = require('node-fetch');
    await fetch('https://1.1.1.1', { timeout: 3000 });
    return true;
  } catch { return false; }
}

module.exports = { enqueue, drain, pull, isOnline };
