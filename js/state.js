/* ═══════════════════════════════════════════════════════════════════
   Shared application state — loaded first as a plain <script>
═══════════════════════════════════════════════════════════════════ */
const state = {
  parsedRows:   [],
  userSpendMap: new Map(),
  totalSpend:   0,
  totalUsers:   0,
  dateMin:      '',
  dateMax:      '',
  activePct:    1,

  budgetTierCount:  1,
  budgetTierPcts:   [25],
  budgetGrowthPcts: [0, 0],

  bizSeats:          0,
  entSeats:          0,
  discountPct:       0,
  promoEnabled:      true,
  poolChartInstance: null,
};

const RATES = {
  standard: { biz: 19, ent: 39 },
  promo:    { biz: 30, ent: 70 },
};

const TIER_COLORS = ['#2563eb', '#f97316', '#22c55e', '#ec4899', '#8b5cf6'];

function activeRates() {
  return state.promoEnabled ? RATES.promo : RATES.standard;
}
