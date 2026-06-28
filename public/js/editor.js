// public/js/editor.js — Meditor Note Editor

const editor = {
  notes: [],
  activeNoteId: null,

  init() {
    // Setup listeners for real-time saving (debounced)
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    
    let timeout = null;
    const saveTrigger = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.saveNote(), 1000);
    };

    titleInput.addEventListener('input', saveTrigger);
    contentInput.addEventListener('input', saveTrigger);
  },

  async loadNotes() {
    try {
      const folderId = document.getElementById('editor-folder-select').value;
      const url = folderId ? `/api/notes?folder_id=${folderId}` : '/api/notes';
      const res = await fetch(url);
      if (res.ok) {
        const responseData = await res.json();
        this.notes = responseData.data;
        this.renderNotesList();
      }
    } catch (e) { console.error('Failed to load notes', e); }
  },

  renderNotesList() {
    const list = document.getElementById('note-list');
    list.innerHTML = '';
    this.notes.forEach(n => {
      const li = document.createElement('li');
      li.textContent = n.title || 'Untitled';
      li.className = this.activeNoteId === n.id ? 'active' : '';
      
      // Sync badge
      if (!app.state.isWebMode) {
         const badge = document.createElement('span');
         badge.className = `badge ${n.sync_status}`;
         badge.style.float = 'right';
         badge.textContent = n.sync_status === 'synced' ? '✓' : '!';
         li.appendChild(badge);
      }
      
      li.onclick = () => this.openNote(n.id);
      list.appendChild(li);
    });
  },

  async openNote(id) {
    this.activeNoteId = id;
    this.renderNotesList();

    try {
      const res = await fetch(`/api/notes/${id}`);
      if (res.ok) {
        const note = await res.json();
        document.getElementById('note-title-input').value = note.title;
        document.getElementById('note-content-input').value = note.content;
        
        const badge = document.getElementById('note-sync-badge');
        badge.className = `badge ${note.sync_status}`;
        badge.textContent = note.sync_status.toUpperCase();
        
        document.getElementById('active-note-container').classList.remove('hidden');
        document.getElementById('editor-empty').classList.add('hidden');
      }
    } catch (e) { console.error('Failed to open note', e); }
  },

  async createNewNote(forcedFolderId) {
    const folderId = forcedFolderId || document.getElementById('editor-folder-select').value;
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Note',
          content: '',
          folder_id: folderId || null
        })
      });
      if (res.ok) {
        const newNote = await res.json();
        this.notes.unshift(newNote); // Add to top
        this.openNote(newNote.id);
      }
    } catch (e) { console.error('Failed to create note', e); }
  },

  async saveNote() {
    if (!this.activeNoteId) return;
    
    const title = document.getElementById('note-title-input').value;
    const content = document.getElementById('note-content-input').value;
    const badge = document.getElementById('note-sync-badge');
    
    badge.className = 'badge pending';
    badge.textContent = 'SAVING...';

    try {
      const res = await fetch(`/api/notes/${this.activeNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, sync_status: 'pending' })
      });
      
      if (res.ok) {
        const updated = await res.json();
        // Update local state
        const idx = this.notes.findIndex(n => n.id === updated.id);
        if (idx !== -1) {
          this.notes[idx].title = updated.title;
          this.notes[idx].sync_status = updated.sync_status;
        }
        this.renderNotesList();
        
        badge.className = `badge ${updated.sync_status}`;
        badge.textContent = updated.sync_status.toUpperCase();
        
        // Trigger sync agent if local
        if (!app.state.isWebMode && window.syncManager) {
          syncManager.triggerSync();
        }
      }
    } catch (e) { 
      console.error('Failed to save note', e); 
      badge.className = 'badge conflict';
      badge.textContent = 'OFFLINE';
    }
  },

  async deleteCurrentNote() {
    if (!this.activeNoteId) return;
    if (!confirm('Delete this note?')) return;
    
    try {
      const res = await fetch(`/api/notes/${this.activeNoteId}`, { method: 'DELETE' });
      if (res.ok) {
        this.activeNoteId = null;
        document.getElementById('active-note-container').classList.add('hidden');
        document.getElementById('editor-empty').classList.remove('hidden');
        this.loadNotes();
      }
    } catch (e) { console.error('Failed to delete note', e); }
  }
};
