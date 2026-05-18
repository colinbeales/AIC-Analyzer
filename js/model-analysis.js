/* ═══════════════════════════════════════════════════════════════════
   Model Analysis — compute, render, and page initialisation
═══════════════════════════════════════════════════════════════════ */

/* DOM refs -------------------------------------------------------- */
const uploadView    = document.getElementById('upload-view');
const dashView      = document.getElementById('dashboard-view');
const dashTitle     = document.getElementById('dash-title');
const dashSubtitle  = document.getElementById('dash-subtitle');
const metaBar       = document.getElementById('meta-bar');
const kpiUsers      = document.getElementById('kpi-users');
const kpiUsersSub   = document.getElementById('kpi-users-sub');
const kpiTotal      = document.getElementById('kpi-total');
const kpiShare      = document.getElementById('kpi-share');
const kpiShareSub   = document.getElementById('kpi-share-sub');
const kpiAvg        = document.getElementById('kpi-avg');
const kpiAuto       = document.getElementById('kpi-auto');
const spendBarTrack = document.getElementById('spend-bar-track');
const spendBarFill  = document.getElementById('spend-bar-fill');
const spendBarLabel = document.getElementById('spend-bar-label');
const modelList     = document.getElementById('model-list');
const subCategoryLegend = document.getElementById('sub-category-legend');
const subModelList = document.getElementById('sub-model-list');
const subResults = document.getElementById('sub-results');
const cacheWritePctInput = document.getElementById('cache-write-pct-input');
const pctButtons    = document.querySelectorAll('.pct-btn');
const customWrap    = document.getElementById('custom-pct-wrap');
const customInput   = document.getElementById('custom-pct-input');

const MODEL_PRICING = [
  { model: 'GPT-4.1', provider: 'OpenAI', category: 'Versatile', aic: 2.00, input: 2.00, cache: 0.50, cacheWrite: null, output: 8.00 },
  { model: 'GPT-5 mini', provider: 'OpenAI', category: 'Lightweight', aic: 0.25, input: 0.25, cache: 0.025, cacheWrite: null, output: 2.00 },
  { model: 'GPT-5.2', provider: 'OpenAI', category: 'Versatile', aic: 1.75, input: 1.75, cache: 0.175, cacheWrite: null, output: 14.00 },
  { model: 'GPT-5.2-Codex', provider: 'OpenAI', category: 'Powerful', aic: 1.75, input: 1.75, cache: 0.175, cacheWrite: null, output: 14.00 },
  { model: 'GPT-5.3-Codex', provider: 'OpenAI', category: 'Powerful', aic: 1.75, input: 1.75, cache: 0.175, cacheWrite: null, output: 14.00 },
  { model: 'GPT-5.4', provider: 'OpenAI', category: 'Versatile', aic: 2.50, input: 2.50, cache: 0.25, cacheWrite: null, output: 15.00 },
  { model: 'GPT-5.4 mini', provider: 'OpenAI', category: 'Lightweight', aic: 0.75, input: 0.75, cache: 0.075, cacheWrite: null, output: 4.50 },
  { model: 'GPT-5.4 nano', provider: 'OpenAI', category: 'Lightweight', aic: 0.20, input: 0.20, cache: 0.02, cacheWrite: null, output: 1.25 },
  { model: 'GPT-5.5', provider: 'OpenAI', category: 'Powerful', aic: 5.00, input: 5.00, cache: 0.50, cacheWrite: null, output: 30.00 },
  { model: 'Claude Haiku 4.5', provider: 'Anthropic', category: 'Versatile', aic: 1.00, input: 1.00, cache: 0.10, cacheWrite: 1.25, output: 5.00 },
  { model: 'Claude Sonnet 4', provider: 'Anthropic', category: 'Versatile', aic: 3.00, input: 3.00, cache: 0.30, cacheWrite: 3.75, output: 15.00 },
  { model: 'Claude Sonnet 4.5', provider: 'Anthropic', category: 'Versatile', aic: 3.00, input: 3.00, cache: 0.30, cacheWrite: 3.75, output: 15.00 },
  { model: 'Claude Sonnet 4.6', provider: 'Anthropic', category: 'Versatile', aic: 3.00, input: 3.00, cache: 0.30, cacheWrite: 3.75, output: 15.00 },
  { model: 'Claude Opus 4.5', provider: 'Anthropic', category: 'Powerful', aic: 5.00, input: 5.00, cache: 0.50, cacheWrite: 6.25, output: 25.00 },
  { model: 'Claude Opus 4.6', provider: 'Anthropic', category: 'Powerful', aic: 5.00, input: 5.00, cache: 0.50, cacheWrite: 6.25, output: 25.00 },
  { model: 'Claude Opus 4.7', provider: 'Anthropic', category: 'Powerful', aic: 5.00, input: 5.00, cache: 0.50, cacheWrite: 6.25, output: 25.00 },
  { model: 'Gemini 2.5 Pro', provider: 'Google', category: 'Powerful', aic: 1.25, input: 1.25, cache: 0.125, cacheWrite: null, output: 10.00 },
  { model: 'Gemini 3 Flash', provider: 'Google', category: 'Lightweight', aic: 0.50, input: 0.50, cache: 0.05, cacheWrite: null, output: 3.00 },
  { model: 'Gemini 3.1 Pro', provider: 'Google', category: 'Powerful', aic: 2.00, input: 2.00, cache: 0.20, cacheWrite: null, output: 12.00 },
  { model: 'Grok Code Fast 1', provider: 'xAI', category: 'Lightweight', aic: 0.20, input: 0.20, cache: 0.02, cacheWrite: null, output: 1.50 },
  { model: 'Raptor mini', provider: 'GitHub', category: 'Versatile', aic: 0.25, input: 0.25, cache: 0.025, cacheWrite: null, output: 2.00 },
  { model: 'Goldeneye', provider: 'GitHub', category: 'Powerful', aic: 1.25, input: 1.25, cache: 0.125, cacheWrite: null, output: 10.00 },
];

