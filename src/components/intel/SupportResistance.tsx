"use client";

import { useState } from "react";
import { Panel, PillTabs, ConfidenceMeter } from "./bits";
import type { Level, PricePoint } from "@/lib/intel";

function MiniChart({ history, level, color }: { history: PricePoint[]; level: number | null; color: string }) {
  const v = history.map((h) => h.close);
  if (v.length < 2) return <div className="intel-sr-mini-empty">No recent price data</div>;
  const W = 240;
  const H = 70;
  const min = Math.min(...v, level ?? Infinity);
  const max = Math.max(...v, level ?? -Infinity);
  const span = max - min || 1;
  const xOf = (i: number) => (i / (v.length - 1)) * W;
  const yOf = (val: number) => H - 6 - ((val - min) / span) * (H - 12);
  const path = v.map((val, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(val).toFixed(1)}`).join(" ");
  const ly = level != null ? yOf(level) : null;

  return (
    <svg className="intel-sr-mini" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {ly != null && (
        <>
          <line x1={0} x2={W} y1={ly} y2={ly} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
          <text x={W - 4} y={ly - 4} className="intel-sr-mini-label" textAnchor="end" fill={color}>
            ${level!.toFixed(2)}
          </text>
        </>
      )}
      <path d={path} fill="none" stroke={color} strokeWidth={1.8} />
      <circle cx={xOf(v.length - 1)} cy={yOf(v[v.length - 1])} r={2.6} fill={color} />
    </svg>
  );
}

export default function SupportResistance({
  current,
  supports,
  resistances,
  confidence,
  summary,
  history,
}: {
  current: number | null;
  supports: Level[];
  resistances: Level[];
  confidence: number;
  summary: string;
  history: PricePoint[];
}) {
  const [tab, setTab] = useState<"support" | "resistance">("support");
  const levels = tab === "support" ? supports : resistances;
  const color = tab === "support" ? "var(--green)" : "var(--red)";
  const nearest = levels[0]?.price ?? null;

  return (
    <Panel title="Support & Resistance">
      <PillTabs
        tabs={[
          { id: "support", label: "Support" },
          { id: "resistance", label: "Resistance" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <ConfidenceMeter value={confidence} />

      <div className="intel-sr-title">AI Analysis</div>
      <p className="intel-summary">{summary}</p>

      {levels.length > 0 ? (
        <div className="intel-sr-levels">
          {levels.map((l, i) => (
            <div key={i} className="intel-sr-level">
              <span className="intel-sr-price" style={{ color }}>
                ${l.price.toFixed(2)}
              </span>
              <span className="intel-sr-bar-track">
                <span className="intel-sr-bar-fill" style={{ width: `${l.strengthPct}%`, background: color }} />
              </span>
              <span className="intel-sr-touch">{l.touches}×</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="intel-foot">No clear {tab} zones from recent price action.</p>
      )}

      <div className="intel-sr-mini-wrap">
        <MiniChart history={history} level={nearest} color={tab === "support" ? "#10b981" : "#f43f5e"} />
      </div>
      <p className="intel-foot">Levels derived from pivot clustering of recent closes. For education only.</p>
    </Panel>
  );
}
