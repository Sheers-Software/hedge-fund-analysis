"use client";

import { CompanyData } from "@/lib/types";
import { Sparklines, SparklinesLine } from "react-sparklines";

export default function CompanyHeader({ data }: { data: CompanyData }) {
  const { info, financials, real_time_quote, price_history } = data;
  
  const currentPrice = real_time_quote?.current || financials?.current_price;
  const changePct = real_time_quote?.change_pct || 0;
  const isPositive = changePct >= 0;

  const sparklineData = price_history?.map(p => p.close) || [];

  return (
    <div className="company-header">
      <div className="company-logo">
        {info?.longName?.charAt(0) || data.ticker.charAt(0)}
      </div>
      <div>
        <div className="company-name-row">
          <h1 className="company-name">{info?.longName || data.ticker}</h1>
          <span className="company-ticker">{data.ticker}</span>
        </div>
        <div className="company-sector">
          {info?.sector || "N/A"} • {info?.industry || "N/A"} • {info?.exchange || "N/A"}
        </div>
        <div className="company-stats">
          <span>Mkt Cap: <b>{financials?.market_cap_formatted || "N/A"}</b></span>
          <span className="val-stat-sep">•</span>
          <span>P/E: <b>{financials?.pe_ratio ? Number(financials.pe_ratio).toFixed(1) : "N/A"}</b></span>
          <span className="val-stat-sep">•</span>
          <span>Fwd P/E: <b>{financials?.forward_pe ? Number(financials.forward_pe).toFixed(1) : "N/A"}</b></span>
        </div>
      </div>
      <div className="price-block">
        <div className="price-current">${currentPrice ? Number(currentPrice).toFixed(2) : "N/A"}</div>
        <div className={`price-change ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? "+" : ""}{changePct ? Number(changePct).toFixed(2) : "0.00"}%
        </div>
        {sparklineData.length > 0 && (
          <div className="sparkline-wrap" style={{ width: "100px", height: "30px" }}>
            <Sparklines data={sparklineData} limit={30}>
              <SparklinesLine color={isPositive ? "var(--green)" : "var(--red)"} style={{ fill: "none", strokeWidth: 2 }} />
            </Sparklines>
          </div>
        )}
      </div>
    </div>
  );
}
