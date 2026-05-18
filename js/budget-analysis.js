/* ═══════════════════════════════════════════════════════════════════
   Budget Analysis — all page logic
═══════════════════════════════════════════════════════════════════ */

const budgetNoData   = document.getElementById('budget-no-data');
const budgetContent  = document.getElementById('budget-content');
const budgetGoUpload = document.getElementById('budget-go-upload');

let licenceListenersAttached = false;

function renderBudgetPage() {
  if (!state.parsedRows.length) {
    budgetNoData.classList.remove('hidden');
    budgetContent.classList.add('hidden');
    return;
  }
  budgetNoData.classList.add('hidden');
  budgetContent.classList.remove('hidden');

  if (state.bizSeats === 0 && state.entSeats === 0) state.bizSeats = state.totalUsers;

  const budgetMetaBar = document.getElementById('budget-meta-bar');
  const { dateMin, dateMax, totalUsers, totalSpend, discountPct } = state;
  const dateLabel = dateMin && dateMax
    ? (dateMin === dateMax ? dateMin : `${dateMin} → ${dateMax}`)
    : 'Unknown';
  budgetMetaBar.innerHTML =
    `<span class="meta-item">📅 <strong>${dateLabel}</strong></span>` +
    `<span class="meta-item">👥 <strong>${totalUsers.toLocaleString()}</strong> users in CSV</span>` +
    `<span class="meta-item">💰 Gross spend: <strong>${formatDollars(totalSpend)}</strong></span>` +
    (discountPct > 0
      ? `<span class="meta-item">🏷 Discounted spend: <strong>${formatDollars(applyDiscount(totalSpend))}</strong></span>`
      : '');

  document.getElementById('biz-seats-input').value = state.bizSeats;
  document.getElementById('ent-seats-input').value = state.entSeats;
  document.getElementById('discount-input').value  = state.discountPct;
  document.getElementById('promo-toggle').checked  = state.promoEnabled;
  document.getElementById('promo-rates').classList.toggle('hidden', !state.promoEnabled);
  document.getElementById('promo-off-note').classList.toggle('hidden', state.promoEnabled);
  updateSeatRateLabels();
  updatePoolLabels();

  attachLicenceInputListeners();
  renderPoolSummary();
  renderPoolChart();
  renderBudgetTierControls();
  renderBudgetResults();
}

function initBudgetAnalysis(navigateToModelAnalysis) {
  budgetGoUpload.addEventListener('click', navigateToModelAnalysis);

  document.querySelectorAll('.tier-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const count = parseInt(btn.dataset.count);
      document.querySelectorAll('.tier-count-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.count) === count);
        b.setAttribute('aria-pressed', String(parseInt(b.dataset.count) === count));
      });
      state.budgetTierCount = count;
      while (state.budgetTierPcts.length < state.budgetTierCount) {
        const last = state.budgetTierPcts[state.budgetTierPcts.length - 1] ?? 25;
        state.budgetTierPcts.push(Math.min(99, last + 15));
      }
      state.budgetTierPcts = state.budgetTierPcts.slice(0, state.budgetTierCount);
      while (state.budgetGrowthPcts.length < state.budgetTierCount + 1) state.budgetGrowthPcts.push(0);
      state.budgetGrowthPcts = state.budgetGrowthPcts.slice(0, state.budgetTierCount + 1);
      renderBudgetTierControls();
      renderBudgetResults();
    });
  });
}

/* ── Licence / discount helpers ─────────────────────────────────── */
function computeMonthCount() {
  const months = new Set(state.parsedRows.map(r => (r.date || '').slice(0, 7)).filter(Boolean));
  return Math.max(1, months.size);
}

function computePool() {
  const r = activeRates();
  return (state.bizSeats * r.biz + state.entSeats * r.ent) * computeMonthCount();
}

