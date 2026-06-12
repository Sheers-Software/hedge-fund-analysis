"use client";

import { useState } from "react";
import { Panel, PillTabs, ConfidenceMeter, SignalTag } from "./bits";

interface TechBlock {
  summary: string;
  bullets: string[];
  signal: "bullish" | "bearish" | "neutral";
  confidence: number;
}
interface FundBlock {
  summary: string;
  bullets: string[];
  confidence: number;
  metrics: { label: string; value: string }[];
}

export default function AIAnalysisPanel({
  technical,
  fundamental,
  aiPowered,
}: {
  technical: TechBlock;
  fundamental: FundBlock;
  aiPowered: boolean;
}) {
  const [tab, setTab] = useState<"technical" | "fundamental">("technical");
  const conf = tab === "technical" ? technical.confidence : fundamental.confidence;

  return (
    <Panel
      title="AI Analysis"
      badge={<span className={`intel-tag ${aiPowered ? "intel-tag-ai" : "intel-tag-quant"}`}>{aiPowered ? "Gemini 2.5" : "Quant"}</span>}
    >
      <PillTabs
        tabs={[
          { id: "technical", label: "Technical Analysis" },
          { id: "fundamental", label: "Fundamental Analysis" },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="intel-conf-head">
        <span className="intel-quick">QUICK ANALYSIS</span>
        {tab === "technical" && <SignalTag signal={technical.signal} />}
      </div>
      <ConfidenceMeter value={conf} />

      {tab === "technical" ? (
        <>
          <p className="intel-summary">{technical.summary}</p>
          <ul className="intel-bullets">
            {technical.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="intel-summary">{fundamental.summary}</p>
          <div className="intel-metric-grid">
            {fundamental.metrics.map((m) => (
              <div key={m.label} className="intel-metric">
                <span className="intel-metric-label">{m.label}</span>
                <span className="intel-metric-value">{m.value}</span>
              </div>
            ))}
          </div>
          <ul className="intel-bullets">
            {fundamental.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </>
      )}
      <p className="intel-foot">For educational purposes only. Not financial advice.</p>
    </Panel>
  );
}