const DEFAULT_TOKEN_RATIO = { input: 60, cached: 10, cacheWrite: 0, output: 30 };
const APRIL_BACKFILL_START_DATE = '2026-04-24';
const APRIL_BACKFILL_END_DATE = '2026-04-30';

function modelTier(category) {
  if (/powerful/i.test(category)) return 'Reasoning';
  if (/light/i.test(category)) return 'Lite';
  return 'General Purpose';
}

function normalizeModelName(name) {
  return String(name || '')
    .replace(/^Auto:\s*/i, '')
    .replace(/\[\^\d+\]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function inferProviderFromModelName(name) {
  const normalized = normalizeModelName(name);
  if (!normalized) return 'Unknown provider';
  if (normalized.startsWith('gpt')) return 'OpenAI';
  if (normalized.startsWith('claude')) return 'Anthropic';
  if (normalized.startsWith('gemini')) return 'Google';
  if (normalized.startsWith('grok')) return 'xAI';
  if (/raptor|goldeneye/.test(normalized)) return 'GitHub';
  return 'Unknown provider';
}

function isAprilBackfillDate(date) {
  return date >= APRIL_BACKFILL_START_DATE && date <= APRIL_BACKFILL_END_DATE;
}

function isRequestUsageRecord(row) {
  return (row.usage_type || row.unit_type || '').toLowerCase().includes('request');
}

function metricQuantityForRow(row) {
  const date = String(row?.date || '').trim();
  const totalMonthlyQuota = parseFloat(row?.total_monthly_quota);
  const aicQty = parseFloat(row?.aic_quantity);
  const rawQty = parseFloat(row?.quantity);

  if (
    isAprilBackfillDate(date) &&
    (Number.isFinite(totalMonthlyQuota) ? totalMonthlyQuota : 0) === 0 &&
    isRequestUsageRecord(row) &&
    Number.isFinite(aicQty)
  ) {
    return aicQty;
  }

  return Number.isFinite(rawQty) ? rawQty : 0;
}

const MODEL_CATALOG = MODEL_PRICING.map(entry => ({
  ...entry,
  tier: modelTier(entry.category),
  normalized: normalizeModelName(entry.model),
}));

function classifyTokenBucket(row) {
  const haystack = [
    row.usage_type,
    row.unit_type,
    row.sku,
    row.metric,
    row.usage_subtype,
    row.usage_sub_type,
  ].map(v => String(v || '').toLowerCase()).join(' ');

  if (!haystack) return null;
  if (/(cache[\s_-]*write|cached[\s_-]*write)/.test(haystack)) return 'cacheWrite';
  if (/(cached|cache[\s_-]*read)/.test(haystack)) return 'cached';
  if (/(output|completion|response)/.test(haystack)) return 'output';
  if (/(input|prompt)/.test(haystack)) return 'input';
  return null;
}

function tokenRatioFromMix(tokenMix) {
  const input = Math.max(0, Number(tokenMix?.input) || 0);
  const cached = Math.max(0, Number(tokenMix?.cached) || 0);
  const cacheWrite = Math.max(0, Number(tokenMix?.cacheWrite) || 0);
  const output = Math.max(0, Number(tokenMix?.output) || 0);
  const total = input + cached + cacheWrite + output;

  if (total <= 0) return { ...DEFAULT_TOKEN_RATIO };

  return {
    input: (input / total) * 100,
    cached: (cached / total) * 100,
    cacheWrite: (cacheWrite / total) * 100,
    output: (output / total) * 100,
  };
}

function weightedCostPer1M(pricing, tokenRatio) {
  if (!pricing || !tokenRatio) return null;

  const inputFrac = (tokenRatio.input || 0) / 100;
  const cachedFrac = (tokenRatio.cached || 0) / 100;
  let cacheWriteFrac = (tokenRatio.cacheWrite || 0) / 100;
  let cachedReadFrac = cachedFrac;
  const outputFrac = (tokenRatio.output || 0) / 100;

  if (Number.isFinite(pricing.cacheWrite) && pricing.cacheWrite !== null && cacheWriteFrac <= 0 && cachedFrac > 0) {
    const split = getCacheWriteFraction();
    cacheWriteFrac = cachedFrac * split;
    cachedReadFrac = cachedFrac - cacheWriteFrac;
  }

  if (pricing.cacheWrite === null || !Number.isFinite(pricing.cacheWrite)) {
    return inputFrac * pricing.input + (cachedReadFrac + cacheWriteFrac) * pricing.cache + outputFrac * pricing.output;
  }

  return inputFrac * pricing.input + cachedReadFrac * pricing.cache + cacheWriteFrac * pricing.cacheWrite + outputFrac * pricing.output;
}

function comparableRateForModel(model) {
  const weighted = weightedCostPer1M(model?.pricing, model?.tokenRatio);
  if (Number.isFinite(weighted) && weighted > 0) return weighted;
  if (Number.isFinite(model?.effectiveAic) && model.effectiveAic > 0) return model.effectiveAic;
  if (model?.pricing && Number.isFinite(model.pricing.aic) && model.pricing.aic > 0) return model.pricing.aic;
  return null;
}

const QUICK_SHIFT_PCTS = [10, 20, 25, 50, 75, 100];

const MODEL_LOOKUP = new Map(MODEL_CATALOG.map(entry => [entry.normalized, entry]));

function findPricingByUsageModel(modelName) {
  const normalized = normalizeModelName(modelName);
  if (!normalized) return null;
  if (MODEL_LOOKUP.has(normalized)) return MODEL_LOOKUP.get(normalized);

  let best = null;
  let bestLen = 0;
  for (const entry of MODEL_CATALOG) {
    if (normalized.includes(entry.normalized) && entry.normalized.length > bestLen) {
      best = entry;
      bestLen = entry.normalized.length;
    }
  }
  return best;
}

let substitutionNextId = 1;
const substitutionState = {
  replacementsByModel: {},
  cacheWritePct: 20,
};

function getCacheWriteFraction() {
  const pct = Number(substitutionState.cacheWritePct);
  if (!Number.isFinite(pct)) return 0.2;
  return Math.max(0, Math.min(100, pct)) / 100;
}

function newTargetRow(model, pct) {
  return { id: substitutionNextId++, model, pct };
}

function getDefaultTargetModel() {
  return 'GPT-5 mini';
}

function initModelAnalysis() {
  if (cacheWritePctInput) {
    cacheWritePctInput.value = String(substitutionState.cacheWritePct);
    const updateCacheWritePct = () => {
      const raw = parseFloat(cacheWritePctInput.value);
      substitutionState.cacheWritePct = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 20;
      cacheWritePctInput.value = String(Math.round(substitutionState.cacheWritePct));
      if (!dashView.classList.contains('hidden') && state.parsedRows.length) {
        renderDashboard(state.activePct);
      }
    };
    cacheWritePctInput.addEventListener('input', updateCacheWritePct);
    cacheWritePctInput.addEventListener('blur', updateCacheWritePct);
  }

  pctButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pctButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      if (btn.dataset.pct === 'custom') {
        customWrap.classList.remove('hidden');
        customInput.focus();
        const val = parseFloat(customInput.value);
        if (val > 0 && val <= 100) { state.activePct = val; renderDashboard(state.activePct); }
      } else {
        customWrap.classList.add('hidden');
        state.activePct = parseFloat(btn.dataset.pct);
        renderDashboard(state.activePct);
      }
    });
  });

  customInput.addEventListener('input', () => {
    const val = parseFloat(customInput.value);
    if (val > 0 && val <= 100) { state.activePct = val; renderDashboard(state.activePct); }
  });
}

