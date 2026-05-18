/* ═══════════════════════════════════════════════════════════════════
   app.js — thin entry point; wires together all modules
═══════════════════════════════════════════════════════════════════ */

/* ── Sidebar & navigation ──────────────────────────────────────── */
const appShell      = document.getElementById('app-shell');
const sidebarToggle = document.getElementById('sidebar-toggle');
const hamburgerBtn  = document.getElementById('hamburger-btn');
const backdrop      = document.getElementById('sidebar-backdrop');

sidebarToggle.addEventListener('click', () => {
  const collapsed = appShell.classList.toggle('collapsed');
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
});

hamburgerBtn.addEventListener('click', () => {
  const open = appShell.classList.toggle('mobile-open');
  hamburgerBtn.setAttribute('aria-expanded', String(open));
});
backdrop.addEventListener('click', closeMobileSidebar);

function closeMobileSidebar() {
  appShell.classList.remove('mobile-open');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(item.dataset.page);
    closeMobileSidebar();
  });
});

function navigateTo(pageId) {
  if (pageId !== 'budget-analysis') closeBandModelModal();
  document.querySelectorAll('.nav-item').forEach(i => {
    const active = i.dataset.page === pageId;
    i.classList.toggle('active', active);
    i.setAttribute('aria-current', active ? 'page' : 'false');
  });
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`${pageId}-page`).classList.remove('hidden');
  if (pageId === 'budget-analysis') renderBudgetPage();
}

/* ── Upload / drag-drop ─────────────────────────────────────────── */
const dropZone   = document.getElementById('drop-zone');
const fileInput  = document.getElementById('file-input');
const newFileBtn = document.getElementById('new-file-btn');

dropZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});
newFileBtn.addEventListener('click', () => {
  resetToUpload();
  navigateTo('model-analysis');
});

/* ── Module initialisation ──────────────────────────────────────── */
initModelAnalysis();
initBudgetAnalysis(() => navigateTo('model-analysis'));
initBandModal();
