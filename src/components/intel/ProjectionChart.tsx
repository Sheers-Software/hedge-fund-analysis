"use client";

import type { ModelForecast, PricePoint } from "@/lib/intel";

// Fanned multi-model projection: a muted history line on the left, then each
// model's forward path fanning out to the right from "now". Pure SVG, themed
// off the app's CSS variables.
export default function ProjectionChart({
  history,
  models,
  height = 200,
  hovered,
}: {
  history: PricePoint[];
  models: ModelForecast[];
  height?: number;
  hovered?: string | null;
}) {
  const W = 520;
  const padL = 8;
  const padR = 8;
  const padT = 14;
  const padB = 14;
  const innerW = W - padL - padR;
  const innerH = height - padT - padB;

  const histVals = history.map((h) => h.close);
  const steps = models.length ? models[0].path.length - 1 : 0;
  const histN = histVals.length;
  const totalN = Math.max(1, histN + steps - 1); // last hist point == path[0]

  const allVals = [...histVals, ...models.flatMap((m) => m.path)];
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const span = max - min || 1;
  const pad = span * 0.12;

  const xOf = (i: number) => padL + (i / totalN) * innerW;
  const yOf = (v: number) => padT + ((max + pad - v) / (span + pad * 2)) * innerH;

  const nowIndex = Math.max(0, histN - 1);
  const nowX = xOf(nowIndex);

  const histPath = histVals
    .map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`)
    .join(" ");

  const modelPath = (m: ModelForecast) =>
    m.path
      .map((v, i) => `${i === 0 ? "M" : "L"}${xOf(nowIndex + i).toFixed(1)},${yOf(v).toFixed(1)}`)
      .join(" ");

  return (
    <svg className="intel-proj" viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" role="img" aria-label="Multi-model price projection">
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={padL} x2={W - padR} y1={padT + g * innerH} y2={padT + g * innerH} className="intel-proj-grid" />
      ))}
      {/* now divider */}
      <line x1={nowX} x2={nowX} y1={padT} y2={height - padB} className="intel-proj-now" />

      {/* history */}
      {histN > 1 && <path d={histPath} className="intel-proj-hist" fill="none" />}

      {/* model forecasts */}
      {models.map((m) => {
        const dim = hovered && hovered !== m.name;
        return (
          <g key={m.name} opacity={dim ? 0.2 : 1} style={{ transition: "opacity .15s" }}>
            <path d={modelPath(m)} fill="none" stroke={m.color} strokeWidth={m.name === "Consensus" ? 2.4 : 1.6} strokeLinecap="round" />
            <circle cx={xOf(totalN)} cy={yOf(m.path[m.path.length - 1])} r={m.name === "Consensus" ? 3.2 : 2.4} fill={m.color} />
          </g>
        );
      })}
    </svg>
  );
}
