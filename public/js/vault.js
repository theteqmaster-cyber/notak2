// public/js/vault.js — File and Course Manager

const vault = {
  defaultWorkspaceId: null,
  courses: [],
  activeCourseId: null,

  async init() {
    await this.ensureWorkspace();
    await this.loadCourses();
  },

  async ensureWorkspace() {
    try {
      let res = await fetch('/api/workspaces');
      let workspaces = await res.json();
      if (workspaces.length === 0) {
        res = await fetch('/api/workspaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'My Space' })
        });
        const ws = await res.json();
        this.defaultWorkspaceId = ws.id;
      } else {
        this.defaultWorkspaceId = workspaces[0].id;
      }
    } catch (e) {
      console.error('Failed to ensure workspace', e);
    }
  },

  async loadCourses() {
    if (!this.defaultWorkspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${this.defaultWorkspaceId}/folders`);
      if (res.ok) {
        this.courses = await res.json();
        this.renderCourses();
        if (this.courses.length > 0 && !this.activeCourseId) {
          this.selectCourse(this.courses[0].id);
        }
      }
    } catch (e) { console.error('Failed to load courses', e); }
  },

  renderCourses() {
    const list = document.getElementById('course-list');
    list.innerHTML = '';
    this.courses.forEach(c => {
      const li = document.createElement('li');
      li.textContent = c.name;
      li.className = this.activeCourseId === c.id ? 'active' : '';
      li.onclick = () => this.selectCourse(c.id);
      list.appendChild(li);
    });
  },

  async createCourse() {
    const name = prompt('Course Name:');
    if (!name) return;
    try {
      const res = await fetch(`/api/workspaces/${this.defaultWorkspaceId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        this.loadCourses();
      }
    } catch (e) { console.error('Failed to create course', e); }
  },

  async selectCourse(id) {
    this.activeCourseId = id;
    this.renderCourses();
    
    const course = this.courses.find(c => c.id === id);
    if (course) {
      document.getElementById('current-course-name').textContent = course.name;
      document.getElementById('course-toolbar').classList.remove('hidden');
    }

    // Load notes and files for this course
    try {
      const [notesRes, filesRes] = await Promise.all([
        fetch(`/api/notes?folder_id=${id}&limit=100`),
        fetch(`/api/files?folder_id=${id}&limit=100`)
      ]);
      
      let notes = [], files = [];
      if (notesRes.ok) notes = (await notesRes.json()).data;
      if (filesRes.ok) files = (await filesRes.json()).data;
      
      const items = [
        ...notes.map(n => ({ ...n, type: 'note' })),
        ...files.map(f => ({ ...f, type: 'file' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const grid = document.getElementById('course-content-grid');
      grid.innerHTML = '';
      if (items.length === 0) {
        grid.innerHTML = '<div class="empty-state">This course is empty.</div>';
        return;
      }
      
      items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'lib-item';
        const title = item.type === 'note' ? item.title : item.name;
        const icon = item.type === 'note' ? '📝' : '📄';
        
        el.innerHTML = `
          <div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>
          <h4>${title}</h4>
          <p>${new Date(item.created_at).toLocaleDateString()}</p>
        `;
        
        if (item.type === 'note') {
           el.onclick = () => { app.navigate('editor'); editor.openNote(item.id); };
           el.style.cursor = 'pointer';
        } else {
           el.onclick = () => this.downloadFile(item.id);
           el.style.cursor = 'pointer';
        }
        
        grid.appendChild(el);
      });
    } catch (e) {
      console.error('Failed to load course contents', e);
    }
  },

  async downloadFile(id) {
    try {
      const res = await fetch(`/api/files/${id}/download`);
      if (res.ok) {
        const data = await res.json();
        // Open the presigned R2 URL in a new tab to download
        window.open(data.url, '_blank');
      }
    } catch (e) {
      console.error('Download failed', e);
    }
  },

  async uploadFile(event) {
    if (!this.activeCourseId) {
      alert('Please select a course first');
      return;
    }
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', this.activeCourseId);
    
    document.getElementById('file-upload-input').value = ''; 
    
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        this.selectCourse(this.activeCourseId); // Refresh grid
        library.loadItems();
      } else {
        const err = await res.json();
        alert('Upload failed: ' + err.error);
      }
    } catch (e) { 
      console.error('Failed to upload file', e); 
      alert('Upload failed.');
    }
  }
};
