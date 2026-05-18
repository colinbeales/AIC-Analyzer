/* ═══════════════════════════════════════════════════════════════════
   Data — CSV parsing and aggregation
═══════════════════════════════════════════════════════════════════ */

const uploadError = document.getElementById('upload-error');

function showError(msg) {
  uploadError.textContent = msg;
  uploadError.classList.remove('hidden');
}

function hideError() {
  uploadError.classList.add('hidden');
  uploadError.textContent = '';
}

function inferSeatCounts(rows) {
  const userMaxQuota = new Map();

  for (const row of rows) {
    const username = (row.username || '').trim();
    if (!username) continue;

    const quota = parseFloat(row.total_monthly_quota);
    const normalizedQuota = Number.isFinite(quota) ? quota : 0;
    const currentMax = userMaxQuota.get(username) || 0;
    if (normalizedQuota > currentMax) userMaxQuota.set(username, normalizedQuota);
  }

  let enterpriseSeats = 0;
  let businessSeats = 0;
  for (const quota of userMaxQuota.values()) {
    // Only users with a positive monthly quota count as licensed seats.
    if (quota >= 1000) {
      enterpriseSeats += 1;
    } else if (quota > 0) {
      businessSeats += 1;
    }
  }

  return { businessSeats, enterpriseSeats };
}

function aggregateData() {
  state.userSpendMap = new Map();
  state.totalSpend   = 0;
  state.dateMin      = '';
  state.dateMax      = '';

  for (const row of state.parsedRows) {
    const username = (row.username || '').trim();
    const amount   = parseFloat(row.aic_gross_amount) || 0;
    const date     = (row.date || '').trim();
    if (!username) continue;
    state.userSpendMap.set(username, (state.userSpendMap.get(username) || 0) + amount);
    state.totalSpend += amount;
    if (date) {
      if (!state.dateMin || date < state.dateMin) state.dateMin = date;
      if (!state.dateMax || date > state.dateMax) state.dateMax = date;
    }
  }
  state.totalUsers = state.userSpendMap.size;

  const { businessSeats, enterpriseSeats } = inferSeatCounts(state.parsedRows);
  state.bizSeats = businessSeats;
  state.entSeats = enterpriseSeats;
}

function handleFile(file) {
  hideError();
  if (!file.name.endsWith('.csv')) { showError('Please select a .csv file.'); return; }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim().replace(/^\uFEFF/, ''),
    complete: results => {
      let rows = results.data;
      if (!rows.length) { showError('The CSV appears to be empty.'); return; }
      if (!('aic_gross_amount' in rows[0])) {
        showError('Could not find an "aic_gross_amount" column. Is this a GitHub Copilot billing export?');
        return;
      }

      // Normalization logic for 2026-04-24 to 2026-04-30
      const APRIL_BACKFILL_START_DATE = '2026-04-24';
      const APRIL_BACKFILL_END_DATE = '2026-04-30';
      function isAprilBackfillDate(date) {
        return date >= APRIL_BACKFILL_START_DATE && date <= APRIL_BACKFILL_END_DATE;
      }
      function isRequestUsageRecord(row) {
        // Adjust this check if your CSV has a different way to identify request usage
        return (row.usage_type || row.unit_type || '').toLowerCase().includes('request');
      }
      rows = rows.filter(row => {
        const date = (row.date || '').trim();
        if (!isAprilBackfillDate(date)) return true;
        const quantity = parseFloat(row.quantity) || 0;
        const totalMonthlyQuota = parseFloat(row.total_monthly_quota) || 0;
        if (quantity === 0 && totalMonthlyQuota !== 0) {
          return false; // Remove this row
        }
        return true;
      }).map(row => {
        const date = (row.date || '').trim();
        if (!isAprilBackfillDate(date)) return row;
        const totalMonthlyQuota = parseFloat(row.total_monthly_quota) || 0;
        if (totalMonthlyQuota === 0 && isRequestUsageRecord(row)) {
          // Halve aic_quantity and aic_gross_amount, zero out others
          return {
            ...row,
            quantity: 0,
            gross_amount: 0,
            discount_amount: 0,
            net_amount: 0,
            aic_quantity: row.aic_quantity ? (parseFloat(row.aic_quantity) * 0.5).toString() : row.aic_quantity,
            aic_gross_amount: row.aic_gross_amount ? (parseFloat(row.aic_gross_amount) * 0.5).toString() : row.aic_gross_amount,
          };
        }
        return row;
      });

      state.parsedRows = rows;
      aggregateData();
      if (state.totalUsers === 0) {
        showError('No valid usage rows found — check the CSV contains usernames and amounts.');
        return;
      }
      showDashboard();
    },
    error: err => showError(`CSV parse error: ${err.message}`),
  });
}

function resetToUpload() {
  closeBandModelModal();
  state.parsedRows   = [];
  state.userSpendMap = new Map();
  state.totalSpend   = 0;
  state.totalUsers   = 0;
  state.bizSeats     = 0;
  state.entSeats     = 0;
  document.getElementById('file-input').value = '';
  document.getElementById('dashboard-view').classList.add('hidden');
  document.getElementById('upload-view').classList.remove('hidden');
  hideError();
}
