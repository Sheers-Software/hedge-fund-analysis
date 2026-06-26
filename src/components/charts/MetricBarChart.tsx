"use client";

import { useRef, useState } from "react";

export interface BarPoint {
  label: string;
  year: number;
  value: number | null;
  projected: boolean;
}

interface Props {
  data: BarPoint[];
  /** Signature colour for actual bars (positive). */
  color: string;
  format: (v: number) => string;
  height?: number;
  /** Highlight the most recent actual bar with an outline (the latest filing). */
  highlightLatest?: boolean;
}

const NEG = "#ef4444";
const PROJ_BODY = "#ef4444"; // projected baseline (prior period) = red
const PROJ_GAIN = "#22c55e"; // projected incremental growth = green

export default function MetricBarChart({
  data,
  color,
  format,
  height = 280,
  highlightLatest = true,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const slot = 34;
  const padL = 58;
  const padR = 14;
  const padT = 28;
  const padB = 30;
  const innerH = height - padT - padB;
  const W = padL + data.length * slot + padR;

  const vals = data.map((d) => d.value).filter((v): v is number => v != null);
  const dataMax = vals.length ? Math.max(...vals) : 1;
  const dataMin = vals.length ? Math.min(...vals) : 0;
  const max = Math.max(0, dataMax) * 1.1 || 1;
  const min = Math.min(0, dataMin) * 1.1;
  const span = max - min || 1;

  const yOf = (v: number) => padT + ((max - v) / span) * innerH;
  const zeroY = yOf(0);

  const ticks: number[] = [];
  for (let i = 0; i <= 4; i++) ticks.push(min + (span / 4) * i);

  // Year group boundaries for the top axis labels.
  const yearGroups: { year: number; start: number; count: number }[] = [];
  data.forEach((d, i) => {
    const last = yearGroups[yearGroups.length - 1];
    if (last && last.year === d.year) last.count++;
    else yearGroups.push({ year: d.year, start: i, count: 1 });
  });

  // Index of the last actual (non-projected) data point that has a value.
  let latestIdx = -1;
  for (let i = data.length - 1; i >= 0; i--) {
    if (!data[i].projected && data[i].value != null) {
      latestIdx = i;
      break;
    }
  }

  const barW = slot * 0.62;

  // Map a pointer event to the column under the cursor. The SVG scales
  // uniformly (preserveAspectRatio "meet" + height:auto), so a flat ratio from
  // the bounding box back into viewBox units is exact.
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    const sy = ((e.clientY - r.top) / r.height) * height;
    const idx = Math.floor((sx - padL) / slot);
    if (idx < 0 || idx >= data.length) {
      setHover(null);
      return;
    }
    setHover({ idx, x: sx, y: sy });
  };
  const onLeave = () => setHover(null);

  return (
    <svg
      ref={svgRef}
      className="qbar-svg"
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="xMinYMid meet"
      role="img"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={yOf(t)} x2={W - padR} y2={yOf(t)} className="qbar-grid" />
          <text x={padL - 8} y={yOf(t) + 3} className="qbar-ylabel" textAnchor="end">
            {format(t)}
          </text>
        </g>
      ))}
      <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} className="qbar-zero" />

      {yearGroups.map((g, i) => {
        const x = padL + g.start * slot;
        const cx = x + (g.count * slot) / 2;
        return (
          <g key={i}>
            {i > 0 && <line x1={x} y1={padT} x2={x} y2={height - padB} className="qbar-yearsep" />}
            <text x={cx} y={16} className="qbar-yearlabel" textAnchor="middle">
              {g.year}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        if (d.value == null) {
          // Still render the x-axis tick so the timeline stays continuous.
          return (
            <text
              key={i}
              x={padL + i * slot + slot / 2}
              y={height - padB + 14}
              className="qbar-xlabel"
              textAnchor="middle"
            >
              {d.label}
            </text>
          );
        }
        const x = padL + i * slot + (slot - barW) / 2;
        const top = yOf(d.value);
        const y = d.value >= 0 ? top : zeroY;
        const h = Math.max(1, Math.abs(top - zeroY));
        const isLatest = highlightLatest && i === latestIdx;

        // Projected bars render as a stacked column that *continues from the
        // previous bar*: a red base equal to the prior period's value, plus a
        // green cap for the incremental projected growth on top. Basing the
        // split on the previous bar (not the prior-year period) keeps the
        // baseline continuous in both Quarterly and Trailing-12-Mo modes — in
        // TTM the prior-year value sits a full year of growth below the latest
        // actual, which would otherwise drop the red base sharply beneath the
        // preceding bar and balloon the green cap.
        if (d.projected && d.value >= 0) {
          let base: number | null = null;
          for (let k = i - 1; k >= 0; k--) {
            if (data[k].value != null) {
              base = data[k].value as number;
              break;
            }
          }
          const baseClamped = base != null ? Math.max(0, Math.min(base, d.value)) : d.value;
          const baseTop = yOf(baseClamped);
          const capH = Math.max(0, baseTop - top);
          return (
            <g key={i}>
              <rect x={x} y={baseTop} width={barW} height={Math.max(0, zeroY - baseTop)} rx={2} fill={PROJ_BODY} fillOpacity={0.85}>
                <title>{`${d.year} ${d.label} (projected): ${format(d.value)}`}</title>
              </rect>
              {capH > 0.5 && (
                <rect x={x} y={top} width={barW} height={capH} rx={2} fill={PROJ_GAIN}>
                  <title>{`${d.year} ${d.label} (projected): ${format(d.value)}`}</title>
                </rect>
              )}
              <text x={x + barW / 2} y={height - padB + 14} className="qbar-xlabel" textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        }

        const fill = d.value >= 0 ? color : NEG;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={2}
              fill={fill}
              fillOpacity={0.92}
              stroke={isLatest ? "#ffffff" : "none"}
              strokeWidth={isLatest ? 1.6 : 0}
            >
              <title>{`${d.year} ${d.label}: ${format(d.value)}`}</title>
            </rect>
            <text x={x + barW / 2} y={height - padB + 14} className="qbar-xlabel" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Cursor hover: column highlight, crosshair and a value tooltip. */}
      {hover &&
        (() => {
          const d = data[hover.idx];
          const cx = padL + hover.idx * slot + slot / 2;
          const l1 = `${d.year} ${d.label}${d.projected ? " · proj" : ""}`;
          const l2 = d.value != null ? format(d.value) : "No data";
          const tw = Math.max(l1.length, l2.length) * 7 + 18;
          const th = 36;
          let tx = hover.x + 14;
          if (tx + tw > W - 2) tx = hover.x - tw - 14;
          if (tx < 2) tx = 2;
          let ty = hover.y - th - 12;
          if (ty < padT) ty = hover.y + 16;
          return (
            <g pointerEvents="none">
              <rect
                x={cx - slot / 2}
                y={padT}
                width={slot}
                height={height - padT - padB}
                fill="#ffffff"
                fillOpacity={0.06}
              />
              <line
                x1={cx}
                y1={padT}
                x2={cx}
                y2={height - padB}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <g transform={`translate(${tx},${ty})`}>
                <rect
                  width={tw}
                  height={th}
                  rx={5}
                  fill="#0b1220"
                  fillOpacity={0.97}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={1}
                />
                <text x={9} y={15} fontSize={10} fontFamily="Inter, sans-serif" fill="#9fb0c0">{l1}</text>
                <text
                  x={9}
                  y={29}
                  fontSize={12}
                  fontWeight={700}
                  fontFamily="'JetBrains Mono', monospace"
                  fill={d.value != null && d.value < 0 ? NEG : color}
                >
                  {l2}
                </text>
              </g>
            </g>
          );
        })()}
    </svg>
  );
}
