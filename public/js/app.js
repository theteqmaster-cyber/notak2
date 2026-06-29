// public/js/app.js — NServer-style SPA shell
'use strict';

const app = {
  currentView: 'dashboard',
  user: null,

  init() {
    this.loadUser();
    this.bindNav();
    this.startClock();
    this.loadDashboard();
  },

  async loadUser() {
    try {
      const r = await fetch('/api/me');
      if (!r.ok) return;
      const { user } = await r.json();
      this.user = user;
      const name = user.name || user.email;
      // Greeting
      const hour = new Date().getHours();
      const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const g = document.getElementById('greeting');
      if (g) g.textContent = `${greet}, ${name.split(' ')[0]}`;
      // Sidebar user
      const su = document.getElementById('sidebar-user');
      if (su) su.textContent = name;
    } catch(e) {}
  },

  bindNav() {
    // Hamburger open
    const ham = document.getElementById('hamburger');
    const backdrop = document.getElementById('drawer-backdrop');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('drawer-close');
    const brand = document.getElementById('header-brand');
    const sidebarBrand = document.getElementById('sidebar-brand');

    const openSidebar = () => { sidebar.classList.add('open'); backdrop.classList.add('active'); };
    const closeSidebar = () => { sidebar.classList.remove('open'); backdrop.classList.remove('active'); };

    if (ham) ham.addEventListener('click', openSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (brand) brand.addEventListener('click', () => { this.navigate('dashboard'); });
    if (sidebarBrand) sidebarBrand.addEventListener('click', () => { this.navigate('dashboard'); closeSidebar(); });

    // Nav items
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        this.navigate(item.dataset.view);
        closeSidebar();
      });
    });

    // Action cards on dashboard
    document.querySelectorAll('.action-card[data-view]').forEach(card => {
      card.addEventListener('click', () => this.navigate(card.dataset.view));
    });

    // Dash search
    const dsBtn = document.getElementById('dash-search-btn');
    const dsInput = document.getElementById('dash-search');
    if (dsBtn) dsBtn.addEventListener('click', () => {
      const q = dsInput?.value?.trim();
      if (q) { this.navigate('vault'); }
    });
  },

  navigate(view) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    // Show target
    const target = document.getElementById(`view-${view}`);
    if (target) target.classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const navItem = document.getElementById(`nav-${view}`);
    if (navItem) navItem.classList.add('active');

    // Update header label
    const label = document.getElementById('header-view-label');
    const names = { dashboard:'Dashboard', vault:'My Vault', editor:'Meditor', library:'Library' };
    if (label) label.textContent = names[view] || view;

    this.currentView = view;

    // Lazy-load view data
    if (view === 'vault' && window.vault) vault.init();
    if (view === 'editor' && window.editor) editor.init();
    if (view === 'library' && window.library) library.init();
    if (view === 'dashboard') this.loadDashboard();
  },

  async loadDashboard() {
    // Date label
    const dateEl = document.getElementById('dash-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-ZW', {
        weekday:'long', year:'numeric', month:'long', day:'numeric'
      });
    }

    // Stat pills
    try {
      const [wsRes, notesRes, filesRes] = await Promise.all([
        fetch('/api/workspaces'),
        fetch('/api/notes?limit=1'),
        fetch('/api/files?limit=1')
      ]);
      if (wsRes.ok) {
        const ws = await wsRes.json();
        const el = document.getElementById('pill-workspaces');
        if (el) el.querySelector('.pill-val').textContent = ws.length;
      }
      if (notesRes.ok) {
        const nd = await notesRes.json();
        const el = document.getElementById('pill-notes');
        if (el) el.querySelector('.pill-val').textContent = nd.meta?.total ?? 0;
      }
      if (filesRes.ok) {
        const fd = await filesRes.json();
        const el = document.getElementById('pill-files');
        if (el) el.querySelector('.pill-val').textContent = fd.meta?.total ?? 0;
      }
    } catch(e) {}

    // Recent files
    try {
      const r = await fetch('/api/files?limit=6');
      if (!r.ok) return;
      const { data } = await r.json();
      const container = document.getElementById('dash-recent');
      if (!container) return;
      if (!data || !data.length) {
        container.innerHTML = '<div class="empty-state">No files yet. Upload some to your vault.</div>';
        return;
      }
      container.innerHTML = '';
      data.forEach(f => {
        const icon = this.fileIcon(f.mime || '');
        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
          <div class="file-card-icon">${icon}</div>
          <div class="file-card-info">
            <div class="file-card-name">${this.esc(f.name)}</div>
            <div class="file-card-meta">${new Date(f.created_at).toLocaleDateString()}</div>
          </div>`;
        card.addEventListener('click', () => this.navigate('vault'));
        container.appendChild(card);
      });
    } catch(e) {}
  },

  startClock() {
    const tick = () => {
      const now = new Date();
      const t = now.toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' });
      const ts = now.toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      const hc = document.getElementById('header-clock');
      const sc = document.getElementById('sidebar-clock');
      const mc = document.getElementById('mini-clock');
      if (hc) hc.textContent = t;
      if (sc) sc.textContent = ts;
      if (mc) mc.textContent = ts;
    };
    tick();
    setInterval(tick, 1000);
  },

  fileIcon(mime) {
    if (mime.includes('pdf')) return '📄';
    if (mime.startsWith('image/')) return '🖼️';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📑';
    if (mime.startsWith('text/') || mime.includes('markdown')) return '📝';
    return '📁';
  },

  esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  toast(msg, type='success') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
};

// Vault module
window.vault = {
  activeWorkspaceId: null,
  allFiles: [],
  activeCat: 'all',
  page: 1,
  perPage: 20,

  async init() {
    await this.loadWorkspaces();
    this.bindEvents();
  },

  async loadWorkspaces() {
    try {
      const r = await fetch('/api/workspaces');
      if (!r.ok) return;
      const workspaces = await r.json();
      const list = document.getElementById('course-list');
      if (!list) return;
      list.innerHTML = '';
      workspaces.forEach(ws => {
        const li = document.createElement('li');
        li.className = 'course-item';
        li.textContent = ws.name;
        li.dataset.id = ws.id;
        li.addEventListener('click', () => {
          document.querySelectorAll('.course-item').forEach(i => i.classList.remove('active'));
          li.classList.add('active');
          this.activeWorkspaceId = ws.id;
          document.getElementById('vault-title').textContent = ws.name;
          this.loadFiles();
        });
        list.appendChild(li);
      });
      // Populate upload workspace select
      this.populateWorkspaceSelects(workspaces);
    } catch(e) {}
  },

  populateWorkspaceSelects(workspaces) {
    ['upload-workspace-select'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = workspaces.map(w => `<option value="${w.id}">${app.esc(w.name)}</option>`).join('');
    });
  },

  async loadFiles() {
    const grid = document.getElementById('vault-files');
    if (!grid) return;
    grid.innerHTML = '<div class="empty-state">Loading…</div>';
    try {
      const wsId = this.activeWorkspaceId;
      if (!wsId) { grid.innerHTML = '<div class="empty-state">Select a workspace.</div>'; return; }
      const r = await fetch(`/api/files?folder_id=${wsId}&limit=200`);
      if (!r.ok) throw new Error('Failed');
      const { data } = await r.json();
      this.allFiles = data || [];
      this.renderFiles();
    } catch(e) {
      grid.innerHTML = '<div class="empty-state">Could not load files.</div>';
    }
  },

  renderFiles() {
    const search = document.getElementById('vault-search')?.value?.toLowerCase() || '';
    const grid = document.getElementById('vault-files');
    if (!grid) return;
    let files = this.allFiles.filter(f => {
      const matchSearch = !search || f.name.toLowerCase().includes(search);
      const matchCat = this.activeCat === 'all' || this.getCat(f.mime) === this.activeCat;
      return matchSearch && matchCat;
    });
    const start = (this.page - 1) * this.perPage;
    const paged = files.slice(start, start + this.perPage);
    const totalPages = Math.ceil(files.length / this.perPage);

    document.getElementById('vprev').disabled = this.page <= 1;
    document.getElementById('vnext').disabled = this.page >= totalPages;
    document.getElementById('vpage-label').textContent = totalPages > 1 ? `Page ${this.page} / ${totalPages}` : '';
    document.getElementById('vcount-label').textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;

    if (!paged.length) { grid.innerHTML = '<div class="empty-state">No files here yet.</div>'; return; }
    grid.innerHTML = '';
    paged.forEach(f => {
      const icon = app.fileIcon(f.mime || '');
      const card = document.createElement('div');
      card.className = 'file-card';
      card.innerHTML = `
        <div class="file-card-icon">${icon}</div>
        <div class="file-card-info">
          <div class="file-card-name">${app.esc(f.name)}</div>
          <div class="file-card-meta">${new Date(f.created_at).toLocaleDateString()} · ${this.fmtSize(f.size)}</div>
        </div>
        <span class="file-card-course">${this.getCat(f.mime)}</span>`;
      card.addEventListener('click', () => this.downloadFile(f));
      grid.appendChild(card);
    });
  },

  async downloadFile(f) {
    try {
      const r = await fetch(`/api/files/${f.id}/download`);
      const { url } = await r.json();
      window.open(url, '_blank');
    } catch(e) { app.toast('Download failed', 'error'); }
  },

  getCat(mime='') {
    if (mime.includes('pdf')) return 'PDFs';
    if (mime.startsWith('image/')) return 'Images';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'Slides';
    if (mime.startsWith('text/') || mime.includes('markdown')) return 'Notes';
    return 'Other';
  },

  fmtSize(bytes=0) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + 'KB';
    return (bytes/1048576).toFixed(1) + 'MB';
  },

  async createCourse() {
    document.getElementById('course-modal').classList.remove('hidden');
    document.getElementById('course-name-input').focus();
  },

  bindEvents() {
    // Filter tabs
    document.querySelectorAll('.ftab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeCat = tab.dataset.cat;
        this.page = 1;
        this.renderFiles();
      });
    });
    // Search
    const vs = document.getElementById('vault-search');
    if (vs) vs.addEventListener('input', () => { this.page = 1; this.renderFiles(); });
    // Pagination
    document.getElementById('vprev')?.addEventListener('click', () => { this.page--; this.renderFiles(); });
    document.getElementById('vnext')?.addEventListener('click', () => { this.page++; this.renderFiles(); });
    // Upload button
    document.getElementById('btn-upload-file')?.addEventListener('click', () => {
      document.getElementById('upload-modal').classList.remove('hidden');
    });
    // New workspace
    document.getElementById('btn-new-course')?.addEventListener('click', () => this.createCourse());
    // Upload modal
    this.bindUploadModal();
    // Course modal
    this.bindCourseModal();
  },

  bindUploadModal() {
    const dz = document.getElementById('upload-drop-zone');
    const fi = document.getElementById('upload-file-input');
    const fl = document.getElementById('upload-file-list');
    let pendingFiles = [];

    if (dz) {
      dz.addEventListener('click', () => fi.click());
      dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
      dz.addEventListener('drop', e => {
        e.preventDefault(); dz.classList.remove('dragover');
        addFiles([...e.dataTransfer.files]);
      });
    }
    if (fi) fi.addEventListener('change', () => addFiles([...fi.files]));

    const addFiles = (files) => {
      pendingFiles = [...pendingFiles, ...files];
      renderFileList();
    };

    const renderFileList = () => {
      if (!fl) return;
      fl.innerHTML = '';
      pendingFiles.forEach((f, i) => {
        const item = document.createElement('div');
        item.className = 'upload-file-item';
        item.innerHTML = `<span class="file-name">${app.esc(f.name)}</span><span class="file-size">${vault.fmtSize(f.size)}</span><button class="remove-btn">✕</button>`;
        item.querySelector('.remove-btn').addEventListener('click', () => {
          pendingFiles.splice(i, 1); renderFileList();
        });
        fl.appendChild(item);
      });
    };

    document.getElementById('btn-upload-cancel')?.addEventListener('click', () => {
      document.getElementById('upload-modal').classList.add('hidden');
      pendingFiles = []; renderFileList();
    });

    document.getElementById('btn-upload-submit')?.addEventListener('click', async () => {
      if (!pendingFiles.length) return;
      const wsId = document.getElementById('upload-workspace-select')?.value;
      const cat = document.getElementById('upload-category-select')?.value || 'auto';
      const bar = document.getElementById('upload-vault-bar');
      const status = document.getElementById('upload-vault-status');
      const wrap = document.getElementById('upload-progress-wrap');
      if (wrap) wrap.classList.remove('hidden');
      let done = 0;
      for (const f of pendingFiles) {
        const fd = new FormData();
        fd.append('file', f);
        if (wsId) fd.append('folder_id', wsId);
        try {
          const r = await fetch('/api/files', { method:'POST', body: fd });
          if (!r.ok) throw new Error('Upload failed');
        } catch(e) { app.toast(`Failed: ${f.name}`, 'error'); }
        done++;
        if (bar) bar.style.width = `${(done/pendingFiles.length)*100}%`;
        if (status) status.textContent = `${done} / ${pendingFiles.length} uploaded`;
      }
      app.toast('Upload complete!');
      document.getElementById('upload-modal').classList.add('hidden');
      if (wrap) wrap.classList.add('hidden');
      if (bar) bar.style.width = '0%';
      pendingFiles = []; renderFileList();
      this.loadFiles();
    });
  },

  bindCourseModal() {
    document.getElementById('btn-course-cancel')?.addEventListener('click', () => {
      document.getElementById('course-modal').classList.add('hidden');
    });
    document.getElementById('btn-course-create')?.addEventListener('click', async () => {
      const name = document.getElementById('course-name-input')?.value?.trim();
      if (!name) return;
      try {
        const r = await fetch('/api/workspaces', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ name })
        });
        if (!r.ok) throw new Error('Failed');
        app.toast('Workspace created!');
        document.getElementById('course-modal').classList.add('hidden');
        document.getElementById('course-name-input').value = '';
        await this.loadWorkspaces();
      } catch(e) { app.toast('Could not create workspace', 'error'); }
    });
  }
};

// Editor module
window.editor = {
  activeNoteId: null,
  dirty: false,

  async init() {
    await this.loadWorkspaces();
    this.bindEvents();
  },

  async loadWorkspaces() {
    try {
      const r = await fetch('/api/workspaces');
      if (!r.ok) return;
      const ws = await r.json();
      const sel = document.getElementById('note-workspace-select');
      if (!sel) return;
      sel.innerHTML = '<option value="">Select workspace…</option>' +
        ws.map(w => `<option value="${w.id}">${app.esc(w.name)}</option>`).join('');
    } catch(e) {}
  },

  setStatus(s) {
    const chip = document.getElementById('note-status');
    if (!chip) return;
    chip.className = `status-chip ${s}`;
    const labels = { pending:'PENDING', ready:'READY', loaded:'LOADED', unsaved:'UNSAVED' };
    chip.textContent = labels[s] || s.toUpperCase();
  },

  createNewNote() {
    this.activeNoteId = null;
    this.dirty = false;
    const ed = document.getElementById('note-editor');
    if (!ed) return;
    ed.contentEditable = 'true';
    ed.innerHTML = '';
    document.getElementById('meditor-toolbar')?.classList.remove('hidden');
    this.setStatus('ready');
    ed.focus();
  },

  async loadNoteList() {
    const wsId = document.getElementById('note-workspace-select')?.value;
    if (!wsId) return;
    try {
      const r = await fetch(`/api/notes?folder_id=${wsId}&limit=50`);
      if (!r.ok) return;
      const { data } = await r.json();
      const drop = document.getElementById('open-note-dropdown');
      if (!drop) return;
      drop.innerHTML = '';
      drop.classList.remove('hidden');
      if (!data.length) {
        drop.innerHTML = '<div class="fm-item" style="color:#555;">No notes yet</div>';
        return;
      }
      data.forEach(n => {
        const item = document.createElement('div');
        item.className = 'fm-item';
        item.textContent = n.title || 'Untitled';
        item.addEventListener('click', () => { this.openNote(n.id); drop.classList.add('hidden'); });
        drop.appendChild(item);
      });
      // Recent notes sidebar
      const rl = document.getElementById('recent-notes-list');
      if (rl) {
        rl.innerHTML = '';
        data.slice(0,10).forEach(n => {
          const li = document.createElement('li');
          li.textContent = n.title || 'Untitled';
          li.addEventListener('click', () => this.openNote(n.id));
          rl.appendChild(li);
        });
      }
    } catch(e) {}
  },

  async openNote(id) {
    try {
      const r = await fetch(`/api/notes/${id}`);
      if (!r.ok) throw new Error('Not found');
      const note = await r.json();
      this.activeNoteId = id;
      this.dirty = false;
      const ed = document.getElementById('note-editor');
      if (!ed) return;
      ed.contentEditable = 'true';
      ed.innerHTML = marked.parse(note.content || '');
      document.getElementById('meditor-toolbar')?.classList.remove('hidden');
      this.setStatus('loaded');
    } catch(e) { app.toast('Could not open note', 'error'); }
  },

  async saveNote() {
    const ed = document.getElementById('note-editor');
    const wsId = document.getElementById('note-workspace-select')?.value;
    if (!ed) return;
    const content = ed.innerText;
    const title = content.split('\n')[0].replace(/^#+ /, '').trim().slice(0, 80) || 'Untitled';
    try {
      if (this.activeNoteId) {
        await fetch(`/api/notes/${this.activeNoteId}`, {
          method:'PUT', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ title, content })
        });
      } else {
        const r = await fetch('/api/notes', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ title, content, folder_id: wsId || null })
        });
        const note = await r.json();
        this.activeNoteId = note.id;
      }
      this.dirty = false;
      this.setStatus('loaded');
      app.toast('Note saved!');
    } catch(e) { app.toast('Save failed', 'error'); }
  },

  closeNote() {
    if (this.dirty && !confirm('Unsaved changes. Close anyway?')) return;
    this.activeNoteId = null;
    this.dirty = false;
    const ed = document.getElementById('note-editor');
    if (ed) { ed.contentEditable = 'false'; ed.innerHTML = ''; }
    document.getElementById('meditor-toolbar')?.classList.add('hidden');
    this.setStatus('pending');
  },

  bindEvents() {
    document.getElementById('note-workspace-select')?.addEventListener('change', () => {
      this.setStatus('ready');
    });
    document.getElementById('btn-note-new')?.addEventListener('click', () => this.createNewNote());
    document.getElementById('btn-note-open')?.addEventListener('click', () => this.loadNoteList());
    document.getElementById('btn-note-save')?.addEventListener('click', () => this.saveNote());
    document.getElementById('btn-note-close')?.addEventListener('click', () => this.closeNote());

    // WYSIWYG toolbar
    document.querySelectorAll('.ed-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => document.execCommand(btn.dataset.cmd, false, null));
    });
    document.getElementById('ed-format')?.addEventListener('change', e => {
      document.execCommand('formatBlock', false, e.target.value);
    });
    document.getElementById('ed-cmd-code')?.addEventListener('click', () => {
      document.execCommand('insertHTML', false, '<pre><code>code here</code></pre>');
    });
    document.getElementById('ed-cmd-sym')?.addEventListener('click', () => {
      document.getElementById('symbols-dropdown')?.classList.toggle('hidden');
    });
    document.querySelectorAll('.sym').forEach(s => {
      s.addEventListener('click', () => { document.execCommand('insertText', false, s.textContent); });
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#ed-cmd-sym') && !e.target.closest('#symbols-dropdown')) {
        document.getElementById('symbols-dropdown')?.classList.add('hidden');
      }
      if (!e.target.closest('#btn-note-open') && !e.target.closest('#open-note-dropdown')) {
        document.getElementById('open-note-dropdown')?.classList.add('hidden');
      }
    });

    // Sidebar toggle
    document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
      document.getElementById('notes-sidebar')?.classList.toggle('collapsed');
    });
    document.getElementById('btn-close-sidebar')?.addEventListener('click', () => {
      document.getElementById('notes-sidebar')?.classList.add('collapsed');
    });

    // Dirty tracking
    document.getElementById('note-editor')?.addEventListener('input', () => {
      if (!this.dirty) { this.dirty = true; this.setStatus('unsaved'); }
    });

    // Ctrl+S shortcut
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); this.saveNote(); }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
