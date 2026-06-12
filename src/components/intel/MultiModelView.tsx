"use client";

import { useState } from "react";
import { Panel } from "./bits";
import ProjectionChart from "./ProjectionChart";
import { fmtPctSigned, type ModelForecast, type PricePoint } from "@/lib/intel";

export default function MultiModelView({
  price,
  changePct,
  horizonLabel,
  history,
  models,
}: {
  price: number | null;
  changePct: number | null;
  horizonLabel: string;
  history: PricePoint[];
  models: ModelForecast[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const up = (changePct ?? 0) >= 0;

  return (
    <Panel title="Multi-Model View" right={<span className="intel-horizon">{horizonLabel}</span>}>
      <div className="intel-price-row">
        <div>
          <div className="intel-price-label">Current Price</div>
          <div className="intel-price">{price != null ? `$${price.toFixed(2)}` : "—"}</div>
          {changePct != null && (
            <div className={`intel-price-chg ${up ? "pos" : "neg"}`}>
              {up ? "▲" : "▼"} {fmtPctSigned(changePct)} today
            </div>
          )}
        </div>
      </div>

      <div className="intel-proj-wrap">
        <ProjectionChart history={history} models={models} hovered={hovered} />
      </div>

      <div className="intel-models">
        {models.map((m) => {
          const pos = m.changePct >= 0;
          return (
            <button
              key={m.name}
              className="intel-model-row"
              onMouseEnter={() => setHovered(m.name)}
              onMouseLeave={() => setHovered(null)}
              title={m.blurb}
            >
              <span className="intel-model-name">
                <i className="intel-model-dot" style={{ background: m.color }} />
                {m.name}
                {m.kind === "ai" && <span className="intel-model-ai">AI</span>}
              </span>
              <span className={`intel-model-chg ${pos ? "pos" : "neg"}`}>{fmtPctSigned(m.changePct)}</span>
            </button>
          );
        })}
      </div>
      <p className="intel-foot">Quant model ensemble over the {horizonLabel.toLowerCase()} horizon. For education only — not financial advice. Past performance does not guarantee future results.</p>
    </Panel>
  );
}