function showDashboard() {
  pctButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  pctButtons[0].classList.add('active');
  pctButtons[0].setAttribute('aria-pressed', 'true');
  customWrap.classList.add('hidden');
  state.activePct = 100;

  uploadView.classList.add('hidden');
  dashView.classList.remove('hidden');
  renderMeta();
  renderDashboard(state.activePct);
}

function renderMeta() {
  const { dateMin, dateMax, parsedRows, totalUsers } = state;
  const dateLabel = dateMin && dateMax
    ? (dateMin === dateMax ? dateMin : `${dateMin} → ${dateMax}`)
    : 'Unknown';
  metaBar.innerHTML =
    `<span class="meta-item">📅 <strong>${dateLabel}</strong></span>` +
    `<span class="meta-item">📄 <strong>${parsedRows.length.toLocaleString()}</strong> rows</span>` +
    `<span class="meta-item">👥 <strong>${totalUsers.toLocaleString()}</strong> users</span>`;
}

function computeMetrics(pct) {
  const { totalUsers, userSpendMap, totalSpend, parsedRows } = state;
  const cutoff   = totalUsers === 0 ? 0
    : Math.min(totalUsers, Math.max(1, Math.ceil(pct / 100 * totalUsers)));
  const sorted   = [...userSpendMap.entries()].sort((a, b) => b[1] - a[1]);
  const topUsers = sorted.slice(0, cutoff);
  const topSet   = new Set(topUsers.map(([u]) => u));
  const groupSpend   = topUsers.reduce((sum, [, v]) => sum + v, 0);
  const shareOfTotal = totalSpend > 0 ? (groupSpend / totalSpend) * 100 : 0;
  const avgPerUser   = cutoff > 0 ? groupSpend / cutoff : 0;

  const modelMap = new Map();
  const countMap = new Map();
  const tokenMixMap = new Map();
  for (const row of parsedRows) {
    const username = (row.username || '').trim();
    if (!topSet.has(username)) continue;
    const model  = (row.model || 'Unknown').trim();
    const amount = parseFloat(row.aic_gross_amount) || 0;
    const qty = metricQuantityForRow(row);
    modelMap.set(model, (modelMap.get(model) || 0) + amount);
    countMap.set(model, (countMap.get(model) || 0) + qty);

    const bucket = classifyTokenBucket(row);
    if (bucket && qty > 0) {
      const mix = tokenMixMap.get(model) || { input: 0, cached: 0, cacheWrite: 0, output: 0 };
      mix[bucket] += qty;
      tokenMixMap.set(model, mix);
    }
  }

  const modelBreakdown = [...modelMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([model, amount]) => {
      const quantity = countMap.get(model) || 0;
      const effectiveAic = quantity > 0 ? amount / quantity : null;
      const tokenMix = tokenMixMap.get(model) || { input: 0, cached: 0, cacheWrite: 0, output: 0 };
      return [model, amount, quantity, effectiveAic, tokenMix];
    });

  let autoSpend = 0;
  for (const [model, amount] of modelMap) {
    if (/^Auto:/i.test(model)) autoSpend += amount;
  }
  const autoPct = groupSpend > 0 ? (autoSpend / groupSpend) * 100 : 0;

  return { cutoff, groupSpend, shareOfTotal, avgPerUser, modelBreakdown, autoPct };
}

