/* ═══════════════════════════════════════════════════════════════════
   Pure utility helpers
═══════════════════════════════════════════════════════════════════ */
function formatDollars(value) {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(p) {
  return `${p}%`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function applyDiscount(val) {
  return val * (1 - state.discountPct / 100);
}

function growthHint(pct) {
  if (pct > 0) return `<span class="growth-tag growth-tag--up">↑ Growth</span>`;
  if (pct < 0) return `<span class="growth-tag growth-tag--down">↓ Optimising</span>`;
  return `<span class="growth-tag growth-tag--flat">No change</span>`;
}
