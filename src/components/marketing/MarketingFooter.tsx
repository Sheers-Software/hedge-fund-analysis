import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-inner">
        <div className="mkt-footer-top">
          <div className="navbar-brand">
            <span className="brand-name">
              Apex<span className="title-accent">Alpha</span>
            </span>
          </div>
          <nav className="mkt-footer-links">
            <Link href="/app">Open app</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>
        </div>
        <p className="mkt-disclaimer">
          <strong>For research &amp; educational purposes only.</strong> ApexAlpha
          is an analysis tool, not a registered investment adviser, broker-dealer,
          or financial planner. Nothing here is investment advice or a
          recommendation to buy or sell any security. AI-generated content and
          third-party data may be delayed or inaccurate — always do your own
          research and verify independently before making any investment decision.
        </p>
        <p className="mkt-copyright">
          © {new Date().getFullYear()} ApexAlpha. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
