/* ─── app.js ────────────────────────────────────────────────────────────────
   Hedge Fund Analysis Engine — Frontend Logic
   Handles: search, SSE streaming, report rendering, settings, charts
────────────────────────────────────────────────────────────────────────────── */

const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
const API_BASE = (window.location.protocol === 'file:' || (isLocalhost && window.location.port !== '8001')) 
  ? 'http://127.0.0.1:8001' 
  : window.location.origin;

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  currentTicker: null,
  isGenerating: false,
  sseSource: null,
  sectionBuffers: {},
  pendingSnapshot: {},   // accumulates data during live generation
  workflow: 'hedge_fund',  // 'hedge_fund' | 'research_checklist'
};

// ── Report Cache (localStorage) ───────────────────────────────────────────────
const CACHE_PREFIX  = 'apexalpha_report_';
const CACHE_TTL_MS  = 24 * 60 * 60 * 1000;  // 24 hours
const CACHE_MAX     = 10;                    // max stored tickers
const CACHE_VERSION = 3;

function cacheKey(ticker) {
  const wfSuffix = state.workflow === 'research_checklist' ? '_rc' : '_hf';
  return CACHE_PREFIX + ticker.toUpperCase() + wfSuffix;
}

function cacheGet(ticker) {
  try {
    const raw = localStorage.getItem(cacheKey(ticker));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (entry.v !== CACHE_VERSION) { localStorage.removeItem(cacheKey(ticker)); return null; }
    if (Date.now() - entry.ts > CACHE_TTL_MS) { localStorage.removeItem(cacheKey(ticker)); return null; }
    return entry;
  } catch { return null; }
}

function cacheSave(ticker, snapshot) {
  try {
    // Evict oldest if over limit
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    if (keys.length >= CACHE_MAX) {
      const oldest = keys.map(k => ({ k, ts: JSON.parse(localStorage.getItem(k) || '{}').ts || 0 }))
                         .sort((a, b) => a.ts - b.ts)[0];
      if (oldest) localStorage.removeItem(oldest.k);
    }
    localStorage.setItem(cacheKey(ticker), JSON.stringify({
      v: CACHE_VERSION, ts: Date.now(), ticker: ticker.toUpperCase(), workflow: state.workflow, ...snapshot
    }));
    renderRecentTickers();
  } catch (e) { console.warn('Cache write failed:', e); }
}

function cacheList() {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } })
      .filter(Boolean)
      .filter(e => Date.now() - e.ts <= CACHE_TTL_MS)
      .sort((a, b) => b.ts - a.ts);
  } catch { return []; }
}

function renderRecentTickers() {
  const strip = document.getElementById('recent-tickers-strip');
  if (!strip) return;
  const entries = cacheList();
  if (!entries.length) { strip.style.display = 'none'; return; }
  strip.style.display = 'block';
  strip.innerHTML = `
    <p class="welcome-label">Recently researched</p>
    <div class="sample-tickers">
      ${entries.map(e => `
        <div class="sample-ticker cached-ticker" data-ticker="${e.ticker}" title="Cached ${new Date(e.ts).toLocaleDateString()}">
          ${e.ticker}
          <span class="cached-dot"></span>
        </div>`).join('')}
    </div>`;
  strip.querySelectorAll('.cached-ticker').forEach(el => {
    el.addEventListener('click', () => {
      searchInput.value = el.dataset.ticker;
      startReport(el.dataset.ticker);
    });
  });
}

// ── Workflow Mode ─────────────────────────────────────────────────────────────
function setWorkflow(wf) {
  state.workflow = wf;
  // Update mode cards
  const hfCard = document.getElementById('mode-hf');
  const rcCard = document.getElementById('mode-rc');
  if (hfCard) hfCard.classList.toggle('active', wf === 'hedge_fund');
  if (rcCard) rcCard.classList.toggle('active', wf === 'research_checklist');
  // Update navbar badge
  const badge = document.getElementById('mode-badge');
  if (badge) {
    badge.textContent = wf === 'research_checklist' ? 'RC MODE' : 'HF MODE';
    badge.classList.toggle('rc', wf === 'research_checklist');
  }
  // Update recent tickers (they are workflow-specific now)
  renderRecentTickers();
}