function renderDashboard(pct) {
  const { totalUsers, totalSpend } = state;
  const { cutoff, groupSpend, shareOfTotal, avgPerUser, modelBreakdown, autoPct } = computeMetrics(pct);
  const pctLabel = `${pct}%`;

  dashTitle.textContent = `AI Credits — Top ${pctLabel} Analysis`;
  dashSubtitle.textContent =
    `Top ${pctLabel} of users (${cutoff.toLocaleString()} of ${totalUsers.toLocaleString()}) ` +
    `account for ${shareOfTotal.toFixed(1)}% of total AI credit spend`;

  kpiUsers.textContent    = cutoff.toLocaleString();
  kpiUsersSub.textContent = `Top ${pctLabel}`;
  kpiTotal.textContent    = formatDollars(groupSpend);
  kpiShare.textContent    = `${shareOfTotal.toFixed(2)}%`;
  kpiShareSub.textContent = `of ${formatDollars(totalSpend)} total`;
  kpiAvg.textContent      = formatDollars(avgPerUser);
  kpiAuto.textContent     = `${autoPct.toFixed(1)}%`;

  const clampedShare = Math.min(100, shareOfTotal);
  spendBarFill.style.width = `${clampedShare}%`;
  spendBarTrack.setAttribute('aria-valuenow', clampedShare.toFixed(1));
  spendBarLabel.textContent =
    `${shareOfTotal.toFixed(1)}% of total spend · ` +
    `${formatDollars(groupSpend)} of ${formatDollars(totalSpend)}`;

  renderModelBreakdown(modelBreakdown, groupSpend);
  renderSubstitutionSimulator(modelBreakdown, groupSpend, totalSpend);
}

function buildModelBreakdownHTML(models, groupSpend) {
  if (!models.length) return '<div class="empty-state">No data for this selection.</div>';
  const maxAmount = models[0][1];
  return models.map(([model, amount, reqCount], i) => {
    const barWidth   = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
    const pctOfGroup = groupSpend > 0 ? (amount / groupSpend) * 100 : 0;
    const reqLabel   = reqCount > 0
      ? `${reqCount.toLocaleString('en-US', { maximumFractionDigits: 1 })} requests`
      : '';
    return `
      <div class="model-row">
        <span class="model-name" title="${escHtml(model)}">${escHtml(model)}</span>
        <div class="model-bar-wrap"${reqLabel ? ` data-tooltip="${escHtml(reqLabel)}"` : ''}>
          <div class="model-bar-fill bar-c${i % 10}" style="width:${barWidth.toFixed(1)}%"></div>
        </div>
        <span class="model-amount">${formatDollars(amount)}</span>
        <span class="model-pct">${pctOfGroup.toFixed(1)}%</span>
      </div>`;
  }).join('');
}

function renderModelBreakdown(models, groupSpend) {
  modelList.innerHTML = buildModelBreakdownHTML(models, groupSpend);
}

function buildTierOptions(selectedModel, sourceModel) {
  const tiers = ['Reasoning', 'General Purpose', 'Lite'];
  const optionsByTier = new Map(tiers.map(t => [t, []]));
  const sourceRate = comparableRateForModel(sourceModel);
  const sourceRatio = sourceModel?.tokenRatio || DEFAULT_TOKEN_RATIO;

  for (const entry of MODEL_CATALOG) {
    optionsByTier.get(entry.tier).push(entry);
  }

  return tiers.map(tier => {
    const options = optionsByTier.get(tier)
      .sort((a, b) => a.model.localeCompare(b.model))
      .map(entry => {
        const selected = entry.model === selectedModel ? ' selected' : '';
        const targetRate = weightedCostPer1M(entry, sourceRatio) || entry.aic;
        const rel = sourceRate
          ? compareRates(targetRate, sourceRate)
          : { icon: '●', short: 'N/A' };
        return `<option value="${escHtml(entry.model)}"${selected}>${escHtml(entry.model)} · ${entry.provider} · Cost/1M ${targetRate.toFixed(2)} · ${rel.icon} ${rel.short}</option>`;
      })
      .join('');
    return `<optgroup label="${escHtml(tier)}">${options}</optgroup>`;
  }).join('');
}

function getModelKey(name) {
  const modelName = String(name || '').trim();
  const isAuto = /^Auto:\s*/i.test(modelName);
  return `${isAuto ? 'auto' : 'direct'}:${normalizeModelName(modelName)}`;
}

function tierClass(tier) {
  if (tier === 'Reasoning') return 'tier-reasoning';
  if (tier === 'Lite') return 'tier-lite';
  if (tier === 'General Purpose') return 'tier-general';
  return 'tier-unknown';
}

function deltaCue(delta) {
  if (delta > 0.005) return { icon: '▲', label: 'Increase', cls: 'up' };
  if (delta < -0.005) return { icon: '▼', label: 'Savings', cls: 'down' };
  return { icon: '●', label: 'No change', cls: 'flat' };
}

