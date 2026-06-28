// public/js/library.js — Read-only document viewer

const library = {
  items: [], // Mixed notes and files

  init() {
    // Basic init
  },

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
      grid.appendChild(el);
    });
  }
};
