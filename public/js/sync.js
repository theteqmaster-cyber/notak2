// public/js/sync.js — Client-side Sync Manager

const syncManager = {
  isSyncing: false,
  indicator: null,
  text: null,
  intervalId: null,

  init() {
    this.indicator = document.querySelector('.sync-dot');
    this.text = document.querySelector('.sync-text');
    
    // Auto-sync every 60 seconds
    this.intervalId = setInterval(() => this.triggerSync(), 60000);
    // Initial sync on startup
    setTimeout(() => this.triggerSync(), 2000);
  },

  async triggerSync() {
    if (this.isSyncing || !navigator.onLine || app.state.isWebMode) return;
    
    this.isSyncing = true;
    this.updateStatus('pending', 'Syncing...');

    try {
      // In a real implementation, this would hit a local endpoint
      // that triggers the local sqlite -> cloud push/pull.
      // For now, we simulate the delay to show the UI state.
      await new Promise(r => setTimeout(r, 1000));
      
      this.updateStatus('synced', 'Synced');
      
      // Reload active view data
      if (app.state.currentView === 'editor') editor.loadNotes();
      if (app.state.currentView === 'vault') vault.loadWorkspaces();
      if (app.state.currentView === 'library') library.loadItems();
      
    } catch (e) {
      console.error('Sync failed', e);
      this.updateStatus('error', 'Sync Failed');
    } finally {
      this.isSyncing = false;
    }
  },

  updateStatus(state, message) {
    if (!this.indicator || !this.text) return;
    this.indicator.className = `sync-dot ${state}`;
    this.text.textContent = message;
  }
};
