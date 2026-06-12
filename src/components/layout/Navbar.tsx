"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Settings, Activity, Menu, Lock } from "lucide-react";
import { useAppStore, useSettingsStore, useHistoryStore } from "@/lib/store";
import { useGate } from "@/lib/useGate";
import { TIERS, requiredTierFor, type GatedFeature } from "@/lib/tiers";
import AccountBadge from "@/components/app/AccountBadge";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Nav tabs and the tier each one requires. A locked tab shows a lock icon and
// opens the signup/upgrade popup instead of navigating.
type NavTab = {
  href: string;
  label: string;
  isActive: (p: string) => boolean;
  feature?: GatedFeature;
};
const NAV_TABS: NavTab[] = [
  { href: "/app", label: "Research Hub", isActive: (p) => p === "/app" || p.startsWith("/report") },
  { href: "/intel", label: "Intelligence", isActive: (p) => p.startsWith("/intel"), feature: "intelFull" },
  { href: "/valuation", label: "Valuation", isActive: (p) => p.startsWith("/valuation"), feature: "valuationFull" },
  { href: "/charts", label: "Charts", isActive: (p) => p.startsWith("/charts"), feature: "chartsFull" },
];

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const { toggleSidebar, setSettingsOpen, openSignup, openUpgrade } = useAppStore();
  const { geminiKey, finnhubKey } = useSettingsStore();
  const { isUnlocked, isSignedUp } = useGate();
  const keysValid = geminiKey && finnhubKey;

  // Persisted tier isn't known on the server — resolve locks only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onLockedClick = (feature: GatedFeature) => {
    const target = requiredTierFor(feature);
    const reason = `${TIERS[target].name} unlocks this — ${TIERS[target].tagline.toLowerCase()}`;
    if (!isSignedUp) openSignup(reason);
    else openUpgrade(reason, target);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`, {
        headers: { "x-finnhub-key": finnhubKey }
      });
      const data = await res.json();
      setResults(data.results || []);
      setShowDropdown(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (ticker: string, name?: string) => {
    setQuery("");
    setShowDropdown(false);
    const t = ticker.toUpperCase();
    if (pathname.includes("/intel")) {
      useHistoryStore.getState().add({ ticker: t, name, kind: "intel" });
      router.push(`/intel/${t}`);
    } else if (pathname.includes("/valuation")) {
      useHistoryStore.getState().add({ ticker: t, name, kind: "valuation" });
      router.push(`/valuation?ticker=${t}`);
    } else if (pathname.includes("/charts")) {
      useHistoryStore.getState().add({ ticker: t, name, kind: "charts" });
      router.push(`/charts?ticker=${t}`);
    } else {
      useHistoryStore.getState().add({ ticker: t, name, kind: "report" });
      router.push(`/report/${t}`);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      handleSelect(query.toUpperCase());
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {pathname.startsWith("/report") && (
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle research guide"
          >
            <Menu size={16} />
          </button>
        )}
        <Link href="/app" className="navbar-brand">
          <div className="flex items-center gap-2">
            <Activity size={20} color="var(--accent)" />
            <span className="brand-name">Apex<span className="title-accent">Alpha</span></span>
          </div>
        </Link>
      </div>

      <div className="navbar-center hidden md:block">
        <div className="nav-tabs">
          {NAV_TABS.map((tab) => {
            const active = tab.isActive(pathname);
            const locked = mounted && !!tab.feature && !isUnlocked(tab.feature);
            if (locked && tab.feature) {
              const feature = tab.feature;
              return (
                <button
                  key={tab.href}
                  className={`nav-tab nav-tab-locked ${active ? "active" : ""}`}
                  onClick={() => onLockedClick(feature)}
                  title={`${TIERS[requiredTierFor(feature)].name} feature — click to unlock`}
                >
                  {tab.label}
                  <Lock size={11} className="nav-tab-lock" />
                </button>
              );
            }
            return (
              <Link key={tab.href} href={tab.href} className={`nav-tab ${active ? "active" : ""}`}>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="navbar-right w-full max-w-md md:w-auto" ref={searchRef}>
        <form onSubmit={onSearchSubmit} className="search-container flex-1">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search ticker (e.g. AAPL)..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          />
          <button type="submit" className="search-btn">
            {isSearching ? "..." : "Search"}
          </button>
          
          {showDropdown && results.length > 0 && (
            <div className="search-dropdown visible">
              {results.map((r, i) => (
                <div key={i} className="search-result-item" onClick={() => handleSelect(r.symbol, r.description)}>
                  <span className="result-symbol">{r.symbol}</span>
                  <span className="result-name">{r.description}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="ml-2">
          <AccountBadge />
        </div>

        <button className="settings-btn ml-2" onClick={() => setSettingsOpen(true)} title="Advanced: bring your own API keys">
          <Settings size={14} />
          <span className={`key-status-dot ${keysValid ? "active" : "inactive"}`} />
        </button>
      </div>
    </nav>
  );
}
