// src/db/device.js — Persistent device identity
// UUID generated once on first run, stored in ~/.notak2/device.json
const path = require('path');
const os   = require('os');
const fs   = require('fs');
const crypto = require('crypto');

const DATA_DIR   = path.join(os.homedir(), '.notak2');
const DEVICE_FILE = path.join(DATA_DIR, 'device.json');

function getDeviceInfo() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DEVICE_FILE)) {
    try { return JSON.parse(fs.readFileSync(DEVICE_FILE, 'utf8')); } catch {}
  }

  const info = {
    id:       crypto.randomUUID(),
    name:     os.hostname(),
    platform: process.platform,
    created:  new Date().toISOString(),
  };
  fs.writeFileSync(DEVICE_FILE, JSON.stringify(info, null, 2));
  console.log(`[device] New device ID: ${info.id}`);
  return info;
}

const DEVICE = getDeviceInfo();
module.exports = DEVICE;