function compareRates(targetRate, sourceRate) {
  if (!Number.isFinite(targetRate) || !Number.isFinite(sourceRate) || sourceRate <= 0) {
    return { icon: '●', cls: 'flat', short: 'N/A', detail: 'Rate comparison unavailable' };
  }

  const diff = targetRate - sourceRate;
  const pct = Math.abs((diff / sourceRate) * 100);

  if (Math.abs(diff) < 0.0001) {
    return { icon: '●', cls: 'flat', short: 'same', detail: 'Same cost as source model' };
  }

  if (diff < 0) {
    return {
      icon: '▼',
      cls: 'down',
      short: `${pct.toFixed(1)}% cheaper`,
      detail: `${pct.toFixed(1)}% cheaper than source model`,
    };
  }

  return {
    icon: '▲',
    cls: 'up',
    short: `${pct.toFixed(1)}% higher`,
    detail: `${pct.toFixed(1)}% more expensive than source model`,
  };
}

function getSourceConfig(sourceKey) {
  if (!substitutionState.replacementsByModel[sourceKey]) {
    substitutionState.replacementsByModel[sourceKey] = { enabled: false, active: false, rows: [] };
  }
  return substitutionState.replacementsByModel[sourceKey];
}

function ensureSubstitutionDefaults(usedModels) {
  const currentKeys = new Set(usedModels.map(m => m.key));
  for (const key of Object.keys(substitutionState.replacementsByModel)) {
    if (!currentKeys.has(key)) delete substitutionState.replacementsByModel[key];
  }

  for (const model of usedModels) {
    getSourceConfig(model.key);
  }
}

function computeSourceProjection(source, sourceConfig) {
  const config = sourceConfig || { enabled: false, active: false, rows: [] };
  const rows = config.rows || [];
  const sourceRate = comparableRateForModel(source);

  const totalShiftPct = rows.reduce((sum, row) => sum + (parseFloat(row.pct) || 0), 0);
  const keepPct = Math.max(0, 100 - totalShiftPct);

  if (!config.active || rows.length === 0) {
    return {
      configured: false,
      invalid: false,
      unresolved: false,
      totalShiftPct,
      keepPct: 100,
      projected: source.amount,
      delta: 0,
    };
  }

  if (totalShiftPct > 100.05) {
    return {
      configured: true,
      invalid: true,
      unresolved: false,
      totalShiftPct,
      keepPct,
      projected: source.amount,
      delta: 0,
    };
  }

  if (!sourceRate) {
    return {
      configured: true,
      invalid: false,
      unresolved: true,
      totalShiftPct,
      keepPct,
      projected: source.amount,
      delta: 0,
    };
  }

  let weightedAic = (keepPct / 100) * sourceRate;
  for (const row of rows) {
    const targetPricing = MODEL_CATALOG.find(entry => entry.model === row.model);
    if (!targetPricing) {
      return {
        configured: true,
        invalid: false,
        unresolved: true,
        totalShiftPct,
        keepPct,
        projected: source.amount,
        delta: 0,
      };
    }
    const targetRate = weightedCostPer1M(targetPricing, source.tokenRatio) || targetPricing.aic;
    if (!Number.isFinite(targetRate) || targetRate <= 0) {
      return {
        configured: true,
        invalid: false,
        unresolved: true,
        totalShiftPct,
        keepPct,
        projected: source.amount,
        delta: 0,
      };
    }
    weightedAic += (row.pct / 100) * targetRate;
  }

  const projected = source.amount * (weightedAic / sourceRate);
  return {
    configured: true,
    invalid: false,
    unresolved: false,
    totalShiftPct,
    keepPct,
    projected,
    delta: projected - source.amount,
  };
}

function renderCategoryLegend() {
  subCategoryLegend.innerHTML =
    '<span class="sub-category-chip tier-reasoning">Reasoning</span>' +
    '<span class="sub-category-chip tier-general">General Purpose</span>' +
    '<span class="sub-category-chip tier-lite">Lite</span>';
}

