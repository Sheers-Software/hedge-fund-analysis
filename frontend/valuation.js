/* ─── valuation.js ─────────────────────────────────────────────────────────────
   ApexAlpha — Valuation Calculator
   Handles: stock search, data auto-fill, reactive calculations, save/load
   Three scenarios: Bull | Base | Bear, each with 5 projected years.

   Rows per scenario:
     YEAR (static) | REVENUE (auto) | REV GROWTH (input) |
     NET INCOME (auto) | NET INC. GROWTH (input) |
     NET INC. MARGINS (auto) | EPS (auto) |
     PE LOW EST (input) | PE HIGH EST (input) |
     SHARE PRICE LOW (auto, gold) | SHARE PRICE HIGH (auto, gold) |
     CAGR LOW (auto, gold, from year 3) | CAGR HIGH (auto, gold, from year 3)
────────────────────────────────────────────────────────────────────────────── */

'use strict';

const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
const API_BASE = (window.location.protocol === 'file:' || (isLocalhost && window.location.port !== '8001')) 
  ? 'http://127.0.0.1:8001' 
  : window.location.origin;

// ── Year Range (current year + 4 more) ────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS        = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i);
const NUM_YEARS    = YEARS.length;   // 5

// ── Scenario identifiers & defaults ───────────────────────────────────────────
const SCENARIOS = ['bull', 'base', 'bear'];

const SCENARIO_DEFAULTS = {
  bull: {
    revGrowth: [20, 20, 20, 20],   // 4 values (year[1]–year[4])
    niGrowth:  [30, 30, 30, 30],
    peLow:     [35, 35, 35, 35, 35],   // 5 values (one per year column)
    peHigh:    [40, 40, 40, 40, 40],
  },
  base: {
    revGrowth: [10, 10, 10, 10],
    niGrowth:  [20, 20, 20, 20],
    peLow:     [29, 29, 29, 29, 29],
    peHigh:    [34, 34, 34, 34, 34],
  },
  bear: {
    revGrowth: [5,  5,  5,  5],
    niGrowth:  [5,  5,  5,  5],
    peLow:     [20, 20, 20, 20, 20],
    peHigh:    [25, 25, 25, 25, 25],
  },
};

// ── App State ──────────────────────────────────────────────────────────────────
const state = {
  ticker:            null,
  currentPrice:      null,   // live price (for CAGR base)
  sharesOutstanding: null,   // raw integer shares
  baseRevenue:       null,   // TTM revenue ($) from API
  baseNetIncome:     null,   // TTM net income ($) from API
  marketCapFormatted: null,
  sharesFormatted:   null,
  scenarios: { bull: null, base: null, bear: null },
};

// Shared seed values for Year 0 — editable by user, flows into all scenarios
const seedState = { revenue: 0, netIncome: 0 };

// ── localStorage persistence ───────────────────────────────────────────────────
const CACHE_PREFIX = 'apexalpha_val_';

