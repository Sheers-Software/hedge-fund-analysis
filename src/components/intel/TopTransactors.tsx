"use client";

import { useState } from "react";
import { Panel, PillTabs } from "./bits";

interface InsiderTx {
  name: string;
  action: "Bought" | "Sold";
  shares: number;
  total: number | null;
  date: string;
  code: string;
}

const fmtShares = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(a / 1e3).toFixed(0)}K`;
  return `${a}`;
};

export default function TopTransactors({
  name,
  ticker,
  marketCap,
  institutionalPct,
  insiderPct,
  summary,
  insiderTx,
  netInsiderShares,
}: {
  name: string;
  ticker: string;
  marketCap: string | null;
  institutionalPct: string | null;
  insiderPct: string | null;
  summary: string;
  insiderTx: InsiderTx[];
  netInsiderShares: number;
}) {
  const [tab, setTab] = useState<"institutions" | "insiders">("institutions");

  return (
    <Panel title="Top Transactors">
      <div className="intel-tx-id">
        <div className="intel-tx-avatar">{ticker.slice(0, 2)}</div>
        <div>
          <div className="intel-tx-name">{name}</div>
          <div className="intel-tx-meta">
            Stock · {ticker}
            {marketCap ? ` · ${marketCap} Market Cap` : ""}
          </div>
        </div>
      </div>

      <div className="intel-tx-owner">
        <button className={`intel-tx-owner-btn ${tab === "institutions" ? "active" : ""}`} onClick={() => setTab("institutions")}>
          Institutions <b>{institutionalPct || "n/a"}</b>
        </button>
        <button className={`intel-tx-owner-btn ${tab === "insiders" ? "active" : ""}`} onClick={() => setTab("insiders")}>
          Insiders <b>{insiderPct || "n/a"}</b>
        </button>
      </div>

      <div className="intel-sr-title">{tab === "institutions" ? "Institutional Ownership" : "Insider Activity"}</div>
      <p className="intel-summary">{summary}</p>

      {tab === "insiders" ? (
        insiderTx.length > 0 ? (
          <div className="intel-tx-table">
            <div className="intel-tx-thead">
              <span>Insider</span>
              <span className="intel-tx-r"># Shares</span>
            </div>
            {insiderTx.map((x, i) => (
              <div key={i} className="intel-tx-row">
                <div className="intel-tx-cell">
                  <div className="intel-tx-iname">{x.name}</div>
                  <div className={`intel-tx-action ${x.action === "Bought" ? "pos" : "neg"}`}>
                    {x.action} · {x.date}
                  </div>
                </div>
                <div className="intel-tx-r">
                  <div className={`intel-tx-shares ${x.action === "Bought" ? "pos" : "neg"}`}>
                    {x.action === "Bought" ? "+" : "−"}
                    {fmtShares(x.shares)}
                  </div>
                  {x.total != null && <div className="intel-tx-total">{fmtShares(x.total)} held</div>}
                </div>
              </div>
            ))}
            <div className="intel-tx-net">
              Net insider flow:{" "}
              <b className={netInsiderShares >= 0 ? "pos" : "neg"}>
                {netInsiderShares >= 0 ? "+" : "−"}
                {fmtShares(netInsiderShares)} shares
              </b>
            </div>
          </div>
        ) : (
          <p className="intel-foot">No recent insider transactions reported for {ticker}.</p>
        )
      ) : (
        <div className="intel-tx-ownerstats">
          <div className="intel-ownerstat">
            <span className="intel-ownerstat-label">Institutional</span>
            <span className="intel-ownerstat-val">{institutionalPct || "—"}</span>
          </div>
          <div className="intel-ownerstat">
            <span className="intel-ownerstat-label">Insider</span>
            <span className="intel-ownerstat-val">{insiderPct || "—"}</span>
          </div>
          <p className="intel-foot intel-tx-fullwidth">
            Granular institutional holder filings are a premium data feed. Switch to <b>Insiders</b> for live transaction-level Form 4 activity.
          </p>
        </div>
      )}
      <p className="intel-foot">For informational purposes only — not financial advice.</p>
    </Panel>
  );
}