function buildSourceModelCard(model) {
  const sourceConfig = getSourceConfig(model.key);
  const rows = sourceConfig.rows;
  const projection = computeSourceProjection(model, sourceConfig);
  const cue = deltaCue(projection.delta);
  const sourceTier = model.pricing ? model.pricing.tier : 'Unknown';
  const sourceRate = model.sourceRate;
  const sourceProvider = model.pricing ? model.pricing.provider : inferProviderFromModelName(model.name);
  const rateLevelPct = Number.isFinite(model.rateLevel) ? Math.round(model.rateLevel * 100) : 0;
  const costHue = Math.round(120 - ((Number.isFinite(model.rateLevel) ? model.rateLevel : 0) * 120));
  const ratio = model.tokenRatio || DEFAULT_TOKEN_RATIO;
  const sourceScaleTooltip = sourceRate
    ? `Source cost/1M ${sourceRate.toFixed(2)}. Mix: input ${ratio.input.toFixed(1)}%, cached ${ratio.cached.toFixed(1)}%, cache write ${ratio.cacheWrite.toFixed(1)}%, output ${ratio.output.toFixed(1)}%.`
    : 'Source cost/1M unavailable.';
  const hasSavedOverride = projection.configured && !projection.invalid && !projection.unresolved;
  const summaryStatus = projection.invalid
    ? `Fix mix: ${projection.totalShiftPct.toFixed(1)}% shifted`
    : projection.unresolved
      ? 'Pricing match unavailable'
      : hasSavedOverride
        ? `Saved override: ${projection.totalShiftPct.toFixed(1)}% shifted`
        : 'No override saved';
  const validationClass = projection.invalid ? 'error' : 'ok';
  const validationText = projection.invalid
    ? `Shifted out exceeds 100% (${projection.totalShiftPct.toFixed(1)}%). Reduce replacement percentages.`
    : projection.unresolved
      ? 'Pricing could not be resolved for source or replacement model.'
      : `Shifted out: ${projection.totalShiftPct.toFixed(1)}% · Remaining on original: ${projection.keepPct.toFixed(1)}%`;

  return `
    <div class="substitution-card sub-line-item ${sourceConfig.enabled ? 'is-open' : ''} ${hasSavedOverride ? 'has-saved-override' : ''}" data-source-key="${escHtml(model.key)}">
      <div class="sub-line-summary">
        <div class="sub-summary-left">
          <div class="sub-model-title">${escHtml(model.name)}</div>
          <div class="sub-model-meta">Current spend: ${formatDollars(model.amount)} · ${summaryStatus}</div>
        </div>

        <div class="sub-summary-mid">
          <span class="sub-category-chip ${tierClass(sourceTier)}">${escHtml(sourceTier)}</span>
          <span class="sub-provider-label">${escHtml(sourceProvider)}</span>
          <span class="sub-cost-scale" title="${escHtml(sourceScaleTooltip)}" aria-label="${escHtml(sourceScaleTooltip)}">
            <span class="sub-cost-scale-label">Cost</span>
            <span class="sub-cost-scale-track">
              <span class="sub-cost-scale-fill" style="width:${rateLevelPct}%; --cost-h:${costHue};"></span>
            </span>
          </span>
        </div>

        <div class="sub-summary-right">
          <span class="sub-delta-indicator ${cue.cls}" title="${cue.label}">
            <span class="sub-delta-icon">${cue.icon}</span>
            <span class="sub-delta-value">${projection.delta >= 0 ? '+' : ''}${formatDollars(projection.delta)}</span>
          </span>
          <button class="btn-outline btn-small sub-toggle-override" type="button" aria-expanded="${sourceConfig.enabled ? 'true' : 'false'}">
            ${sourceConfig.enabled ? 'Done' : (hasSavedOverride ? 'Edit' : 'Override')}
          </button>
        </div>
      </div>

      ${sourceConfig.enabled ? `
        <div class="sub-line-panel">
          <div class="substitution-header-row">
            <span class="substitution-label">Shift usage to replacement models</span>
            <div class="sub-header-actions">
              <span class="sub-kept-pill">Keep on original: ${projection.keepPct.toFixed(1)}%</span>
              <button class="btn-outline btn-small sub-add-row-btn" type="button" ${rows.length >= 6 ? 'disabled' : ''}>+ Add model</button>
            </div>
          </div>
          <div class="sub-decision-note">Decision cue: ▼ lower cost/1M, ● same cost/1M, ▲ higher cost/1M vs this source model.</div>
          <div class="sub-target-list">
            ${rows.length ? rows.map(row => `
              <div class="sub-target-block" data-row-id="${row.id}">
                <div class="sub-target-row">
                  <select class="substitution-select sub-target-model" aria-label="Replacement model">
                    ${buildTierOptions(row.model, model)}
                  </select>
                  <div class="sub-pct-stack">
                    <div class="sub-pct-wrap">
                      <button class="sub-pct-stepper" type="button" data-step="-5" aria-label="Decrease replacement percentage by 5">−</button>
                      <label class="sub-pct-field">
                        <input class="sub-pct-input" type="number" min="0" max="100" step="5" inputmode="numeric" value="${Math.round(Number(row.pct) || 0)}" aria-label="Replacement percentage" />
                        <span class="sub-pct-unit">%</span>
                      </label>
                      <button class="sub-pct-stepper" type="button" data-step="5" aria-label="Increase replacement percentage by 5">+</button>
                    </div>
                    <div class="sub-pct-presets" aria-label="Common replacement percentages">
                      ${QUICK_SHIFT_PCTS.map(pct => `<button class="sub-pct-preset ${Math.round(Number(row.pct) || 0) === pct ? 'is-active' : ''}" type="button" data-preset="${pct}">${pct}%</button>`).join('')}
                    </div>
                  </div>
                  <button class="sub-remove-btn" type="button" aria-label="Remove replacement model">Remove</button>
                </div>
                ${(() => {
                  const target = MODEL_CATALOG.find(entry => entry.model === row.model);
                  if (!target || !model.pricing) return '<div class="sub-target-impact flat">● Comparison unavailable</div>';
                  const sourceCost = comparableRateForModel(model);
                  const targetCost = weightedCostPer1M(target, model.tokenRatio) || target.aic;
                  if (!sourceCost || !targetCost) return '<div class="sub-target-impact flat">● Comparison unavailable</div>';
                  const cmp = compareRates(targetCost, sourceCost);
                  return `<div class="sub-target-impact ${cmp.cls}">${cmp.icon} ${cmp.detail}</div>`;
                })()}
              </div>
            `).join('') : '<div class="sub-model-meta">Add one or more replacement models and percentages.</div>'}
          </div>

          <div class="sub-mix-validation ${validationClass}" aria-live="polite">${validationText}</div>
          <div class="sub-source-projection ${cue.cls}">
            ${cue.icon} Projected line impact: ${projection.delta >= 0 ? '+' : ''}${formatDollars(projection.delta)}
            (${formatDollars(model.amount)} -> ${formatDollars(projection.projected)})
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function wireSourceModelCardEvents(usedModels) {
  subModelList.querySelectorAll('.substitution-card[data-source-key]').forEach(cardEl => {
    const sourceKey = cardEl.dataset.sourceKey;
    const sourceConfig = getSourceConfig(sourceKey);
    const rows = sourceConfig.rows;

    const toggleBtn = cardEl.querySelector('.sub-toggle-override');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        sourceConfig.enabled = !sourceConfig.enabled;
        if (sourceConfig.enabled && sourceConfig.rows.length === 0) {
          sourceConfig.rows.push(newTargetRow(getDefaultTargetModel(), 0));
        }
        if (!sourceConfig.enabled) {
          sourceConfig.active = sourceConfig.rows.some(row => (parseFloat(row.pct) || 0) > 0);
        }
        renderDashboard(state.activePct);
      });
    }

    const addBtn = cardEl.querySelector('.sub-add-row-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (rows.length >= 6) return;
        rows.push(newTargetRow(getDefaultTargetModel(), 0));
        renderDashboard(state.activePct);
      });
    }

    cardEl.querySelectorAll('.sub-target-block').forEach(blockEl => {
      const id = parseInt(blockEl.dataset.rowId, 10);
      const modelSelect = blockEl.querySelector('.sub-target-model');
      const pctInput = blockEl.querySelector('.sub-pct-input');
      const stepBtns = blockEl.querySelectorAll('.sub-pct-stepper');
      const presetBtns = blockEl.querySelectorAll('.sub-pct-preset');
      const removeBtn = blockEl.querySelector('.sub-remove-btn');

      modelSelect.addEventListener('change', () => {
        const row = rows.find(t => t.id === id);
        if (!row) return;
        row.model = modelSelect.value;
        sourceConfig.active = sourceConfig.rows.some(entry => (parseFloat(entry.pct) || 0) > 0);
        renderDashboard(state.activePct);
      });

      pctInput.addEventListener('input', () => {
        const row = rows.find(t => t.id === id);
        if (!row) return;
        const val = parseFloat(pctInput.value);
        row.pct = Number.isFinite(val) ? Math.max(0, Math.min(100, Math.round(val))) : 0;
        sourceConfig.active = sourceConfig.rows.some(entry => (parseFloat(entry.pct) || 0) > 0);
        renderDashboard(state.activePct);
      });

      pctInput.addEventListener('blur', () => {
        const row = rows.find(t => t.id === id);
        if (!row) return;
        pctInput.value = String(Math.round(Number(row.pct) || 0));
      });

      stepBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const row = rows.find(t => t.id === id);
          if (!row) return;
          const step = parseInt(btn.dataset.step || '0', 10);
          const next = Math.max(0, Math.min(100, Math.round((Number(row.pct) || 0) + step)));
          row.pct = next;
          sourceConfig.active = sourceConfig.rows.some(entry => (parseFloat(entry.pct) || 0) > 0);
          renderDashboard(state.activePct);
        });
      });

      presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const row = rows.find(t => t.id === id);
          if (!row) return;
          const preset = parseInt(btn.dataset.preset || '0', 10);
          row.pct = Math.max(0, Math.min(100, preset));
          sourceConfig.active = sourceConfig.rows.some(entry => (parseFloat(entry.pct) || 0) > 0);
          renderDashboard(state.activePct);
        });
      });

      removeBtn.addEventListener('click', () => {
        sourceConfig.rows = rows.filter(t => t.id !== id);
        sourceConfig.active = sourceConfig.rows.some(entry => (parseFloat(entry.pct) || 0) > 0);
        renderDashboard(state.activePct);
      });
    });
  });
}

