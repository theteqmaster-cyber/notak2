// public/js/app.js — Core SPA Router and State Manager

const app = {
  state: {
    user: null,
    isWebMode: false,
    currentView: 'dashboard',
    online: navigator.onLine,
  },

  async init() {
    // Check auth state & platform
    try {
      const res = await fetch('/api/me');
      if (!res.ok) { window.location.href = '/login'; return; }
      const data = await res.json();
      this.state.user = data.user;
      this.state.isWebMode = !data.device_id; // If no device_id, it's web mode
      
      document.getElementById('user-name-display').textContent = this.state.user.name;
      
      if (this.state.isWebMode) {
        document.getElementById('device-badge').classList.remove('hidden');
        document.getElementById('sync-status-indicator').classList.add('hidden');
      }

      this.updateNetworkStatus();
      window.addEventListener('online', () => { this.state.online = true; this.updateNetworkStatus(); syncManager.triggerSync(); });
      window.addEventListener('offline', () => { this.state.online = false; this.updateNetworkStatus(); });

      // Init sub-modules
      if (!this.state.isWebMode) {
        syncManager.init();
        updateManager.init();
      }
      vault.init();
      editor.init();
      library.init();

      // Set up navigation
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.navigate(e.target.dataset.view));
      });

      // Handle sidebar toggle
      document.getElementById('sidebar-toggle-btn').addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          document.getElementById('sidebar').classList.toggle('open');
        } else {
          document.getElementById('sidebar').classList.toggle('collapsed');
        }
      });

    } catch (e) {
      console.error('App init failed', e);
    }
  },

  navigate(viewId) {
    if (this.state.currentView === viewId) return;
    this.state.currentView = viewId;
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewId);
    });

    // Update views
    document.querySelectorAll('.view-layer').forEach(layer => {
      layer.classList.remove('active');
    });
    document.getElementById(`view-${viewId}`).classList.add('active');

    // Update title
    const titles = { dashboard: 'Dashboard', vault: 'Vault', editor: 'Meditor', library: 'Library' };
    document.getElementById('view-title').textContent = titles[viewId] || 'Notak2';

    // Trigger view-specific loads if necessary
    if (viewId === 'vault') vault.loadWorkspaces();
    if (viewId === 'editor') editor.loadNotes();
    if (viewId === 'library') library.loadItems();
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
  },

  updateNetworkStatus() {
    const el = document.getElementById('network-status');
    if (this.state.online) {
      el.textContent = 'Online';
      el.className = 'online';
    } else {
      el.textContent = 'Offline';
      el.className = 'offline';
    }
  },

  showToast(message, type = 'info') {
    // Simple toast implementation
    console.log(`[Toast] ${type}: ${message}`);
    // In a full implementation, this would render a DOM element.
  }
};

window.addEventListener('DOMContentLoaded', () => app.init());
