"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Settings, Activity, Menu } from "lucide-react";
import { useAppStore, useSettingsStore } from "@/lib/store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const { toggleSidebar, setSettingsOpen } = useAppStore();
  const { geminiKey, finnhubKey } = useSettingsStore();
  const keysValid = geminiKey && finnhubKey;

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

  const handleSelect = (ticker: string) => {
    setQuery("");
    setShowDropdown(false);
    if (pathname.includes("/valuation")) {
      router.push(`/valuation?ticker=${ticker}`);
    } else if (pathname.includes("/charts")) {
      router.push(`/charts?ticker=${ticker}`);
    } else {
      router.push(`/report/${ticker}`);
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
        <Link href="/" className="navbar-brand">
          <div className="flex items-center gap-2">
            <Activity size={20} color="var(--accent)" />
            <span className="brand-name">Apex<span className="title-accent">Alpha</span></span>
          </div>
          <span className="brand-tag">PRO</span>
        </Link>
      </div>

      <div className="navbar-center hidden md:block">
        <div className="nav-tabs">
          <Link href="/" className={`nav-tab ${pathname === "/" || pathname.startsWith("/report") ? "active" : ""}`}>
            Research Hub
          </Link>
          <Link href="/valuation" className={`nav-tab ${pathname.startsWith("/valuation") ? "active" : ""}`}>
            Valuation
          </Link>
          <Link href="/charts" className={`nav-tab ${pathname.startsWith("/charts") ? "active" : ""}`}>
            Charts
          </Link>
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
                <div key={i} className="search-result-item" onClick={() => handleSelect(r.symbol)}>
                  <span className="result-symbol">{r.symbol}</span>
                  <span className="result-name">{r.description}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        <button className="settings-btn ml-2" onClick={() => setSettingsOpen(true)}>
          <Settings size={14} />
          <span className="hidden sm:inline">Settings</span>
          <span className={`key-status-dot ${keysValid ? "active" : "inactive"}`} />
        </button>
      </div>
    </nav>
  );
}
