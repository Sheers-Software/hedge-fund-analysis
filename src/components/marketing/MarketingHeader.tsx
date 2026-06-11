import Link from "next/link";
import { Activity } from "lucide-react";

export default function MarketingHeader() {
  return (
    <header className="mkt-header">
      <Link href="/" className="navbar-brand">
        <div className="flex items-center gap-2">
          <Activity size={20} color="var(--accent)" />
          <span className="brand-name">
            Apex<span className="title-accent">Alpha</span>
          </span>
        </div>
      </Link>
      <nav className="mkt-nav">
        <Link href="/pricing" className="mkt-nav-link">
          Pricing
        </Link>
        <Link href="/app" className="mkt-nav-link mkt-nav-link-muted">
          Sign in
        </Link>
        <Link href="/app" className="mkt-btn mkt-btn-primary mkt-btn-sm">
          Start free
        </Link>
      </nav>
    </header>
  );
}