function updatePoolLabels() {
  const months = computeMonthCount();
  const r = activeRates();
  document.getElementById('biz-pool-label').textContent =
    `= ${formatDollars(state.bizSeats * r.biz * months)}`;
  document.getElementById('ent-pool-label').textContent =
    `= ${formatDollars(state.entSeats * r.ent * months)}`;

  const badge = document.getElementById('discount-badge');
  if (state.discountPct > 0) {
    badge.textContent = `Saving ${formatDollars(state.totalSpend * (state.discountPct / 100))} on this report`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function attachLicenceInputListeners() {
  if (licenceListenersAttached) return;
  licenceListenersAttached = true;

  document.getElementById('biz-seats-input').addEventListener('input', () => {
    state.bizSeats = Math.max(0, parseInt(document.getElementById('biz-seats-input').value) || 0);
    updatePoolLabels(); renderPoolSummary(); renderPoolChart(); renderBudgetResults();
  });
  document.getElementById('ent-seats-input').addEventListener('input', () => {
    state.entSeats = Math.max(0, parseInt(document.getElementById('ent-seats-input').value) || 0);
    updatePoolLabels(); renderPoolSummary(); renderPoolChart(); renderBudgetResults();
  });
  document.getElementById('discount-input').addEventListener('input', () => {
    state.discountPct = Math.max(0, Math.min(100,
      parseFloat(document.getElementById('discount-input').value) || 0));
    updatePoolLabels(); renderPoolSummary(); renderPoolChart();
    renderBudgetTierControls(); renderBudgetResults();
  });
  document.getElementById('promo-toggle').addEventListener('change', e => {
    state.promoEnabled = e.target.checked;
    updateSeatRateLabels();
    updatePoolLabels(); renderPoolSummary(); renderPoolChart(); renderBudgetResults();
    document.getElementById('promo-rates').classList.toggle('hidden', !state.promoEnabled);
    document.getElementById('promo-off-note').classList.toggle('hidden', state.promoEnabled);
  });
}

function updateSeatRateLabels() {
  const r = activeRates();
  const bizRateEl = document.querySelector('.seat-row:first-child .seat-rate');
  const entRateEl = document.querySelector('.seat-row:last-child .seat-rate');
  if (bizRateEl) bizRateEl.textContent = `$${r.biz} included AI credits / seat / month${state.promoEnabled ? ' 🎁' : ''}`;
  if (entRateEl) entRateEl.textContent = `$${r.ent} included AI credits / seat / month${state.promoEnabled ? ' 🎁' : ''}`;
}

/* ── Pool summary & chart ───────────────────────────────────────── */
function renderPoolSummary() {
  const pool            = computePool();
  const discountedSpend = applyDiscount(state.totalSpend);
  const fromPool        = Math.min(discountedSpend, pool);
  const additional      = Math.max(0, discountedSpend - pool);
  const months          = computeMonthCount();
  const periodLabel     = months === 1 ? '1 month' : `${months} months`;
  const r = activeRates();
  const promoTag = state.promoEnabled ? ' <span class="promo-tag">🎁 Promo</span>' : '';

  document.getElementById('pool-summary').innerHTML = `
    <div class="pool-kpis">
      <div class="pool-kpi">
        <span class="pool-kpi-label">Included Credits Pool${promoTag}</span>
        <span class="pool-kpi-value pool-kpi-value--pool">${formatDollars(pool)}</span>
        <span class="pool-kpi-sub">${(state.bizSeats + state.entSeats).toLocaleString()} seats · ${periodLabel} · $${r.biz}/$${r.ent} rates</span>
      </div>
      <div class="pool-kpi">
        <span class="pool-kpi-label">Actual Spend${state.discountPct > 0 ? ` (−${state.discountPct}%)` : ''}</span>
        <span class="pool-kpi-value">${formatDollars(discountedSpend)}</span>
        ${state.discountPct > 0
          ? `<span class="pool-kpi-sub">gross ${formatDollars(state.totalSpend)}</span>`
          : '<span class="pool-kpi-sub">no discount applied</span>'}
      </div>
      <div class="pool-kpi">
        <span class="pool-kpi-label">From Included Pool</span>
        <span class="pool-kpi-value pool-kpi-value--included">${formatDollars(fromPool)}</span>
        <span class="pool-kpi-sub">${pool > 0 ? ((fromPool / pool) * 100).toFixed(1) + '% of pool used' : '—'}</span>
      </div>
      <div class="pool-kpi ${additional > 0 ? 'pool-kpi--overage' : ''}">
        <span class="pool-kpi-label">Additional AI Credits</span>
        <span class="pool-kpi-value pool-kpi-value--additional">${formatDollars(additional)}</span>
        <span class="pool-kpi-sub">${additional > 0 ? 'charged above pool' : 'within included credits'}</span>
      </div>
    </div>`;
}

function renderPoolChart() {
  const canvas = document.getElementById('pool-chart');
  if (!canvas) return;

  const pool            = computePool();
  const discountedSpend = applyDiscount(state.totalSpend);
  const fromPool        = Math.min(discountedSpend, pool);
  const additional      = Math.max(0, discountedSpend - pool);

  if (state.poolChartInstance) { state.poolChartInstance.destroy(); state.poolChartInstance = null; }

  state.poolChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['AI Credit Spend'],
      datasets: [
        {
          label: 'From Included Pool',
          data: [fromPool],
          backgroundColor: 'rgba(22,163,74,0.85)',
          borderColor: '#16a34a',
          borderWidth: 1,
          borderRadius: 0,
        },
        {
          label: 'Additional AI Credits',
          data: [additional],
          backgroundColor: additional > 0 ? 'rgba(220,38,38,0.80)' : 'transparent',
          borderColor: additional > 0 ? '#dc2626' : 'transparent',
          borderWidth: 1,
          borderRadius: 0,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 14,
            font: { size: 12 },
            filter: item => !(item.text === 'Additional AI Credits' && additional === 0),
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.x;
              if (!v || v <= 0) return null;
              const pct = discountedSpend > 0 ? ((v / discountedSpend) * 100).toFixed(1) : '0.0';
              return ` ${ctx.dataset.label}: ${formatDollars(v)} (${pct}% of spend)`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            callback: v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)),
            font: { size: 11 },
            maxTicksLimit: 8,
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        y: {
          stacked: true,
          ticks: { font: { size: 12 } },
          grid: { display: false },
        },
      },
    },
  });
}

