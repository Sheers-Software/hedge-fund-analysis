"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHistoryStore, useUserStore, type HistoryItem } from "@/lib/store";
import { Clock } from "lucide-react";

const routeFor = (i: HistoryItem) => {
  switch (i.kind) {
    case "valuation":
      return `/valuation?ticker=${i.ticker}`;
    case "charts":
      return `/charts?ticker=${i.ticker}`;
    case "check":
      return `/app?check=${i.ticker}`;
    default:
      return `/report/${i.ticker}`;
  }
};

const timeAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function RecentSearches({ heading = true }: { heading?: boolean }) {
  const router = useRouter();
  const items = useHistoryStore((s) => s.items);
  const clear = useHistoryStore((s) => s.clear);
  const limit = useUserStore((s) => s.limits().historyLimit);

  // Avoid hydration mismatch: persisted store is only correct after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || items.length === 0) return null;

  const shown = limit === null ? items : items.slice(0, limit);
  const hiddenCount = items.length - shown.length;

  return (
    <div className="recent-list">
      {heading && (
        <div className="welcome-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={12} /> Recent
        </div>
      )}
      {shown.map((i) => (
        <button key={i.ticker} className="recent-item" onClick={() => router.push(routeFor(i))}>
          <span className="recent-ticker">{i.ticker}</span>
          <span className="recent-name">{i.name || ""}</span>
          <span className="recent-kind">{i.kind}</span>
          <span className="recent-when">{timeAgo(i.at)}</span>
        </button>
      ))}
      {hiddenCount > 0 && (
        <div className="form-hint" style={{ textAlign: "center", marginTop: 4 }}>
          +{hiddenCount} more in history — <b>Pro</b> keeps your full search history.
        </div>
      )}
      {limit === null && (
        <button className="recent-clear" onClick={clear}>
          Clear history
        </button>
      )}
    </div>
  );
}
