/* ═══════════════════════════════════════════════════════════════════
   Band Model Modal — "Show model use" popup per budget band
═══════════════════════════════════════════════════════════════════ */

const bandModalEl    = document.getElementById('band-model-modal');
const bandModalClose = document.getElementById('band-modal-close');

let _lastTriggerBtn = null;
let _overlayMousedownOnSelf = false;

function computeModelMetricsForUsers(usernameSet) {
  const modelMap = new Map();
  const countMap = new Map();
  let groupSpend = 0;

  for (const row of state.parsedRows) {
    const username = (row.username || '').trim();
    if (!usernameSet.has(username)) continue;
    const model  = (row.model || 'Unknown').trim();
    const amount = parseFloat(row.aic_gross_amount) || 0;
    const qty    = parseFloat(row.quantity) || 0;
    modelMap.set(model, (modelMap.get(model) || 0) + amount);
    countMap.set(model, (countMap.get(model) || 0) + qty);
    groupSpend += amount;
  }

  const modelBreakdown = [...modelMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([model, amount]) => [model, amount, countMap.get(model) || 0]);

  let autoSpend = 0;
  for (const [model, amount] of modelMap) {
    if (/^Auto:/i.test(model)) autoSpend += amount;
  }

  const autoPct      = groupSpend > 0 ? (autoSpend / groupSpend) * 100 : 0;
  const userCount    = usernameSet.size;
  const avgPerUser   = userCount > 0 ? groupSpend / userCount : 0;
  const shareOfTotal = state.totalSpend > 0 ? (groupSpend / state.totalSpend) * 100 : 0;

  return { userCount, groupSpend, avgPerUser, shareOfTotal, modelBreakdown, autoPct };
}

function showBandModelModal(band, triggerBtn) {
  _lastTriggerBtn = triggerBtn || null;

  const usernameSet = new Set(band.userSlice.map(([u]) => u));
  const { userCount, groupSpend, avgPerUser, shareOfTotal, modelBreakdown, autoPct }
    = computeModelMetricsForUsers(usernameSet);

  document.getElementById('band-modal-title').textContent    = band.label;
  document.getElementById('band-modal-subtitle').textContent = band.bandLabel;

  document.getElementById('band-modal-kpis').innerHTML = `
    <div class="band-modal-kpi">
      <span class="kpi-label">Users</span>
      <span class="kpi-value">${userCount.toLocaleString()}</span>
    </div>
    <div class="band-modal-kpi">
      <span class="kpi-label">Total Spend</span>
      <span class="kpi-value">${formatDollars(groupSpend)}</span>
    </div>
    <div class="band-modal-kpi">
      <span class="kpi-label">Avg / User</span>
      <span class="kpi-value">${formatDollars(avgPerUser)}</span>
    </div>
    <div class="band-modal-kpi">
      <span class="kpi-label">Auto: Mode</span>
      <span class="kpi-value">${autoPct.toFixed(1)}%</span>
    </div>
    <div class="band-modal-kpi">
      <span class="kpi-label">Share of Total</span>
      <span class="kpi-value">${shareOfTotal.toFixed(1)}%</span>
    </div>`;

  document.getElementById('band-modal-model-list').innerHTML
    = buildModelBreakdownHTML(modelBreakdown, groupSpend);

  bandModalEl.classList.remove('hidden');
  bandModalClose.focus();
}

function closeBandModelModal() {
  bandModalEl.classList.add('hidden');
  document.getElementById('band-modal-kpis').innerHTML = '';
  document.getElementById('band-modal-model-list').innerHTML = '';
  if (_lastTriggerBtn) { _lastTriggerBtn.focus(); _lastTriggerBtn = null; }
}

function initBandModal() {
  bandModalClose.addEventListener('click', closeBandModelModal);

  bandModalEl.addEventListener('mousedown', e => {
    _overlayMousedownOnSelf = (e.target === bandModalEl);
  });

  bandModalEl.addEventListener('click', e => {
    if (e.target === bandModalEl && _overlayMousedownOnSelf) closeBandModelModal();
    _overlayMousedownOnSelf = false;
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !bandModalEl.classList.contains('hidden')) {
      e.preventDefault();
      closeBandModelModal();
    }
  });
}