/* ── Tier controls ──────────────────────────────────────────────── */
function renderBudgetTierControls() {
  const container = document.getElementById('budget-tiers-container');

  const tierRows = state.budgetTierPcts.map((pct, i) => `
    <div class="budget-tier-row">
      <div class="tier-dot tier-dot-${i}" aria-hidden="true"></div>
      <span class="tier-row-name">Tier ${i + 1} — Power Users</span>
      <div class="tier-row-input-group">
        <span>Top</span>
        <input type="number" class="tier-pct-input"
               data-tier="${i}" value="${pct}"
               min="1" max="99" step="1"
               aria-label="Tier ${i + 1} top percentile cutoff" />
        <span>% of users</span>
      </div>
      <div class="tier-row-growth-group">
        <span class="growth-label">Forecast</span>
        <input type="number" class="tier-growth-input"
               data-growth="${i}" value="${state.budgetGrowthPcts[i] ?? 0}"
               min="-100" max="500" step="1"
               aria-label="Tier ${i + 1} forecast growth %" />
        <span class="growth-unit">%</span>
        <span class="growth-hint">${growthHint(state.budgetGrowthPcts[i] ?? 0)}</span>
      </div>
    </div>`).join('');

  const univGrowth = state.budgetGrowthPcts[state.budgetTierCount] ?? 0;
  const universalRow = `
    <div class="budget-tier-row budget-tier-row--universal">
      <div class="tier-dot" style="background:#64748b" aria-hidden="true"></div>
      <span class="tier-row-name">Universal Users</span>
      <div class="tier-row-input-group tier-row-input-group--faint">
        <span>Below all tiers</span>
      </div>
      <div class="tier-row-growth-group">
        <span class="growth-label">Forecast</span>
        <input type="number" class="tier-growth-input"
               data-growth="${state.budgetTierCount}" value="${univGrowth}"
               min="-100" max="500" step="1"
               aria-label="Universal users forecast growth %" />
        <span class="growth-unit">%</span>
        <span class="growth-hint">${growthHint(univGrowth)}</span>
      </div>
    </div>`;

  container.innerHTML = tierRows + universalRow;

  container.querySelectorAll('.tier-pct-input').forEach(input => {
    input.addEventListener('change', () => {
      const tier = parseInt(input.dataset.tier);
      let val = parseFloat(input.value);
      if (isNaN(val)) return;
      val = Math.max(1, Math.min(99, val));
      if (tier > 0) val = Math.max(val, state.budgetTierPcts[tier - 1] + 1);
      state.budgetTierPcts[tier] = val;
      input.value = val;
      for (let j = tier + 1; j < state.budgetTierPcts.length; j++) {
        if (state.budgetTierPcts[j] <= state.budgetTierPcts[j - 1]) {
          state.budgetTierPcts[j] = state.budgetTierPcts[j - 1] + 1;
        }
      }
      renderBudgetTierControls();
      renderBudgetResults();
    });
  });

  container.querySelectorAll('.tier-growth-input').forEach(input => {
    input.addEventListener('change', () => {
      const idx = parseInt(input.dataset.growth);
      const val = parseFloat(input.value);
      if (isNaN(val)) return;
      state.budgetGrowthPcts[idx] = val;
      renderBudgetTierControls();
      renderBudgetResults();
    });
  });
}

