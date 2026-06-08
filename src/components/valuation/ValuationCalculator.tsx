"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/store";
import { CompanyData } from "@/lib/types";

const NUM_YEARS = 5;
const YEARS = Array.from({ length: NUM_YEARS }, (_, i) => new Date().getFullYear() + i);

const SCENARIO_DEFAULTS = {
  bull: {
    revGrowth: [20, 20, 20, 20],
    niGrowth: [30, 30, 30, 30],
    peLow: [35, 35, 35, 35, 35],
    peHigh: [40, 40, 40, 40, 40],
  },
  base: {
    revGrowth: [10, 10, 10, 10],
    niGrowth: [20, 20, 20, 20],
    peLow: [29, 29, 29, 29, 29],
    peHigh: [34, 34, 34, 34, 34],
  },
  bear: {
    revGrowth: [5, 5, 5, 5],
    niGrowth: [5, 5, 5, 5],
    peLow: [20, 20, 20, 20, 20],
    peHigh: [25, 25, 25, 25, 25],
  },
};

const fmtShort = (n: number | null | undefined) => {
  if (n == null || isNaN(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US')}`;
};
const fmtPct = (n: number) => (n == null || isNaN(n)) ? '—' : Math.round(n) + '%';
const fmtEPS = (n: number) => (n == null || isNaN(n)) ? '—' : '$' + Number(n).toFixed(2);
const fmt$ = (n: number) => (n == null || isNaN(n)) ? '—' : '$' + Math.round(n).toLocaleString('en-US');

function fmtCagr(price: number, currentPrice: number, years: number) {
  if (!currentPrice || currentPrice <= 0 || !price || price <= 0 || years <= 0) return '—';
  const cagr = (Math.pow(price / currentPrice, 1 / years) - 1) * 100;
  return Math.round(cagr) + '%';
}

function parseSharesStr(str: string | null) {
  if (!str || str === 'N/A') return null;
  const cleaned = str.replace(/[$,\s]/g, '');
  const m = cleaned.match(/^([\d.]+)([KMBT]?)$/i);
  if (!m) return null;
  const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[m[2].toUpperCase()] || 1;
  return parseFloat(m[1]) * mult;
}

function ScenarioTable({ 
  sc, 
  data, 
  onChange, 
  seedRevenue, 
  seedNetIncome, 
  onSeedChange,
  currentPrice,
  sharesOut
}: any) {
  const rev = new Array(NUM_YEARS);
  const ni = new Array(NUM_YEARS);
  const mgn = new Array(NUM_YEARS);
  const eps = new Array(NUM_YEARS);
  const spLo = new Array(NUM_YEARS);
  const spHi = new Array(NUM_YEARS);
  const cgLo = new Array(NUM_YEARS);
  const cgHi = new Array(NUM_YEARS);

  rev[0] = seedRevenue || 0;
  ni[0] = seedNetIncome || 0;

  for (let i = 1; i < NUM_YEARS; i++) {
    const rg = parseFloat(data.revGrowth[i - 1]) || 0;
    const ng = parseFloat(data.niGrowth[i - 1]) || 0;
    rev[i] = rev[i - 1] * (1 + rg / 100);
    ni[i] = ni[i - 1] * (1 + ng / 100);
  }

  for (let i = 0; i < NUM_YEARS; i++) {
    mgn[i] = rev[i] > 0 ? (ni[i] / rev[i]) * 100 : 0;
    eps[i] = sharesOut && sharesOut > 0 ? ni[i] / sharesOut : 0;
    spLo[i] = eps[i] * (parseFloat(data.peLow[i]) || 0);
    spHi[i] = eps[i] * (parseFloat(data.peHigh[i]) || 0);
    cgLo[i] = i >= 2 ? fmtCagr(spLo[i], currentPrice, i) : '—';
    cgHi[i] = i >= 2 ? fmtCagr(spHi[i], currentPrice, i) : '—';
  }

  const handleInput = (key: string, idx: number, val: string) => {
    const num = val === '' ? 0 : parseFloat(val);
    const newData = { ...data };
    newData[key] = [...newData[key]];
    newData[key][idx] = num;
    onChange(sc, newData);
  };

  return (
    <div className="val-scenario-block">
      <div className={`val-scenario-header ${sc}`}>
        <span className="val-scenario-label">{sc.toUpperCase()} CASE</span>
        <div className="val-scenario-actions">
          <button className="val-load-btn" onClick={() => {
            const saved = localStorage.getItem(`apexalpha_val_${sc}`);
            if (saved) {
              const obj = JSON.parse(saved);
              onChange(sc, obj.data);
            }
          }}>LOAD</button>
          <button className="val-save-btn" onClick={() => {
            localStorage.setItem(`apexalpha_val_${sc}`, JSON.stringify({ data }));
            alert("Saved locally!");
          }}>SAVE</button>
        </div>
      </div>
      <div className="val-table-wrap">
        <table className="val-table">
          <tbody>
            <tr className="val-row val-row-label">
              <td className="val-td val-row-title">YEAR</td>
              {YEARS.map(y => <td key={y} className="val-td val-td-year">{y}</td>)}
            </tr>
            <tr className="val-row">
              <td className="val-td val-row-title">REVENUE</td>
              <td className="val-td val-td-input val-td-seed">
                <input className="val-input val-input-seed" type="number" value={Math.round(seedRevenue)} onChange={e => onSeedChange("rev", e.target.value)} />
              </td>
              {rev.slice(1).map((v, i) => <td key={i} className="val-td val-td-auto">{fmtShort(v)}</td>)}
            </tr>
            <tr className="val-row val-row-input-row">
              <td className="val-td val-row-title val-row-title-sub">REV GROWTH</td>
              <td className="val-td val-td-auto val-td-blank">—</td>
              {data.revGrowth.map((v: any, i: number) => (
                <td key={i} className="val-td val-td-input pct-input">
                  <input className="val-input" type="number" value={v} onChange={e => handleInput('revGrowth', i, e.target.value)} />
                </td>
              ))}
            </tr>
            <tr className="val-spacer-row"><td colSpan={6}></td></tr>
            <tr className="val-row">
              <td className="val-td val-row-title">NET INCOME</td>
              <td className="val-td val-td-input val-td-seed">
                <input className="val-input val-input-seed" type="number" value={Math.round(seedNetIncome)} onChange={e => onSeedChange("ni", e.target.value)} />
              </td>
              {ni.slice(1).map((v, i) => <td key={i} className="val-td val-td-auto">{fmtShort(v)}</td>)}
            </tr>
            <tr className="val-row val-row-input-row">
              <td className="val-td val-row-title val-row-title-sub">NET INC. GROWTH</td>
              <td className="val-td val-td-auto val-td-blank">—</td>
              {data.niGrowth.map((v: any, i: number) => (
                <td key={i} className="val-td val-td-input pct-input">
                  <input className="val-input" type="number" value={v} onChange={e => handleInput('niGrowth', i, e.target.value)} />
                </td>
              ))}
            </tr>
            <tr className="val-spacer-row"><td colSpan={6}></td></tr>
            <tr className="val-row">
              <td className="val-td val-row-title val-row-title-sub">NET INC. MARGINS</td>
              {mgn.map((v, i) => <td key={i} className="val-td val-td-auto">{fmtPct(v)}</td>)}
            </tr>
            <tr className="val-row">
              <td className="val-td val-row-title">EPS</td>
              {eps.map((v, i) => <td key={i} className="val-td val-td-auto">{fmtEPS(v)}</td>)}
            </tr>
            <tr className="val-spacer-row"><td colSpan={6}></td></tr>
            <tr className="val-row val-row-input-row">
              <td className="val-td val-row-title val-row-title-sub">PE LOW EST</td>
              {data.peLow.map((v: any, i: number) => (
                <td key={i} className="val-td val-td-input">
                  <input className="val-input" type="number" value={v} onChange={e => handleInput('peLow', i, e.target.value)} />
                </td>
              ))}
            </tr>
            <tr className="val-row val-row-input-row">
              <td className="val-td val-row-title val-row-title-sub">PE HIGH EST</td>
              {data.peHigh.map((v: any, i: number) => (
                <td key={i} className="val-td val-td-input">
                  <input className="val-input" type="number" value={v} onChange={e => handleInput('peHigh', i, e.target.value)} />
                </td>
              ))}
            </tr>
            <tr className="val-spacer-row"><td colSpan={6}></td></tr>
            <tr className="val-row val-row-price">
              <td className="val-td val-row-title">SHARE PRICE LOW</td>
              {spLo.map((v, i) => <td key={i} className="val-td val-td-auto val-td-gold">{fmt$(v)}</td>)}
            </tr>
            <tr className="val-row val-row-price">
              <td className="val-td val-row-title">SHARE PRICE HIGH</td>
              {spHi.map((v, i) => <td key={i} className="val-td val-td-auto val-td-gold">{fmt$(v)}</td>)}
            </tr>
            <tr className="val-spacer-row"><td colSpan={6}></td></tr>
            <tr className="val-row val-row-cagr">
              <td className="val-td val-row-title val-row-title-sub">CAGR LOW</td>
              {cgLo.map((v, i) => <td key={i} className={`val-td val-td-auto ${i >= 2 ? 'val-td-cagr' : 'val-td-blank'}`}>{v}</td>)}
            </tr>
            <tr className="val-row val-row-cagr">
              <td className="val-td val-row-title val-row-title-sub">CAGR HIGH</td>
              {cgHi.map((v, i) => <td key={i} className={`val-td val-td-auto ${i >= 2 ? 'val-td-cagr' : 'val-td-blank'}`}>{v}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ValuationCalculator({ ticker }: { ticker: string }) {
  const { finnhubKey } = useSettingsStore();
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPrice, setCurrentPrice] = useState(0);
  const [sharesOut, setSharesOut] = useState(0);
  const [seedRevenue, setSeedRevenue] = useState(0);
  const [seedNetIncome, setSeedNetIncome] = useState(0);

  const [scenarios, setScenarios] = useState(SCENARIO_DEFAULTS);

  useEffect(() => {
    fetchData();
  }, [ticker]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quote/${ticker}`, {
        headers: { "x-finnhub-key": finnhubKey }
      });
      const d: CompanyData = await res.json();
      setData(d);
      
      const q = d.real_time_quote || {};
      const f = d.financials || {};
      
      setCurrentPrice(parseFloat(q.current || f.current_price || 0));
      
      let sh = parseSharesStr(f.shares_outstanding);
      if (d.finnhub_profile?.shareOutstanding) {
        sh = d.finnhub_profile.shareOutstanding * 1e6;
      }
      setSharesOut(sh || 0);
      
      setSeedRevenue(f.revenue_ttm || 0);
      setSeedNetIncome(f.net_income || 0);

      const savedBull = localStorage.getItem(`apexalpha_val_bull_${ticker}`);
      if (savedBull) setScenarios(s => ({ ...s, bull: JSON.parse(savedBull).data }));

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = (sc: 'bull' | 'base' | 'bear', newScenData: any) => {
    setScenarios(prev => ({ ...prev, [sc]: newScenData }));
  };

  const handleSeedChange = (type: 'rev' | 'ni', val: string) => {
    const num = val === '' ? 0 : parseFloat(val);
    if (type === 'rev') setSeedRevenue(num);
    else setSeedNetIncome(num);
  };

  if (loading) return <div className="p-8 text-center text-[var(--t2)]">Loading data for {ticker}...</div>;
  if (error || !data) return <div className="p-8 text-center text-[var(--red)]">Failed to load data: {error}</div>;

  const info = data.info || {};
  const f = data.financials || {};
  const chPct = data.real_time_quote?.change_pct || 0;
  const isPos = chPct >= 0;

  return (
    <div className="val-calculator">
      {data.error && (
        <div className="bg-orange-900/40 border border-orange-500/50 text-orange-200 p-4 rounded-lg mb-6 text-sm">
          <strong>Data Fetch Warning:</strong> Yahoo Finance data is blocked by Vercel. Add a free Finnhub API Key in Settings to automatically pull metrics, or manually input the stock price and shares below.
        </div>
      )}
      <div className="val-stock-header">
        <div className="val-header-left">
          <div className="val-ticker-badge">{ticker}</div>
          <div className="val-header-meta">
            <div className="val-company-name">{info.longName || ticker}</div>
            <div className="val-stock-stats">
              <span className="stat-group flex items-center gap-1">
                STOCK PRICE: $
                <input 
                  type="number" 
                  className="val-header-input" 
                  value={currentPrice || ''} 
                  onChange={e => setCurrentPrice(parseFloat(e.target.value) || 0)} 
                />
              </span>
              <span className="val-stat-sep">|</span>
              <span>MKT.CAP: <b>{f.market_cap_formatted || 'N/A'}</b></span>
              <span className="val-stat-sep">|</span>
              <span className="stat-group flex items-center gap-1">
                SHARES: 
                <input 
                  type="number" 
                  className="val-header-input" 
                  value={Math.round(sharesOut) || ''} 
                  onChange={e => setSharesOut(parseFloat(e.target.value) || 0)} 
                />
              </span>
            </div>
          </div>
        </div>
        <div className="val-header-right">
          <div className="val-live-price">${currentPrice.toFixed(2)}</div>
          <div className={`val-price-change ${isPos ? 'positive' : 'negative'}`}>
            {isPos ? '+' : ''}{chPct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="val-scenarios">
        {(['bull', 'base', 'bear'] as const).map(sc => (
          <ScenarioTable 
            key={sc}
            sc={sc}
            data={scenarios[sc]}
            onChange={handleScenarioChange}
            seedRevenue={seedRevenue}
            seedNetIncome={seedNetIncome}
            onSeedChange={handleSeedChange}
            currentPrice={currentPrice}
            sharesOut={sharesOut}
          />
        ))}
      </div>
    </div>
  );
}
