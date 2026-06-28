// src/updater/agent.js — GitHub Releases update agent
// Polls for new versions and triggers self-update on user confirmation
const fetch    = require('node-fetch');
const semver   = require('semver');
const { execSync } = require('child_process');
const fs       = require('fs');
const path     = require('path');

const REPO     = 'theteqmaster-cyber/notak2';
const PKG_PATH = path.join(__dirname, '../../package.json');
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

let _latestVersion = null;
let _updateAvailable = false;

// ── Check GitHub Releases for latest version ──────────────────────────────────
async function checkForUpdates() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      { headers: { 'User-Agent': 'notak2-updater' }, timeout: 10000 }
    );
    if (!res.ok) return;

    const release = await res.json();
    const latest  = release.tag_name?.replace(/^v/, '');
    const current = getCurrentVersion();

    _latestVersion = latest;

    if (latest && semver.valid(latest) && semver.gt(latest, current)) {
      _updateAvailable = true;
      console.log(`[updater] Update available: ${current} → ${latest}`);
    } else {
      _updateAvailable = false;
      console.log(`[updater] Up to date (${current})`);
    }
  } catch (err) {
    console.warn('[updater] Version check failed:', err.message);
  }
}

// ── Get current installed version ─────────────────────────────────────────────
function getCurrentVersion() {
  try {
    return JSON.parse(fs.readFileSync(PKG_PATH, 'utf8')).version || '1.0.0';
  } catch { return '1.0.0'; }
}

// ── Perform the update (git pull + npm install + restart) ─────────────────────
function performUpdate() {
  const rootDir = path.join(__dirname, '../..');
  try {
    console.log('[updater] Pulling latest code…');
    execSync('git pull --ff-only', { cwd: rootDir, stdio: 'inherit' });
    console.log('[updater] Installing dependencies…');
    execSync('npm install --production', { cwd: rootDir, stdio: 'inherit' });
    console.log('[updater] Restarting…');
    // Try pm2 first, fall back to systemd, then just exit (process manager will restart)
    try { execSync('pm2 restart notak2', { stdio: 'inherit' }); return; } catch {}
    try { execSync('systemctl restart notak2', { stdio: 'inherit' }); return; } catch {}
    // Last resort: exit and let the process manager restart
    process.exit(0);
  } catch (err) {
    console.error('[updater] Update failed:', err.message);
    throw err;
  }
}

// ── Status (exposed to API) ───────────────────────────────────────────────────
function getStatus() {
  return {
    current:         getCurrentVersion(),
    latest:          _latestVersion,
    updateAvailable: _updateAvailable,
  };
}

// ── Start polling ─────────────────────────────────────────────────────────────
function start() {
  if (process.env.DEVICE_MODE === 'web') return; // web version never self-updates
  checkForUpdates();
  setInterval(checkForUpdates, CHECK_INTERVAL_MS);
  console.log('[updater] Update agent started (6h interval)');
}

module.exports = { start, checkForUpdates, performUpdate, getStatus };