/* ── Band computation ───────────────────────────────────────────── */
function computeBudgetBands() {
  const sorted = [...state.userSpendMap.entries()].sort((a, b) => b[1] - a[1]);
  const N = sorted.length;
  if (!N) return [];

  const bands = [];
  let prevEnd = 0;

  state.budgetTierPcts.forEach((pct, i) => {
    const endIdx = Math.min(N, Math.ceil(pct / 100 * N));
    if (endIdx <= prevEnd) return;

    const slice     = sorted.slice(prevEnd, endIdx);
    const tierSpend = slice.reduce((s, [, v]) => s + v, 0);
    const avgSpend  = slice.length > 0 ? tierSpend / slice.length : 0;
    const prevPct   = i === 0 ? 0 : state.budgetTierPcts[i - 1];
    const bandLabel = prevEnd === 0
      ? `Top ${fmtPct(pct)}`
      : `${fmtPct(prevPct)} – ${fmtPct(pct)}`;

    bands.push({
      label: `Power Users — Tier ${i + 1}`,
      bandLabel,
      users:    slice.length,
      tierSpend,
      avgSpend,
      growthPct: state.budgetGrowthPcts[i] ?? 0,
      colorIdx:  i,
      isUniversal: false,
      userSlice: slice,
    });
    prevEnd = endIdx;
  });

  if (prevEnd < N) {
    const slice     = sorted.slice(prevEnd);
    const tierSpend = slice.reduce((s, [, v]) => s + v, 0);
    const avgSpend  = slice.length > 0 ? tierSpend / slice.length : 0;
    const lastPct   = state.budgetTierPcts[state.budgetTierPcts.length - 1] ?? 0;

    bands.push({
      label: 'Universal Users',
      bandLabel: `${fmtPct(lastPct)} – 100%`,
      users:    slice.length,
      tierSpend,
      avgSpend,
      growthPct: state.budgetGrowthPcts[state.budgetTierCount] ?? 0,
      colorIdx:  -1,
      isUniversal: true,
      userSlice: slice,
    });
  }

  return bands;
}

