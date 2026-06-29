// public/js/library.js — Read-only document viewer with Focus Mode
const library = {
  items: [],
  focusPanels: [],
  nextPanelId: 1,

  init() { },

  async loadItems() {
    try {
      const [notesRes, filesRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/files')
      ]);
      
      let notes = [];
      let files = [];
      if (notesRes.ok) notes = (await notesRes.json()).data;
      if (filesRes.ok) files = (await filesRes.json()).data;

      this.items = [
        ...notes.map(n => ({ ...n, type: 'note' })),
        ...files.map(f => ({ ...f, type: 'file' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      this.renderItems(this.items);
    } catch (e) { console.error('Failed to load library items', e); }
  },

  filterItems() {
    const query = document.getElementById('library-search').value.toLowerCase();
    const filtered = this.items.filter(item => 
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query))
    );
    this.renderItems(filtered);
  },

  renderItems(itemsToRender) {
    const grid = document.getElementById('library-grid');
    grid.innerHTML = '';
    
    if (itemsToRender.length === 0) {
      grid.innerHTML = '<div class="empty-state">No materials found.</div>';
      return;
    }

    itemsToRender.forEach(item => {
      const el = document.createElement('div');
      el.className = 'lib-item';
      
      const title = item.type === 'note' ? item.title : item.name;
      const icon = item.type === 'note' ? '📝' : '📄';
      
      el.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>
        <h4>${title}</h4>
        <p>${new Date(item.created_at).toLocaleDateString()}</p>
      `;
      el.addEventListener('click', () => {
        if (item.type === 'note') this.openReader(title, item.content, 'md');
        else this.openReader(title, item.url, 'pdf');
      });
      grid.appendChild(el);
    });
  },

  openReader(title, contentOrUrl, type) {
    document.getElementById('reader-overlay').classList.remove('hidden');
    document.getElementById('reader-title').textContent = title;
    
    const mdContainer = document.getElementById('md-content');
    const pdfViewer = document.getElementById('pdf-viewer');
    
    if (type === 'md') {
      mdContainer.style.display = 'block';
      pdfViewer.style.display = 'none';
      pdfViewer.src = '';
      mdContainer.innerHTML = marked.parse(contentOrUrl || 'Empty note.');
    } else if (type === 'pdf') {
      mdContainer.style.display = 'none';
      pdfViewer.style.display = 'block';
      pdfViewer.src = contentOrUrl;
    }
  },

  closeReader() {
    document.getElementById('reader-overlay').classList.add('hidden');
    document.getElementById('pdf-viewer').src = '';
  },

  // Focus Mode
  openFocusMode() {
    document.getElementById('focus-overlay').classList.remove('hidden');
    if (this.focusPanels.length === 0) {
      for(let i=0; i<4; i++) this.addFocusPanel();
    }
    this.renderFocusPanels();
  },

  closeFocusMode() {
    document.getElementById('focus-overlay').classList.add('hidden');
  },

  applyLayout(layout) {
    document.getElementById('focus-grid').className = 'layout-' + layout;
    document.querySelectorAll('.layout-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('onclick').includes("'" + layout + "'"));
    });
  },

  addFocusPanel() {
    if (this.focusPanels.length >= 4) return;
    this.focusPanels.push({
      id: this.nextPanelId++,
      q: '',
      view: 'list', // 'list' or 'reader'
      activeItem: null
    });
  },

  renderFocusPanels() {
    const grid = document.getElementById('focus-grid');
    grid.innerHTML = '';
    this.focusPanels.forEach(p => {
      const el = document.createElement('div');
      el.className = 'focus-panel';
      
      if (p.view === 'list') {
        el.innerHTML = `
          <div class="panel-toolbar">
            <input type="text" class="panel-search" placeholder="Search materials..." value="${p.q}">
          </div>
          <div class="panel-body"></div>
        `;
        const searchInput = el.querySelector('.panel-search');
        const body = el.querySelector('.panel-body');
        
        const renderList = () => {
          body.innerHTML = '';
          const query = p.q.toLowerCase();
          const filtered = this.items.filter(item => 
            (item.title && item.title.toLowerCase().includes(query)) ||
            (item.name && item.name.toLowerCase().includes(query))
          );
          filtered.forEach(item => {
            const title = item.type === 'note' ? item.title : item.name;
            const icon = item.type === 'note' ? '📝' : '📄';
            const iEl = document.createElement('div');
            iEl.className = 'panel-item';
            iEl.innerHTML = `<span class="pi-icon">${icon}</span><span class="pi-title">${title}</span>`;
            iEl.addEventListener('click', () => {
              p.view = 'reader';
              p.activeItem = item;
              this.renderFocusPanels();
            });
            body.appendChild(iEl);
          });
        };
        
        searchInput.addEventListener('input', (e) => {
          p.q = e.target.value;
          renderList();
        });
        renderList();
        
      } else {
        // Reader view
        const item = p.activeItem;
        const title = item.type === 'note' ? item.title : item.name;
        el.innerHTML = `
          <div class="pr-top">
            <button class="pr-back">← Back</button>
            <div class="pr-title">${title}</div>
          </div>
          <div class="panel-reader"></div>
        `;
        el.querySelector('.pr-back').addEventListener('click', () => {
          p.view = 'list';
          p.activeItem = null;
          this.renderFocusPanels();
        });
        
        const reader = el.querySelector('.panel-reader');
        if (item.type === 'note') {
          reader.innerHTML = '<div id="md-content" style="padding:20px;overflow-y:auto;">' + marked.parse(item.content || 'Empty.') + '</div>';
        } else {
          reader.innerHTML = '<iframe src="' + item.url + '" style="width:100%;height:100%;border:none;"></iframe>';
        }
      }
      grid.appendChild(el);
    });
  }
};