function scrollToModeSelector() {
  const welcomeState = document.getElementById('welcome-state');
  if (welcomeState && welcomeState.style.display !== 'none') {
    const modeSelector = document.getElementById('mode-selector');
    if (modeSelector) modeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // If we're on a report page, scroll to top first
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ── DOM Refs ──────────────────────────────────────────────────────────────────
const searchInput    = document.getElementById('search-input');
const searchBtn      = document.getElementById('search-btn');
const searchDropdown = document.getElementById('search-dropdown');
const rightPanel     = document.getElementById('right-panel');
const leftPanel      = document.getElementById('left-panel');
const settingsBtn    = document.getElementById('settings-btn');
const modalOverlay   = document.getElementById('modal-overlay');
const toastContainer = document.getElementById('toast-container');
const sidebarToggle  = document.getElementById('sidebar-toggle');
const sidebarClose   = document.getElementById('sidebar-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// ── Sidebar Toggle ────────────────────────────────────────────────────────────
function isMobile() { return window.innerWidth < 900; }

function openSidebar() {
  leftPanel.classList.add('mobile-open');
  sidebarOverlay.classList.add('open');
}
function closeSidebar() {
  leftPanel.classList.remove('mobile-open');
  sidebarOverlay.classList.remove('open');
}
function toggleSidebar() {
  if (isMobile()) {
    leftPanel.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
  } else {
    leftPanel.classList.toggle('collapsed');
  }
}
if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
if (sidebarClose)  sidebarClose.addEventListener('click', closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

// ── Toast Notifications ───────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Settings Modal ────────────────────────────────────────────────────────────
async function checkKeyStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/keys/status`);
    const data = await res.json();
    updateKeyIndicators(data);
  } catch (e) {
    console.warn('Backend not reachable for key status check');
  }
}

function updateKeyIndicators(status) {
  const geminiDot = document.getElementById('gemini-status-dot');
  const finnhubDot = document.getElementById('finnhub-status-dot');
  if (geminiDot) {
    geminiDot.className = `key-status-dot ${status.gemini_configured ? 'active' : 'inactive'}`;
  }
  if (finnhubDot) {
    finnhubDot.className = `key-status-dot ${status.finnhub_configured ? 'active' : 'inactive'}`;
  }
}

settingsBtn.addEventListener('click', () => { modalOverlay.classList.add('open'); });

// Close modal via X button
const modalCancelX = document.getElementById('modal-cancel-x');
if (modalCancelX) modalCancelX.addEventListener('click', () => modalOverlay.classList.remove('open'));

document.getElementById('modal-cancel').addEventListener('click', () => {
  modalOverlay.classList.remove('open');
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('open');
});

document.getElementById('modal-save').addEventListener('click', async () => {
  const geminiKey  = document.getElementById('gemini-key-input').value.trim();
  const finnhubKey = document.getElementById('finnhub-key-input').value.trim();

  if (!geminiKey) {
    showToast('Gemini API key is required to generate reports.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gemini_api_key: geminiKey, finnhub_api_key: finnhubKey }),
    });
    const data = await res.json();
    if (data.success) {
      updateKeyIndicators(data);
      modalOverlay.classList.remove('open');
      showToast('API keys saved successfully!', 'success');
    }
  } catch (e) {
    showToast('Could not connect to backend. Is the server running?', 'error');
  }
});

// ── Search ────────────────────────────────────────────────────────────────────
let searchDebounce = null;

searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  const q = searchInput.value.trim();
  if (!q) { hideDropdown(); return; }

  searchDebounce = setTimeout(() => fetchSearchResults(q), 300);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = searchInput.value.trim();
    if (q) startReport(q.toUpperCase());
    hideDropdown();
  }
  if (e.key === 'Escape') hideDropdown();
});

searchBtn.addEventListener('click', () => {
  const q = searchInput.value.trim();
  if (q) startReport(q.toUpperCase());
  hideDropdown();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) hideDropdown();
});

async function fetchSearchResults(query) {
  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    showDropdown(data.results || []);
  } catch (e) {
    // Backend might not be running yet
  }
}

function showDropdown(results) {
  if (!results.length) { hideDropdown(); return; }
  searchDropdown.innerHTML = results.map(r => `
    <div class="search-result-item" data-symbol="${r.symbol}" onclick="selectResult('${r.symbol}', '${r.description.replace(/'/g, "\\'")}')">
      <span class="result-symbol">${r.symbol}</span>
      <span class="result-name">${r.description}</span>
    </div>
  `).join('');
  searchDropdown.classList.add('visible');
}

function hideDropdown() {
  searchDropdown.classList.remove('visible');
}

function selectResult(symbol, name) {
  searchInput.value = symbol;
  hideDropdown();
  startReport(symbol);
}

// ── Sample ticker clicks ──────────────────────────────────────────────────────
document.querySelectorAll('.sample-ticker').forEach(el => {
  el.addEventListener('click', () => {
    const ticker = el.dataset.ticker;
    searchInput.value = ticker;
    startReport(ticker);
  });
});

// ── Report Generation ─────────────────────────────────────────────────────────
function startReport(ticker, forceRefresh = false) {
  if (state.isGenerating) {
    if (state.sseSource) state.sseSource.close();
    state.isGenerating = false;
  }

  ticker = ticker.toUpperCase().trim();
  state.currentTicker = ticker;
  state.sectionBuffers = {};
  state.pendingSnapshot = { sections: {}, guide: null, data: null };

  if (!forceRefresh) {
    const cached = cacheGet(ticker);
    if (cached) { renderFromCache(cached); return; }
  }

  renderLoadingState(ticker);
  connectSSE(ticker);
}

function connectSSE(ticker) {
  state.isGenerating = true;
  const url = `${API_BASE}/api/report/${encodeURIComponent(ticker)}?workflow=${state.workflow}`;
  const evtSource = new EventSource(url);
  state.sseSource = evtSource;

  evtSource.addEventListener('status', (e) => {
    const { message, step, total } = JSON.parse(e.data);
    updateProgress(message, step, total);
  });

  evtSource.addEventListener('data', (e) => {
    const d = JSON.parse(e.data);
    state.pendingSnapshot.data = d;
    state.pendingSnapshot.workflow = d.workflow || state.workflow;
    // Apply workflow class to sections container for theming
    const sectionsContainer = document.getElementById('sections-container');
    if (sectionsContainer && d.workflow === 'research_checklist') {
      sectionsContainer.dataset.workflow = 'research_checklist';
    }
    renderCompanyHeader(d);
    renderFinancialMetrics(d.financials);
    renderSparkline(d.price_history);
    renderNews(d.news);
  });

  evtSource.addEventListener('research_guide', (e) => {
    const guide = JSON.parse(e.data);
    state.pendingSnapshot.guide = guide;
    renderResearchGuide(guide, state.currentTicker);
  });

  evtSource.addEventListener('section_start', (e) => {
    const { key, title } = JSON.parse(e.data);
    state.sectionBuffers[key] = '';
    renderSectionStart(key, title);
  });

  evtSource.addEventListener('section_chunk', (e) => {
    const { key, text } = JSON.parse(e.data);
    state.sectionBuffers[key] = (state.sectionBuffers[key] || '') + text;
    updateSectionContent(key, state.sectionBuffers[key]);
  });

  evtSource.addEventListener('section_end', (e) => {
    const { key } = JSON.parse(e.data);
    finalizeSectionContent(key);
    state.pendingSnapshot.sections[key] = state.sectionBuffers[key] || '';
  });

  evtSource.addEventListener('complete', (e) => {
    state.isGenerating = false;
    evtSource.close();
    hideProgress();
    // Persist to cache
    const snap = state.pendingSnapshot;
    if (snap.data && Object.keys(snap.sections).length) {
      cacheSave(ticker, snap);
      showCacheBadge(ticker);
    }
    showToast(`Report for ${ticker} complete!`, 'success');
  });

  evtSource.addEventListener('error', (e) => {
    state.isGenerating = false;
    evtSource.close();
    try {
      const { message } = JSON.parse(e.data);
      showToast(message, 'error', 6000);
      hideProgress();
      if (message.includes('API key')) {
        setTimeout(() => modalOverlay.classList.add('open'), 500);
      }
    } catch (_) {
      showToast('Connection error. Is the backend running?', 'error');
      hideProgress();
    }
  });
}

// ── Render: Loading State ─────────────────────────────────────────────────────
function renderLoadingState(ticker) {
  // Left panel skeleton
  leftPanel.innerHTML = `
    <div class="sidebar-header">
      <span class="sidebar-title">Research Guide — ${ticker}</span>
      <button class="sidebar-close" onclick="document.getElementById('left-panel').classList.remove('mobile-open');document.getElementById('sidebar-overlay').classList.remove('open')">✕</button>
    </div>
    <div class="sidebar-body">
      ${Array(12).fill('<div class="skeleton skeleton-line"></div>').join('')}
    </div>
  `;

  // Right panel
  rightPanel.innerHTML = `
    <div id="company-header-placeholder"></div>
    <div id="metrics-grid-placeholder"></div>
    <div class="report-header-bar">
      <div>
        <div class="report-title-text">APEXALPHA — INSTITUTIONAL RESEARCH REPORT</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">Investment Report: ${ticker}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="report-badge ${state.workflow === 'research_checklist' ? 'rc' : ''}">${state.workflow === 'research_checklist' ? 'RC LIVE' : 'HF LIVE'}</div>
        <button class="export-btn" onclick="window.print()">⬇ Export PDF</button>
      </div>
    </div>
    <div id="progress-wrapper" class="progress-bar-wrapper">
      <div class="progress-label">
        <span id="progress-msg">Initializing...</span>
        <span id="progress-pct">0%</span>
      </div>
      <div class="progress-bar-track">
        <div id="progress-fill" class="progress-bar-fill"></div>
      </div>
    </div>
    <div id="news-strip-placeholder"></div>
    <div id="sections-container"></div>
  `;
}

function updateProgress(message, step, total) {
  const pct = Math.round((step / total) * 100);
  const msgEl = document.getElementById('progress-msg');
  const pctEl = document.getElementById('progress-pct');
  const fillEl = document.getElementById('progress-fill');
  if (msgEl) msgEl.textContent = message;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;
}

function hideProgress() {
  const wrapper = document.getElementById('progress-wrapper');
  if (wrapper) {
    wrapper.style.opacity = '0';
    setTimeout(() => wrapper && wrapper.remove(), 400);
  }
}

// ── Render: Company Header ────────────────────────────────────────────────────
function renderCompanyHeader(d) {
  const quote = d.quote || {};
  const changePct = quote.change_pct;
  const changeSign = changePct >= 0 ? '+' : '';
  const changeClass = changePct >= 0 ? 'positive' : 'negative';
  const price = quote.current ? `$${parseFloat(quote.current).toFixed(2)}` : 'N/A';
  const logoHtml = d.logo
    ? `<img src="${d.logo}" alt="${d.name}" onerror="this.parentElement.textContent='${(d.ticker||'?')[0]}'">`
    : (d.ticker || '?')[0];

  const headerEl = document.getElementById('company-header-placeholder');
  if (!headerEl) return;

  headerEl.innerHTML = `
    <div class="company-header">
      <div class="company-logo">${logoHtml}</div>
      <div class="company-meta">
        <div class="company-name-row">
          <span class="company-name">${d.name || d.ticker}</span>
          <span class="company-ticker">${d.ticker}</span>
        </div>
        <div class="company-sector">${d.sector || ''} ${d.industry ? '· ' + d.industry : ''}</div>
        <div class="company-stats">
          <span>Mkt Cap: <b>${d.financials?.market_cap_formatted || 'N/A'}</b></span>
          <span>52W: <b>$${d.financials?.['52w_low']||'?'} – $${d.financials?.['52w_high']||'?'}</b></span>
        </div>
      </div>
      <div class="price-block">
        <div class="price-current">${price}</div>
        <div class="price-change ${changeClass}">${changePct != null ? changeSign + parseFloat(changePct).toFixed(2) + '%' : 'N/A'}</div>
        <div class="sparkline-wrap"><canvas id="sparkline-canvas" width="140" height="46"></canvas></div>
      </div>
    </div>
  `;
}

// ── Render: Sparkline ─────────────────────────────────────────────────────────
function renderSparkline(history) {
  const canvas = document.getElementById('sparkline-canvas');
  if (!canvas || !history || !history.length) return;

  const ctx = canvas.getContext('2d');
  const prices = history.map(h => h.close).filter(Boolean);
  if (!prices.length) return;

  const w = canvas.width, h = canvas.height;
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const isPositive = prices[prices.length - 1] >= prices[0];
  const color = isPositive ? '#10b981' : '#ef4444';

  ctx.clearRect(0, 0, w, h);

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, isPositive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.beginPath();
  prices.forEach((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Fill
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
}

// ── Render: Financial Metrics Grid ────────────────────────────────────────────
function renderFinancialMetrics(fin) {
  const el = document.getElementById('metrics-grid-placeholder');
  if (!el || !fin) return;

  const fmt = (v, suffix = '') => (v != null && v !== 'N/A') ? `${v}${suffix}` : 'N/A';
  const fmtPct = (v) => (v != null && v !== 'N/A') ? `${(parseFloat(v) * 100).toFixed(1)}%` : 'N/A';
  const fmtX = (v) => (v != null && v !== 'N/A') ? `${parseFloat(v).toFixed(1)}x` : 'N/A';

  const metrics = [
    { label: 'Market Cap',    value: fin.market_cap_formatted || 'N/A' },
    { label: 'Revenue (TTM)', value: fin.revenue_formatted || 'N/A' },
    { label: 'Free Cash Flow',value: fin.free_cashflow || 'N/A' },
    { label: 'P/E (Fwd)',     value: fin.forward_pe ? fmtX(fin.forward_pe) : 'N/A' },
    { label: 'EV/Revenue',    value: fin.ev_revenue ? fmtX(fin.ev_revenue) : 'N/A' },
    { label: 'Gross Margin',  value: fin.gross_margin ? fmtPct(fin.gross_margin) : 'N/A' },
    { label: 'Op. Margin',    value: fin.operating_margin ? fmtPct(fin.operating_margin) : 'N/A' },
    { label: 'Rev. Growth',   value: fin.revenue_growth ? fmtPct(fin.revenue_growth) : 'N/A' },
  ];

  el.innerHTML = `
    <div class="metrics-grid">
      ${metrics.map(m => `
        <div class="metric-card">
          <div class="metric-label">${m.label}</div>
          <div class="metric-value">${m.value}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Render: News ──────────────────────────────────────────────────────────────
function renderNews(news) {
  const el = document.getElementById('news-strip-placeholder');
  if (!el || !news || !news.length) return;

  el.innerHTML = `
    <div class="news-strip">
      <div class="news-strip-title">📰 Recent News</div>
      <div class="news-items">
        ${news.slice(0, 4).map(n => `
          <div class="news-item">
            <div class="news-date">${n.date || n.datetime || ''}</div>
            <div>
              <div class="news-headline">${n.headline}</div>
              <div class="news-source">${n.source}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Render: Research Guide (Left Panel) ───────────────────────────────────────
function renderResearchGuide(guide, ticker) {
  const whatMatters = guide.what_really_matters || [];
  const howToResearch = guide.how_to_research || [];
  const kpis = guide.key_kpis || [];

  leftPanel.innerHTML = `
    <div class="sidebar-header">
      <span class="sidebar-title">Research Guide — ${ticker}</span>
      <button class="sidebar-close" onclick="document.getElementById('left-panel').classList.remove('mobile-open');document.getElementById('sidebar-overlay').classList.remove('open')">✕</button>
    </div>
    <div class="sidebar-body">
      <div class="guide-section">
        <div class="guide-section-title">What Really Matters</div>
        <ul class="guide-list">${whatMatters.map(item => `<li>${item}</li>`).join('')}</ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">How To Research</div>
        <ul class="guide-list">${howToResearch.map(item => `<li>${item}</li>`).join('')}</ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Key KPIs</div>
        ${kpis.map(k => `<div class="kpi-item"><div class="kpi-name">${k.metric}</div><div class="kpi-desc">${k.explanation}</div></div>`).join('')}
      </div>
    </div>
  `;
}

// ── Render: Report Sections ───────────────────────────────────────────────────
const SECTION_NUMBERS = {
  executive_summary:  '1',
  core_thesis:        '2',
  business_model:     '3',
  industry_structure: '4',
  competitive_position:'5',
  management:         '6',
  financial_quality:  '7',
  investment_judgment:'8',
};

const SECTION_NUMBERS_RC = {
  base_profile:           '1',
  investor_relations:     '2',
  conference_call:        '3',
  quarterly_report:       '4',
  investor_presentations: '5',
  news_analysis:          '6',
  valuation:              '7',
  share_statistics:       '8',
};

function renderSectionStart(key, title) {
  const container = document.getElementById('sections-container');
  if (!container) return;

  const sectionEl = document.createElement('div');
  const isRC = state.workflow === 'research_checklist' || (state.pendingSnapshot && state.pendingSnapshot.workflow === 'research_checklist');
  sectionEl.className = isRC ? 'report-section wf-rc' : 'report-section';
  sectionEl.id = `section-${key}`;
  const sectionNum = (state.workflow === 'research_checklist'
    ? SECTION_NUMBERS_RC[key]
    : SECTION_NUMBERS[key]) || '#';
  sectionEl.innerHTML = `
    <div class="section-header">
      <div class="section-number">${sectionNum}</div>
      <div class="section-title-text">${title}</div>
      <div class="section-status loading" id="status-${key}"></div>
    </div>
    <div class="section-body" id="body-${key}"><span class="typing-cursor"></span></div>
  `;
  container.appendChild(sectionEl);
  sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateSectionContent(key, text) {
  const bodyEl = document.getElementById(`body-${key}`);
  if (!bodyEl) return;
  bodyEl.innerHTML = formatSectionText(text) + '<span class="typing-cursor"></span>';
}

function finalizeSectionContent(key) {
  const bodyEl = document.getElementById(`body-${key}`);
  const statusEl = document.getElementById(`status-${key}`);
  if (bodyEl) {
    const text = state.sectionBuffers[key] || '';
    bodyEl.innerHTML = formatSectionText(text);
  }
  if (statusEl) {
    statusEl.classList.remove('loading');
    statusEl.classList.add('done');
  }
}

function formatSectionText(text) {
  if (!text) return '';
  // Highlight "Judgment:" lines
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/(Judgment:.*)/g, '<div class="judgment-line">$1</div>');
  return formatted;
}

// ── Render from Cache ─────────────────────────────────────────────────────────
function renderFromCache(entry) {
  const ticker = entry.ticker;
  state.currentTicker = ticker;

  const cachedWorkflow = entry.workflow || 'hedge_fund';
  state.workflow = cachedWorkflow;
  // Sync mode UI
  setWorkflow(cachedWorkflow);

  // Build the shell without progress bar
  rightPanel.innerHTML = `
    <div id="company-header-placeholder"></div>
    <div id="metrics-grid-placeholder"></div>
    <div class="report-header-bar">
      <div>
        <div class="report-title-text">APEXALPHA — INSTITUTIONAL RESEARCH REPORT</div>
        <div class="report-subtitle">Investment Report: ${ticker}</div>
      </div>
      <div class="report-actions">
        <span class="report-badge" id="cache-badge" style="background:${cachedWorkflow === 'research_checklist' ? 'var(--amber)' : 'var(--green)'}">${cachedWorkflow === 'research_checklist' ? 'RC CACHED' : 'HF CACHED'}</span>
        <span class="cache-timestamp">Saved ${new Date(entry.ts).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
        <button class="export-btn" onclick="startReport('${ticker}', true)" title="Re-run live analysis">↺ Refresh</button>
        <button class="export-btn" onclick="window.print()">⬇ Export PDF</button>
      </div>
    </div>
    <div id="news-strip-placeholder"></div>
    <div id="sections-container"></div>
  `;

  if (entry.data) {
    renderCompanyHeader(entry.data);
    renderFinancialMetrics(entry.data.financials);
    renderSparkline(entry.data.price_history);
    renderNews(entry.data.news);
  }
  if (entry.guide) renderResearchGuide(entry.guide, ticker);

  // Replay all sections instantly
  const HF_SECTION_ORDER = [
    ['executive_summary','Executive Summary'],['core_thesis','Core Thesis'],
    ['business_model','What The Business Does'],['industry_structure','Industry & Market Structure'],
    ['competitive_position','Competitive Position'],['management','Management & Capital Allocation'],
    ['financial_quality','Financial Quality'],['investment_judgment','Investment Judgment & Key Risks'],
  ];
  const RC_SECTION_ORDER = [
    ['base_profile','Base Profile'],
    ['investor_relations','Investor Relations & 10-K'],
    ['conference_call','Latest Conference Call'],
    ['quarterly_report','Latest Quarterly Report'],
    ['investor_presentations','Investor Presentations'],
    ['news_analysis','News & Sentiment'],
    ['valuation','Valuation'],
    ['share_statistics','Share Statistics'],
  ];
  const SECTION_ORDER = cachedWorkflow === 'research_checklist' ? RC_SECTION_ORDER : HF_SECTION_ORDER;

  SECTION_ORDER.forEach(([key, title]) => {
    const text = entry.sections[key];
    if (!text) return;
    renderSectionStart(key, title);
    const bodyEl = document.getElementById(`body-${key}`);
    const statusEl = document.getElementById(`status-${key}`);
    if (bodyEl) bodyEl.innerHTML = formatSectionText(text);
    if (statusEl) { statusEl.classList.remove('loading'); statusEl.classList.add('done'); }
    // Apply RC class
    const sectionEl = document.getElementById(`section-${key}`);
    if (sectionEl && cachedWorkflow === 'research_checklist') sectionEl.classList.add('wf-rc');
  });

  // Update left panel sidebar
  if (entry.guide) renderResearchGuide(entry.guide, ticker);

  showToast(`Loaded cached report for ${ticker}`, 'info', 3000);
}

function showCacheBadge(ticker) {
  const bar = document.querySelector('.report-header-bar .report-actions');
  if (!bar || bar.querySelector('#cache-badge')) return;
  const ts = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const isRC = state.workflow === 'research_checklist';
  const badge = document.createElement('span');
  badge.id = 'cache-badge';
  badge.className = 'report-badge';
  badge.style.background = isRC ? 'var(--amber)' : 'var(--green)';
  badge.textContent = isRC ? 'RC CACHED' : 'HF CACHED';
  const tsEl = document.createElement('span');
  tsEl.className = 'cache-timestamp';
  tsEl.textContent = `Saved ${ts}`;
  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'export-btn';
  refreshBtn.title = 'Re-run live analysis';
  refreshBtn.textContent = '↺ Refresh';
  refreshBtn.onclick = () => startReport(ticker, true);
  bar.prepend(tsEl); bar.prepend(badge);
  // Insert refresh before Export PDF
  const exportBtn = bar.querySelector('button');
  if (exportBtn) bar.insertBefore(refreshBtn, exportBtn);
  else bar.appendChild(refreshBtn);
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init() {
  setWorkflow('hedge_fund');  // Initialize mode UI
  await checkKeyStatus();
  renderRecentTickers();

  try {
    await fetch(`${API_BASE}/health`);
  } catch (e) {
    showToast('Backend not running. Start it with: cd backend && uvicorn main:app --reload', 'error', 8000);
  }
})();