function renderSubstitutionSimulator(modelBreakdown, groupSpend, totalSpend) {
  const usedModels = modelBreakdown.map(([name, amount, quantity, effectiveAic, tokenMix]) => ({
    name,
    key: getModelKey(name),
    amount,
    quantity,
    effectiveAic,
    tokenMix,
    tokenRatio: tokenRatioFromMix(tokenMix),
    pricing: findPricingByUsageModel(name),
  }));

  const rateSamples = usedModels
    .map(model => comparableRateForModel(model))
    .filter(rate => Number.isFinite(rate) && rate > 0);
  const minRate = rateSamples.length ? Math.min(...rateSamples) : null;
  const maxRate = rateSamples.length ? Math.max(...rateSamples) : null;

  for (const model of usedModels) {
    const sourceRate = comparableRateForModel(model);
    model.sourceRate = sourceRate;
    if (Number.isFinite(sourceRate) && Number.isFinite(minRate) && Number.isFinite(maxRate) && maxRate > minRate) {
      model.rateLevel = (sourceRate - minRate) / (maxRate - minRate);
    } else if (Number.isFinite(sourceRate)) {
      model.rateLevel = 1;
    } else {
      model.rateLevel = 0;
    }
  }

  if (!usedModels.length) {
    subModelList.innerHTML = '';
    subResults.innerHTML = '<div class="sub-savings-panel is-empty"><div class="empty-state">Load data to run a substitution scenario.</div></div>';
    return;
  }

  renderCategoryLegend();
  ensureSubstitutionDefaults(usedModels);
  subModelList.innerHTML = usedModels.map(buildSourceModelCard).join('');
  wireSourceModelCardEvents(usedModels);

  let totalDelta = 0;
  let savingsTotal = 0;
  let addedCostTotal = 0;
  let configuredModels = 0;
  let invalidModels = 0;
  let unresolvedModels = 0;

  for (const source of usedModels) {
    const sourceConfig = getSourceConfig(source.key);
    const projection = computeSourceProjection(source, sourceConfig);
    if (!projection.configured) continue;
    configuredModels += 1;
    if (projection.invalid) {
      invalidModels += 1;
      continue;
    }
    if (projection.unresolved) {
      unresolvedModels += 1;
      continue;
    }
    totalDelta += projection.delta;
    if (projection.delta < 0) savingsTotal += Math.abs(projection.delta);
    if (projection.delta > 0) addedCostTotal += projection.delta;
  }

  if (configuredModels === 0) {
    subResults.innerHTML = `
      <div class="sub-savings-panel is-empty">
        <div class="sub-savings-header">
          <span class="sub-savings-eyebrow">Live savings tracker</span>
          <h3>Total savings from model changes</h3>
        </div>
        <div class="empty-state">Add replacements to any model above to estimate bill impact.</div>
      </div>
    `;
    return;
  }

  if (invalidModels > 0) {
    subResults.innerHTML = `
      <div class="sub-savings-panel is-empty">
        <div class="sub-savings-header">
          <span class="sub-savings-eyebrow">Live savings tracker</span>
          <h3>Total savings from model changes</h3>
        </div>
        <div class="empty-state">${invalidModels} model mix${invalidModels === 1 ? '' : 'es'} exceed 100% shifted usage. Fix those rows to continue.</div>
      </div>
    `;
    return;
  }

  if (unresolvedModels > 0) {
    subResults.innerHTML = `
      <div class="sub-savings-panel is-empty">
        <div class="sub-savings-header">
          <span class="sub-savings-eyebrow">Live savings tracker</span>
          <h3>Total savings from model changes</h3>
        </div>
        <div class="empty-state">${unresolvedModels} model configuration${unresolvedModels === 1 ? '' : 's'} could not be priced due to missing model rate matches.</div>
      </div>
    `;
    return;
  }

  const projectedGroupSpend = groupSpend + totalDelta;
  const projectedTotalSpend = totalSpend + totalDelta;
  const delta = totalDelta;
  const savings = savingsTotal;
  const increase = addedCostTotal;
  const deltaClass = delta > 0 ? 'pos' : (delta < 0 ? 'neg' : '');
  const direction = delta < 0 ? 'Estimated savings' : (delta > 0 ? 'Estimated increase' : 'No change in cost');
  const cue = deltaCue(delta);
  const savingsStateClass = delta < 0 ? 'saving' : (delta > 0 ? 'increase' : 'flat');
  const savingsHeadline = delta < 0
    ? `Saving ${formatDollars(savings)}`
    : (delta > 0 ? `Spending ${formatDollars(increase)} more` : 'No savings created yet');
  const savingsDetail = delta < 0
    ? `Your current overrides are reducing projected spend by ${formatDollars(savings)}.`
    : (delta > 0
      ? `Your current overrides increase projected spend by ${formatDollars(increase)}.`
      : 'Adjust override percentages to start generating savings or model upgrades.');

  subResults.innerHTML = `
    <div class="sub-savings-panel ${savingsStateClass}">
      <div class="sub-savings-header">
      <span class="sub-savings-eyebrow">All model rollup</span>
      <h3>Total savings across all model changes</h3>
      </div>
      <div class="sub-savings-body">
        <div class="sub-savings-total-wrap">
          <span class="sub-savings-icon">${cue.icon}</span>
          <div class="sub-savings-copy">
            <div class="sub-savings-total">${savingsHeadline}</div>
            <div class="sub-savings-detail">${savingsDetail}</div>
          </div>
        </div>
        <div class="sub-savings-metrics">
          <div class="sub-savings-metric">
            <span class="sub-savings-metric-label">Savings created</span>
            <span class="sub-savings-metric-value neg">${formatDollars(savings)}</span>
          </div>
          <div class="sub-savings-metric">
            <span class="sub-savings-metric-label">Added cost</span>
            <span class="sub-savings-metric-value pos">${formatDollars(increase)}</span>
          </div>
          <div class="sub-savings-metric">
            <span class="sub-savings-metric-label">Net effect</span>
            <span class="sub-savings-metric-value ${deltaClass}">${delta >= 0 ? '+' : ''}${formatDollars(delta)}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="sub-results-grid">
      <div class="sub-stat">
        <span class="sub-stat-label">Models Overridden</span>
        <span class="sub-stat-value">${configuredModels.toLocaleString()}</span>
      </div>
      <div class="sub-stat">
        <span class="sub-stat-label">Net Cost Direction</span>
        <span class="sub-stat-value ${cue.cls}">${cue.icon} ${cue.label}</span>
      </div>
      <div class="sub-stat">
        <span class="sub-stat-label">Model Swap Delta</span>
        <span class="sub-stat-value ${deltaClass}">${delta >= 0 ? '+' : ''}${formatDollars(delta)}</span>
      </div>
      <div class="sub-stat">
        <span class="sub-stat-label">Projected Total Bill</span>
        <span class="sub-stat-value">${formatDollars(projectedTotalSpend)}</span>
      </div>
    </div>
    <p class="sub-results-note">
      ${direction}: <strong>${formatDollars(Math.abs(delta))}</strong>. Selected-group spend moves from
      <strong>${formatDollars(groupSpend)}</strong> to <strong>${formatDollars(projectedGroupSpend)}</strong>.
      Unshifted usage remains on each original model automatically.
    </p>
  `;
}