/* ── Results rendering ──────────────────────────────────────────── */
function renderBudgetResults() {
  const bands      = computeBudgetBands();
  const resultsDiv = document.getElementById('budget-results');
  if (!bands.length) {
    resultsDiv.innerHTML = '<div class="empty-state">No bands to display.</div>';
    return;
  }

  const { dateMin, dateMax, totalSpend, discountPct } = state;
  const periodLabel = dateMin && dateMax
    ? (dateMin === dateMax ? dateMin : `${dateMin} to ${dateMax}`)
    : 'the report period';
  const periodNote = `Spend figures cover ${periodLabel}. ` +
    `Base budget = average spend per user. Recommended budget applies your forecast adjustment.`;

  const bandsHtml = bands.map((band, idx) => {
    const color       = band.isUniversal ? '#64748b' : TIER_COLORS[band.colorIdx % TIER_COLORS.length];
    const budgetColor = band.isUniversal ? '#2563eb' : color;
    const discSpend   = applyDiscount(band.tierSpend);
    const discAvg     = applyDiscount(band.avgSpend);
    const sharePct    = totalSpend > 0 ? (band.tierSpend / totalSpend) * 100 : 0;
    const grossAdjustedBudget  = band.avgSpend * (1 + band.growthPct / 100);
    const actualAdjustedBudget = discAvg * (1 + band.growthPct / 100);
    const growthSign    = band.growthPct > 0 ? '+' : '';
    const hasAdjustment = band.growthPct !== 0;
    const statsGridClass = discountPct > 0
      ? 'budget-band-stats budget-band-stats--with-discount'
      : 'budget-band-stats';

    const recommendedBudgetStat = discountPct > 0
      ? `
        <div class="budget-stat">
          <span class="budget-stat-value budget-stat-value--primary" style="color:${budgetColor}">
            ${formatDollars(grossAdjustedBudget)}
          </span>
          ${hasAdjustment ? `<span class="budget-stat-base">base ${formatDollars(band.avgSpend)}</span>` : ''}
          <span class="budget-stat-label">Recommended Budget / User<br>(to set in GitHub)
            ${hasAdjustment ? `<span class="budget-stat-adj">(${growthSign}${band.growthPct}% forecast)</span>` : ''}
          </span>
        </div>
        <div class="budget-stat">
          <span class="budget-stat-value budget-stat-value--primary" style="color:${budgetColor}">
            ${formatDollars(actualAdjustedBudget)}
          </span>
          ${hasAdjustment ? `<span class="budget-stat-base">base ${formatDollars(discAvg)}</span>` : ''}
          <span class="budget-stat-label">Actual Budget<br>(with ${discountPct}% discount)
            ${hasAdjustment ? `<span class="budget-stat-adj">(${growthSign}${band.growthPct}% forecast)</span>` : ''}
          </span>
        </div>`
      : `
        <div class="budget-stat">
          <span class="budget-stat-value budget-stat-value--primary" style="color:${budgetColor}">
            ${formatDollars(grossAdjustedBudget)}
          </span>
          ${hasAdjustment ? `<span class="budget-stat-base">base ${formatDollars(band.avgSpend)}</span>` : ''}
          <span class="budget-stat-label">Recommended<br>Budget / user
            ${hasAdjustment ? `<span class="budget-stat-adj">(${growthSign}${band.growthPct}% forecast)</span>` : ''}
          </span>
        </div>`;

    return `
      <div class="budget-band-card">
        <div class="budget-band-stripe" style="background:${color}"></div>
        <div class="budget-band-body">
          <div class="budget-band-header">
            <div class="budget-band-title-group">
              <span class="budget-band-name">${escHtml(band.label)}</span>
              <span class="budget-band-range">${escHtml(band.bandLabel)}</span>
            </div>
            <div class="budget-band-header-right">
              <span class="budget-band-users">${band.users.toLocaleString()} user${band.users !== 1 ? 's' : ''}</span>
              <div class="band-action-btns">
                <button class="band-download-btn" data-band="${idx}"
                        aria-label="Download user list for ${escHtml(band.label)}">
                  ↓ Download users
                </button>
                <button class="band-model-btn" data-band="${idx}"
                        aria-label="Show model use for ${escHtml(band.label)}">
                  📊 Show model use
                </button>
              </div>
            </div>
          </div>
          <div class="${statsGridClass}">
            ${recommendedBudgetStat}
            <div class="budget-stat">
              <span class="budget-stat-value">${formatDollars(discSpend)}</span>
              ${discountPct > 0 ? `<span class="budget-stat-base">gross ${formatDollars(band.tierSpend)}</span>` : ''}
              <span class="budget-stat-label">Actual spend<br>this period</span>
            </div>
            <div class="budget-stat">
              <span class="budget-stat-value">${sharePct.toFixed(1)}%</span>
              <span class="budget-stat-label">Share of<br>total spend</span>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  const combinedUsers       = state.totalUsers;
  const combinedSpend       = applyDiscount(state.totalSpend);
  const combinedGrossAdj    = bands.reduce((s, b) => s + b.users * b.avgSpend * (1 + b.growthPct / 100), 0);
  const combinedAdj         = bands.reduce((s, b) => s + b.users * applyDiscount(b.avgSpend) * (1 + b.growthPct / 100), 0);
  const combinedAvgAdj      = combinedUsers > 0 ? combinedAdj / combinedUsers : 0;
  const combinedGrossAvgAdj = combinedUsers > 0 ? combinedGrossAdj / combinedUsers : 0;
  const anyAdjusted         = bands.some(b => b.growthPct !== 0);

  const totalCardHtml = state.discountPct > 0
    ? `
      <div class="budget-total-card">
        <span class="budget-total-label">All Users Combined</span>
        <div class="budget-total-right budget-total-right--stacked">
          <div class="budget-total-row">
            <span class="budget-total-value">${formatDollars(combinedGrossAdj)}</span>
            <span class="budget-total-sub">to set in GitHub${anyAdjusted ? ' · forecast' : ''} · avg ${formatDollars(combinedGrossAvgAdj)}/user</span>
          </div>
          <div class="budget-total-row budget-total-row--discounted">
            <span class="budget-total-value budget-total-value--discounted">${formatDollars(combinedAdj)}</span>
            <span class="budget-total-sub">actual with ${state.discountPct}% discount · avg ${formatDollars(combinedAvgAdj)}/user</span>
          </div>
        </div>
      </div>`
    : `
      <div class="budget-total-card">
        <span class="budget-total-label">All Users Combined</span>
        <div class="budget-total-right">
          <span class="budget-total-value">${formatDollars(combinedAdj)}</span>
          ${anyAdjusted
            ? `<span class="budget-total-sub">forecast budget · base ${formatDollars(combinedSpend)} · avg ${formatDollars(combinedAvgAdj)}/user</span>`
            : `<span class="budget-total-sub">/ period · ${combinedUsers.toLocaleString()} users · avg ${formatDollars(combinedAvgAdj)} each</span>`}
        </div>
      </div>`;

  resultsDiv.innerHTML = `
    <p class="budget-period-note">${escHtml(periodNote)}</p>
    <div class="budget-bands">${bandsHtml}</div>
    ${totalCardHtml}`;

  resultsDiv.querySelectorAll('.band-download-btn').forEach(btn => {
    btn.addEventListener('click', () => downloadBandCSV(bands[parseInt(btn.dataset.band)]));
  });

  resultsDiv.querySelectorAll('.band-model-btn').forEach(btn => {
    btn.addEventListener('click', () => showBandModelModal(bands[parseInt(btn.dataset.band)], btn));
  });
}

/* ── CSV download ───────────────────────────────────────────────── */
function downloadBandCSV(band) {
  const rows = [['rank', 'username', 'gross_spend', 'discounted_spend', 'pct_of_band_spend']];
  const bandTotal = band.tierSpend;
  band.userSlice.forEach(([username, spend], i) => {
    const discSpend = applyDiscount(spend);
    const pctOfBand = bandTotal > 0 ? ((spend / bandTotal) * 100).toFixed(2) : '0.00';
    rows.push([i + 1, username, spend.toFixed(2), discSpend.toFixed(2), pctOfBand]);
  });

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const safeName = band.label.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  a.href = url;
  a.download = `${safeName}_users.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
