"use client";

export interface MarginPoint {
  label: string;
  year: number;
  gross: number | null;
  net: number | null;
  projected: boolean;
}

const GROSS = "#d946ef";
const NET = "#22d3ee";

export default function MarginLineChart({
  data,
  height = 260,
}: {
  data: MarginPoint[];
  height?: number;
}) {
  const slot = 34;
  const padL = 52;
  const padR = 14;
  const padT = 20;
  const padB = 30;
  const innerH = height - padT - padB;
  const W = padL + data.length * slot + padR;

  // Fixed 0–100% domain (margins are percentages).
  const all = data.flatMap((d) => [d.gross, d.net]).filter((v): v is number => v != null);
  const maxPct = Math.min(1, Math.max(0.9, all.length ? Math.max(...all) * 1.1 : 1));
  const minPct = Math.min(0, all.length ? Math.min(...all) : 0);
  const span = maxPct - minPct || 1;

  const xOf = (i: number) => padL + i * slot + slot / 2;
  const yOf = (v: number) => padT + ((maxPct - v) / span) * innerH;

  const ticks: number[] = [];
  for (let i = 0; i <= 5; i++) ticks.push(minPct + (span / 5) * i);

  const yearGroups: { year: number; start: number; count: number }[] = [];
  data.forEach((d, i) => {
    const last = yearGroups[yearGroups.length - 1];
    if (last && last.year === d.year) last.count++;
    else yearGroups.push({ year: d.year, start: i, count: 1 });
  });

  // Build line segments, splitting actual (solid) vs projected (dashed).
  const buildPath = (key: "gross" | "net") => {
    const pts = data
      .map((d, i) => ({ i, v: d[key], projected: d.projected }))
      .filter((p) => p.v != null) as { i: number; v: number; projected: boolean }[];
    const solid: string[] = [];
    const dashed: string[] = [];
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k];
      const cmd = `${xOf(p.i)},${yOf(p.v)}`;
      if (!p.projected) solid.push(cmd);
      // dashed line connects last actual into the projected tail
      if (p.projected || (k + 1 < pts.length && pts[k + 1].projected)) dashed.push(cmd);
    }
    return { solid: solid.join(" "), dashed: dashed.join(" ") };
  };

  const gross = buildPath("gross");
  const net = buildPath("net");

  return (
    <svg className="qbar-svg" viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="xMinYMid meet" role="img">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={yOf(t)} x2={W - padR} y2={yOf(t)} className="qbar-grid" />
          <text x={padL - 8} y={yOf(t) + 3} className="qbar-ylabel" textAnchor="end">
            {(t * 100).toFixed(0)}%
          </text>
        </g>
      ))}

      {yearGroups.map((g, i) => {
        const x = padL + g.start * slot;
        const cx = x + (g.count * slot) / 2;
        return (
          <g key={i}>
            {i > 0 && <line x1={x} y1={padT} x2={x} y2={height - padB} className="qbar-yearsep" />}
            <text x={cx} y={14} className="qbar-yearlabel" textAnchor="middle">
              {g.year}
            </text>
          </g>
        );
      })}

      {[
        { p: gross, color: GROSS, key: "gross" as const },
        { p: net, color: NET, key: "net" as const },
      ].map(({ p, color, key }) => (
        <g key={key}>
          {p.solid && <polyline points={p.solid} fill="none" stroke={color} strokeWidth={2} />}
          {p.dashed && (
            <polyline points={p.dashed} fill="none" stroke={color} strokeWidth={2} strokeDasharray="4 3" opacity={0.7} />
          )}
          {data.map((d, i) =>
            d[key] != null ? (
              <circle key={i} cx={xOf(i)} cy={yOf(d[key] as number)} r={d.projected ? 2 : 2.6} fill={color} fillOpacity={d.projected ? 0.5 : 1}>
                <title>{`${d.year} ${d.label}${d.projected ? " (projected)" : ""}: ${((d[key] as number) * 100).toFixed(1)}%`}</title>
              </circle>
            ) : null
          )}
        </g>
      ))}

      {data.map((d, i) => (
        <text key={i} x={xOf(i)} y={height - padB + 14} className="qbar-xlabel" textAnchor="middle">
          {d.label}
        </text>
      ))}
    </svg>
  );
}