function saveScenario(sc) {
  if (!state.ticker) return;
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${state.ticker}_${sc}`,
      JSON.stringify({ ts: Date.now(), ticker: state.ticker, sc, data: state.scenarios[sc] })
    );
    showToast(`${sc.toUpperCase()} case saved!`, 'success');
  } catch (e) {
    showToast('Save failed — localStorage full?', 'error');
  }
}

function loadScenario(sc) {
  if (!state.ticker) return;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${state.ticker}_${sc}`);
    if (!raw) { showToast(`No saved ${sc.toUpperCase()} case for ${state.ticker}`, 'error'); return; }
    const entry = JSON.parse(raw);
    if (entry.ticker !== state.ticker) { showToast('Saved data is for a different ticker', 'error'); return; }
    state.scenarios[sc] = entry.data;
    renderScenarioTable(sc);
    showToast(`${sc.toUpperCase()} case loaded!`, 'info');
  } catch (e) {
    showToast('Load failed', 'error');
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const tc    = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.textContent = message;
  tc.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Number formatting ──────────────────────────────────────────────────────────
const fmt$ = n => (n == null || isNaN(n)) ? '—'
  : '$' + Math.round(n).toLocaleString('en-US');

const fmtShort = n => {
  if (n == null || isNaN(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US')}`;
};

const fmtPct  = n => (n == null || isNaN(n)) ? '—' : Math.round(n) + '%';
// fmtEPS: show '—' only for null/undefined/NaN, NOT for zero
const fmtEPS  = n => (n == null || isNaN(n)) ? '—' : '$' + Number(n).toFixed(2);

function fmtCagr(price, years) {
  if (!state.currentPrice || state.currentPrice <= 0 || !price || price <= 0 || years <= 0) return '—';
  const cagr = (Math.pow(price / state.currentPrice, 1 / years) - 1) * 100;
  return Math.round(cagr) + '%';
}

function parseSharesStr(str) {
  if (!str || str === 'N/A') return null;
  const cleaned = str.replace(/[$,\s]/g, '');
  const m = cleaned.match(/^([\d.]+)([KMBT]?)$/i);
  if (!m) return null;
  const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[m[2].toUpperCase()] || 1;
  return parseFloat(m[1]) * mult;
}

// ── Core projection calculation ────────────────────────────────────────────────
function calcProjections(sc) {
  const s = state.scenarios[sc];
  if (!s) return null;

  const rev  = new Array(NUM_YEARS);
  const ni   = new Array(NUM_YEARS);
  const mgn  = new Array(NUM_YEARS);
  const eps  = new Array(NUM_YEARS);
  const spLo = new Array(NUM_YEARS);
  const spHi = new Array(NUM_YEARS);
  const cgLo = new Array(NUM_YEARS);
  const cgHi = new Array(NUM_YEARS);

  // Year 0 is the user-editable seed (shared across all scenarios)
  rev[0] = seedState.revenue   || 0;
  ni[0]  = seedState.netIncome || 0;

  // Project forward using growth rates
  for (let i = 1; i < NUM_YEARS; i++) {
    const rg = parseFloat(s.revGrowth[i - 1]) || 0;
    const ng = parseFloat(s.niGrowth[i  - 1]) || 0;
    rev[i] = rev[i - 1] * (1 + rg / 100);
    ni[i]  = ni[i  - 1] * (1 + ng / 100);
  }

  const shares = state.sharesOutstanding;

  for (let i = 0; i < NUM_YEARS; i++) {
    mgn[i]  = rev[i] > 0 ? (ni[i] / rev[i]) * 100 : 0;
    eps[i]  = shares && shares > 0 ? ni[i] / shares : 0;
    const pl = parseFloat(s.peLow[i])  || 0;
    const ph = parseFloat(s.peHigh[i]) || 0;
    spLo[i] = eps[i] * pl;
    spHi[i] = eps[i] * ph;
    // CAGR is meaningful only from index >= 2 (i.e. 2+ years after the seed year).
    // yrs = i because index 0 is the seed/base year, so year[i] is i years away.
    const yrs = i;
    cgLo[i] = i >= 2 ? fmtCagr(spLo[i], yrs) : '—';
    cgHi[i] = i >= 2 ? fmtCagr(spHi[i], yrs) : '—';
  }

  return { rev, ni, mgn, eps, spLo, spHi, cgLo, cgHi };
}

// ── Table rendering ────────────────────────────────────────────────────────────
function renderScenarioTable(sc) {
  const table = document.getElementById(`table-${sc}`);
  if (!table) return;

  const s    = state.scenarios[sc];
  const proj = calcProjections(sc);
  if (!s || !proj) return;

  const { rev, ni, mgn, eps, spLo, spHi, cgLo, cgHi } = proj;

  // --- cell helpers ---
  const ac = (content, cls = '') =>
    `<td class="val-td val-td-auto ${cls}">${content}</td>`;

  const ic = (value, key, yi, extraCls = '') =>
    `<td class="val-td val-td-input ${extraCls}">
       <input class="val-input" type="number" step="1"
         value="${value}"
         data-sc="${sc}" data-key="${key}" data-yi="${yi}">
     </td>`;

  // Seed cell — shared across scenarios, shown in Year 0 column only
  const seedCell = (value, key) =>
    `<td class="val-td val-td-input val-td-seed">
       <input class="val-input val-input-seed" type="number" step="1000000"
         value="${value}"
         data-sc="seed" data-key="${key}" data-yi="0"
         title="Edit base year (TTM) figure — shared across all scenarios">
     </td>`;

  const sp = () => `<tr class="val-spacer-row"><td colspan="${NUM_YEARS + 1}"></td></tr>`;

  // --- rows ---
  const html = [
    // YEAR header row
    `<tr class="val-row val-row-label">
       <td class="val-td val-row-title">YEAR</td>
       ${YEARS.map(y => `<td class="val-td val-td-year">${y}</td>`).join('')}
     </tr>`,

    // REVENUE: Year 0 = editable seed, Years 1-4 = auto-projected
    `<tr class="val-row" data-row="rev">
       <td class="val-td val-row-title">REVENUE</td>
       ${seedCell(Math.round(seedState.revenue), 'revenue')}
       ${rev.slice(1).map(v => ac(fmtShort(v))).join('')}
     </tr>`,

    // REV GROWTH: Year 0 blank, Years 1-4 = user inputs
    `<tr class="val-row val-row-input-row">
       <td class="val-td val-row-title val-row-title-sub">
         REV GROWTH <span class="val-qmark" title="Annual revenue growth rate (%) for each year">?</span>
       </td>
       <td class="val-td val-td-auto val-td-blank">—</td>
       ${s.revGrowth.map((v, i) => ic(v, 'revGrowth', i, 'pct-input')).join('')}
     </tr>`,

    sp(),

    // NET INCOME: Year 0 = editable seed, Years 1-4 = auto-projected
    `<tr class="val-row" data-row="ni">
       <td class="val-td val-row-title">NET INCOME</td>
       ${seedCell(Math.round(seedState.netIncome), 'netIncome')}
       ${ni.slice(1).map(v => ac(fmtShort(v))).join('')}
     </tr>`,

    // NET INC. GROWTH: Year 0 blank, Years 1-4 = user inputs
    `<tr class="val-row val-row-input-row">
       <td class="val-td val-row-title val-row-title-sub">
         NET INC. GROWTH <span class="val-qmark" title="Annual net income growth rate (%) for each year">?</span>
       </td>
       <td class="val-td val-td-auto val-td-blank">—</td>
       ${s.niGrowth.map((v, i) => ic(v, 'niGrowth', i, 'pct-input')).join('')}
     </tr>`,

    sp(),

    // NET INC. MARGINS (auto = NI / Rev)
    `<tr class="val-row" data-row="mgn">
       <td class="val-td val-row-title val-row-title-sub">NET INC. MARGINS</td>
       ${mgn.map(v => ac(fmtPct(v))).join('')}
     </tr>`,

    // EPS (auto = NI / shares)
    `<tr class="val-row" data-row="eps">
       <td class="val-td val-row-title">EPS</td>
       ${eps.map(v => ac(fmtEPS(v))).join('')}
     </tr>`,

    sp(),

    // PE LOW EST (user input, one per year column)
    `<tr class="val-row val-row-input-row">
       <td class="val-td val-row-title val-row-title-sub">
         PE LOW EST <span class="val-qmark" title="Low P/E multiple estimate for each projected year">?</span>
       </td>
       ${s.peLow.map((v, i) => ic(v, 'peLow', i)).join('')}
     </tr>`,

    // PE HIGH EST (user input, one per year column)
    `<tr class="val-row val-row-input-row">
       <td class="val-td val-row-title val-row-title-sub">
         PE HIGH EST <span class="val-qmark" title="High P/E multiple estimate for each projected year">?</span>
       </td>
       ${s.peHigh.map((v, i) => ic(v, 'peHigh', i)).join('')}
     </tr>`,

    sp(),

    // SHARE PRICE LOW (auto = EPS × PE Low, gold)
    `<tr class="val-row val-row-price" data-row="spLo">
       <td class="val-td val-row-title">SHARE PRICE LOW</td>
       ${spLo.map(v => ac(fmt$(v), 'val-td-gold')).join('')}
     </tr>`,

    // SHARE PRICE HIGH (auto = EPS × PE High, gold)
    `<tr class="val-row val-row-price" data-row="spHi">
       <td class="val-td val-row-title">SHARE PRICE HIGH</td>
       ${spHi.map(v => ac(fmt$(v), 'val-td-gold')).join('')}
     </tr>`,

    sp(),

    // CAGR LOW (gold from year 3 onward, blank for years 1–2)
    `<tr class="val-row val-row-cagr" data-row="cgLo">
       <td class="val-td val-row-title val-row-title-sub">
         CAGR LOW <span class="val-qmark" title="CAGR from current price to low share price target">?</span>
       </td>
       ${cgLo.map((v, i) => ac(v, i >= 2 ? 'val-td-cagr' : 'val-td-blank')).join('')}
     </tr>`,

    // CAGR HIGH (gold from year 3 onward)
    `<tr class="val-row val-row-cagr" data-row="cgHi">
       <td class="val-td val-row-title val-row-title-sub">
         CAGR HIGH <span class="val-qmark" title="CAGR from current price to high share price target">?</span>
       </td>
       ${cgHi.map((v, i) => ac(v, i >= 2 ? 'val-td-cagr' : 'val-td-blank')).join('')}
     </tr>`,
  ].join('');

  table.innerHTML = html;

  // Attach reactive listeners for scenario inputs
  table.querySelectorAll('.val-input:not(.val-input-seed)').forEach(inp => {
    inp.addEventListener('input',  onInput);
    inp.addEventListener('focus',  () => inp.select());
  });

  // Attach seed listeners (update ALL tables when seed changes)
  table.querySelectorAll('.val-input-seed').forEach(inp => {
    inp.addEventListener('input',  onSeedInput);
    inp.addEventListener('focus',  () => inp.select());
  });
}

// ── Reactive input handler (scenario-specific inputs) ─────────────────────────
function onInput(e) {
  const { sc, key, yi } = e.target.dataset;
  const idx = parseInt(yi, 10);
  const raw = e.target.value;
  state.scenarios[sc][key][idx] = raw === '' ? 0 : (parseFloat(raw) || 0);
  patchAutoRows(sc);
}

// ── Seed input handler (Year 0 Revenue / Net Income — shared across scenarios) ─
function onSeedInput(e) {
  const { key } = e.target.dataset;
  const val = parseFloat(e.target.value) || 0;
  if (key === 'revenue')   seedState.revenue   = val;
  if (key === 'netIncome') seedState.netIncome = val;
  // Patch all scenario tables
  SCENARIOS.forEach(sc => patchAutoRows(sc));
}

// ── Patch only auto-calculated cells (leaves inputs untouched) ─────────────────
function patchAutoRows(sc) {
  const table = document.getElementById(`table-${sc}`);
  if (!table) return;
  const proj = calcProjections(sc);
  if (!proj) return;
  const { rev, ni, mgn, eps, spLo, spHi, cgLo, cgHi } = proj;

  table.querySelectorAll('tr[data-row]').forEach(tr => {
    const key   = tr.dataset.row;
    const cells = tr.querySelectorAll('.val-td-auto');
    cells.forEach((td, i) => {
      // For rev/ni rows, index 0 is a seed input — auto cells start from index 1
      const dataIdx = (key === 'rev' || key === 'ni') ? i + 1 : i;
      const vals    = { rev, ni, mgn, eps, spLo, spHi, cgLo, cgHi }[key];
      if (!vals) return;
      switch (key) {
        case 'rev':   td.textContent = fmtShort(vals[dataIdx]); break;
        case 'ni':    td.textContent = fmtShort(vals[dataIdx]); break;
        case 'mgn':   td.textContent = fmtPct(vals[i]);    break;
        case 'eps':   td.textContent = fmtEPS(vals[i]);    break;
        case 'spLo':
          td.textContent = fmt$(spLo[i]);
          td.className   = 'val-td val-td-auto val-td-gold';
          break;
        case 'spHi':
          td.textContent = fmt$(spHi[i]);
          td.className   = 'val-td val-td-auto val-td-gold';
          break;
        case 'cgLo':
          td.textContent = cgLo[i];
          td.className   = `val-td val-td-auto ${i >= 2 ? 'val-td-cagr' : 'val-td-blank'}`;
          break;
        case 'cgHi':
          td.textContent = cgHi[i];
          td.className   = `val-td val-td-auto ${i >= 2 ? 'val-td-cagr' : 'val-td-blank'}`;
          break;
      }
    });
  });
}

// ── Initialize scenario state with defaults ────────────────────────────────────
function initScenarios() {
  SCENARIOS.forEach(sc => {
    const def = SCENARIO_DEFAULTS[sc];
    state.scenarios[sc] = {
      revGrowth: [...def.revGrowth],
      niGrowth:  [...def.niGrowth],
      peLow:     [...def.peLow],
      peHigh:    [...def.peHigh],
    };
  });
}

// ── Stock header rendering ─────────────────────────────────────────────────────
function renderStockHeader(data) {
  const q    = data.quote       || {};
  const fin  = data.financials  || {};
  const price = parseFloat(q.current || fin.current_price || 0);
  const chPct = q.change_pct;

  state.currentPrice      = price;
  state.marketCapFormatted = fin.market_cap_formatted || 'N/A';

  // Prefer raw integer from backend; fall back to parsing the formatted string
  const sharesRaw = data.shares_outstanding_raw;
  if (sharesRaw && sharesRaw > 0) {
    state.sharesOutstanding = sharesRaw;
    state.sharesFormatted   = Math.round(sharesRaw).toLocaleString('en-US');
  } else {
    state.sharesFormatted   = fin.shares_outstanding || 'N/A';
    state.sharesOutstanding = parseSharesStr(fin.shares_outstanding);
  }

  // Fill header elements
  document.getElementById('val-ticker-badge').textContent  = data.ticker;
  document.getElementById('val-company-name').textContent  = data.name || data.ticker;
  
  const priceInp = document.getElementById('sh-price-input');
  if (priceInp) priceInp.value = price ? price.toFixed(2) : '0.00';
  
  document.getElementById('sh-mktcap').textContent = state.marketCapFormatted;
  
  const sharesInp = document.getElementById('sh-shares-input');
  if (sharesInp) sharesInp.value = state.sharesOutstanding ? Math.round(state.sharesOutstanding) : '0';
  
  document.getElementById('val-live-price').textContent    = price ? `$${price.toFixed(2)}` : '—';

  const chEl = document.getElementById('val-price-change');
  if (chPct != null) {
    const sign = chPct >= 0 ? '+' : '';
    chEl.textContent = `${sign}${parseFloat(chPct).toFixed(2)}%`;
    chEl.className   = `val-price-change ${chPct >= 0 ? 'positive' : 'negative'}`;
  }

  const logoEl = document.getElementById('val-company-logo');
  if (data.logo) {
    const safeTicker = (data.ticker || '?')[0];
    logoEl.innerHTML = `<img src="${data.logo}" alt="${data.ticker}"
      onerror="this.parentElement.textContent='${safeTicker}'">`;
  } else {
    logoEl.textContent = (data.ticker || '?')[0];
  }
}

// ── Load stock from backend ────────────────────────────────────────────────────
async function loadStock(ticker) {
  ticker = ticker.toUpperCase().trim();
  if (!ticker) return;
  state.ticker = ticker;

  setLoadingUI(ticker);

  try {
    const res  = await fetch(`${API_BASE}/api/valuation-quote/${encodeURIComponent(ticker)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.error && !data.name) {
      showToast(`Could not find data for "${ticker}"`, 'error');
      showEmpty();
      return;
    }

    // ── Shares: resolve first ──────────────────────────────────────────────────
    const sharesRaw = data.shares_outstanding_raw;
    if (sharesRaw && sharesRaw > 0) {
      state.sharesOutstanding = sharesRaw;
    } else {
      state.sharesOutstanding = parseSharesStr(data.financials?.shares_outstanding);
    }

    // ── Net Income seed ────────────────────────────────────────────────────────
    state.baseNetIncome = data.financials?.net_income || 0;

    // ── Revenue seed ───────────────────────────────────────────────────────────
    state.baseRevenue = data.financials?.revenue_ttm || 0;

    // Update shared seed state
    seedState.revenue   = state.baseRevenue;
    seedState.netIncome = state.baseNetIncome;

    showCalculator();
    renderStockHeader(data);
    initScenarios();
    SCENARIOS.forEach(sc => renderScenarioTable(sc));

    document.title      = `${ticker} — Valuation · ApexAlpha`;
    searchInput.value   = ticker;

  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    showEmpty();
  }
}

function setLoadingUI(ticker) {
  showCalculator();
  document.getElementById('val-ticker-badge').textContent  = ticker;
  document.getElementById('val-company-name').textContent  = 'Loading…';
  
  const priceInp = document.getElementById('sh-price-input');
  if (priceInp) priceInp.value = '';
  
  document.getElementById('sh-mktcap').textContent  = '…';
  
  const sharesInp = document.getElementById('sh-shares-input');
  if (sharesInp) sharesInp.value = '';
  
  document.getElementById('val-live-price').textContent    = '…';
  document.getElementById('val-price-change').textContent  = '';
  document.getElementById('val-company-logo').innerHTML    = '';
  
  SCENARIOS.forEach(sc => {
    const t = document.getElementById(`table-${sc}`);
    if (t) t.innerHTML =
      `<tr><td colspan="${NUM_YEARS + 1}" style="text-align:center;padding:28px;color:var(--t3);font-size:.8rem">
         <span style="opacity:.5">Fetching data…</span>
       </td></tr>`;
  });
}

function showEmpty()      { document.getElementById('val-empty').style.display = 'flex'; document.getElementById('val-calculator').style.display = 'none'; }
function showCalculator() { document.getElementById('val-empty').style.display = 'none'; document.getElementById('val-calculator').style.display = 'block'; }

// ── Search UI ──────────────────────────────────────────────────────────────────
const searchInput    = document.getElementById('val-search-input');
const searchBtn      = document.getElementById('val-search-btn');
const searchDropdown = document.getElementById('val-search-dropdown');
let   searchTimer    = null;

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (!q) { hideDropdown(); return; }
  searchTimer = setTimeout(() => doSearch(q), 280);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter')  { const q = searchInput.value.trim(); if (q) { loadStock(q); hideDropdown(); } }
  if (e.key === 'Escape') hideDropdown();
});

searchBtn.addEventListener('click', () => {
  const q = searchInput.value.trim();
  if (q) { loadStock(q); hideDropdown(); }
});

document.addEventListener('click', e => {
  if (!e.target.closest('.val-nav-search')) hideDropdown();
});

async function doSearch(query) {
  try {
    const res  = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const results = data.results || [];
    if (!results.length) { hideDropdown(); return; }
    searchDropdown.innerHTML = results.map(r =>
      `<div class="search-result-item" onclick="selectResult('${r.symbol}')">
         <span class="result-symbol">${r.symbol}</span>
         <span class="result-name">${r.description}</span>
       </div>`
    ).join('');
    searchDropdown.classList.add('visible');
  } catch (_) {}
}

function hideDropdown() { searchDropdown.classList.remove('visible'); }

function selectResult(symbol) {
  searchInput.value = symbol;
  hideDropdown();
  loadStock(symbol);
}

// ── Header Input Listeners ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const priceInp = document.getElementById('sh-price-input');
  if (priceInp) {
    priceInp.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) {
        state.currentPrice = val;
        SCENARIOS.forEach(sc => patchAutoRows(sc));
      }
    });
  }

  const sharesInp = document.getElementById('sh-shares-input');
  if (sharesInp) {
    sharesInp.addEventListener('input', e => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 0) {
        state.sharesOutstanding = val;
        SCENARIOS.forEach(sc => patchAutoRows(sc));
      }
    });
  }
});

// ── Sample tickers ─────────────────────────────────────────────────────────────
document.querySelectorAll('.sample-ticker').forEach(el => {
  el.addEventListener('click', () => {
    searchInput.value = el.dataset.ticker;
    loadStock(el.dataset.ticker);
  });
});

// ── Save / Load buttons ────────────────────────────────────────────────────────
SCENARIOS.forEach(sc => {
  document.getElementById(`save-${sc}`)?.addEventListener('click', () => saveScenario(sc));
  document.getElementById(`load-${sc}`)?.addEventListener('click', () => loadScenario(sc));
});

// ── Init ───────────────────────────────────────────────────────────────────────
(async () => {
  // Support /valuation/AAPL
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let pathTicker = null;
  if (pathParts.length >= 2 && pathParts[0] === 'valuation') {
    pathTicker = pathParts[1];
  }

  // Support ?ticker=AAPL or ?t=AAPL in URL
  const params      = new URLSearchParams(window.location.search);
  const tickerParam = pathTicker || params.get('ticker') || params.get('t');
  if (tickerParam) {
    searchInput.value = tickerParam.toUpperCase();
    loadStock(tickerParam);
  }

  // Ping backend
  try {
    await fetch(`${API_BASE}/health`);
  } catch (_) {
    showToast('Backend not running. Start: cd backend && uvicorn main:app --reload', 'error', 8000);
  }
})();
