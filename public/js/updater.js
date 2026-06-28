// public/js/updater.js — Update Notification Manager

const updateManager = {
  init() {
    this.check();
    setInterval(() => this.check(), 1000 * 60 * 60); // Check every hour on client
    
    document.getElementById('btn-update-now').addEventListener('click', () => this.performUpdate());
  },

  async check() {
    if (app.state.isWebMode) return;
    try {
      const res = await fetch('/api/update-status');
      if (res.ok) {
        const status = await res.json();
        if (status.updateAvailable) {
          document.getElementById('update-version').textContent = `v${status.latest}`;
          document.getElementById('update-notification').classList.remove('hidden');
        }
      }
    } catch (e) { console.error('Failed to check for updates', e); }
  },

  async performUpdate() {
    const btn = document.getElementById('btn-update-now');
    btn.disabled = true;
    btn.textContent = 'Updating...';
    try {
      const res = await fetch('/api/update-perform', { method: 'POST' });
      if (res.ok) {
        btn.textContent = 'Restarting...';
        setTimeout(() => window.location.reload(), 5000); // Reload after 5s
      } else {
        btn.disabled = false;
        btn.textContent = 'Retry';
      }
    } catch (e) {
      console.error('Update failed', e);
      btn.disabled = false;
      btn.textContent = 'Retry';
    }
  }
};
