"use client";

import { ReactNode } from "react";

// Shared chrome for the Intelligence terminal panels. Kept tiny and local so
// the panels read consistently (Bloomberg-lite cards on the app's dark shell).

export function Panel({
  title,
  badge,
  right,
  className = "",
  children,
}: {
  title: string;
  badge?: ReactNode;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`intel-panel ${className}`}>
      <header className="intel-panel-head">
        <div className="intel-panel-title">
          {title}
          {badge}
        </div>
        {right}
      </header>
      <div className="intel-panel-body">{children}</div>
    </section>
  );
}

export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="intel-pills" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          className={`intel-pill ${value === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const label = pct >= 66 ? "High confidence" : pct >= 40 ? "Moderate confidence" : "Low confidence";
  return (
    <div className="intel-conf">
      <div className="intel-conf-row">
        <span className="intel-conf-label">Confidence</span>
        <span className="intel-conf-value">{label}</span>
      </div>
      <div className="intel-conf-track">
        <div className="intel-conf-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SignalTag({ signal }: { signal: "bullish" | "bearish" | "neutral" }) {
  return <span className={`intel-signal intel-signal-${signal}`}>{signal}</span>;
}
