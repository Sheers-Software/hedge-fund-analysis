"use client";

export interface BarPoint {
  label: string;
  year: number;
  value: number | null;
  projected: boolean;
}

interface Props {
  data: BarPoint[];
  /** "eps" => green/red bars; "fcf" => cyan/red bars. Projected => amber. */
  mode: "eps" | "fcf";
  format: (v: number) => string;
  height?: number;
}

const COLORS = {
  eps: { pos: "#22c55e", neg: "#ef4444" },
  fcf: { pos: "#22d3ee", neg: "#ef4444" },
  projected: "#f59e0b",
};

export default function QuarterlyBarChart({ data, mode, format, height = 260 }: Props) {
  const slot = 34;
  const padL = 52;
  const padR = 14;
  const padT = 26;
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

  // Y gridlines (5 ticks)
  const ticks: number[] = [];
  for (let i = 0; i <= 4; i++) ticks.push(min + (span / 4) * i);

  // Year group boundaries for top labels.
  const yearGroups: { year: number; start: number; count: number }[] = [];
  data.forEach((d, i) => {
    const last = yearGroups[yearGroups.length - 1];
    if (last && last.year === d.year) last.count++;
    else yearGroups.push({ year: d.year, start: i, count: 1 });
  });

  const barW = slot * 0.62;

  return (
    <svg className="qbar-svg" viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="xMinYMid meet" role="img">
      {/* gridlines + y labels */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={yOf(t)} x2={W - padR} y2={yOf(t)} className="qbar-grid" />
          <text x={padL - 8} y={yOf(t) + 3} className="qbar-ylabel" textAnchor="end">
            {format(t)}
          </text>
        </g>
      ))}
      {/* zero baseline emphasized */}
      <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} className="qbar-zero" />

      {/* year separators + labels */}
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

      {/* bars */}
      {data.map((d, i) => {
        if (d.value == null) return null;
        const x = padL + i * slot + (slot - barW) / 2;
        const y = d.value >= 0 ? yOf(d.value) : zeroY;
        const h = Math.max(1, Math.abs(yOf(d.value) - zeroY));
        const color = d.projected
          ? COLORS.projected
          : d.value >= 0
            ? COLORS[mode].pos
            : COLORS[mode].neg;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={2}
              fill={color}
              fillOpacity={d.projected ? 0.55 : 0.92}
              stroke={d.projected ? COLORS.projected : "none"}
              strokeWidth={d.projected ? 1 : 0}
              strokeDasharray={d.projected ? "2 2" : undefined}
            >
              <title>{`${d.year} ${d.label}${d.projected ? " (projected)" : ""}: ${format(d.value)}`}</title>
            </rect>
            <text x={x + barW / 2} y={height - padB + 14} className="qbar-xlabel" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
