// Notak2 — app.js

// ── Sidebar toggle (mobile) ──────────────────────────
const toggle  = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:99;';
document.body.appendChild(overlay);

if (toggle && sidebar) {
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
  });
}

// ── Auto-dismiss flash messages ──────────────────────
document.querySelectorAll('.flash').forEach(el => {
  setTimeout(() => {
    el.style.transition = 'opacity .4s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
  }, 4000);
});

// ── File drop zone ───────────────────────────────────
const dropZone = document.querySelector('.file-drop');
const fileInput = document.getElementById('file-input');

if (dropZone && fileInput) {
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      updateFileLabel(e.dataTransfer.files[0].name);
    }
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) updateFileLabel(fileInput.files[0].name);
  });
  function updateFileLabel(name) {
    const label = dropZone.querySelector('.file-drop-label');
    if (label) label.textContent = name;
  }
}

// ── Confirm delete dialogs ───────────────────────────
document.querySelectorAll('[data-confirm]').forEach(btn => {
  btn.addEventListener('click', e => {
    if (!confirm(btn.dataset.confirm)) e.preventDefault();
  });
});

// ── Type selector highlight (upload form) ───────────
document.querySelectorAll('.type-selector-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-selector-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('type-input').value = btn.dataset.type;
  });
});
