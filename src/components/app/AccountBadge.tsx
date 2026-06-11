"use client";

import { useEffect, useState } from "react";
import { useAppStore, useUserStore } from "@/lib/store";
import { Crown } from "lucide-react";

// Navbar account indicator. Shows the plan; free users get an Upgrade button.
export default function AccountBadge() {
  const tier = useUserStore((s) => s.tier);
  const isSignedUp = useUserStore((s) => s.isSignedUp());
  const openUpgrade = useAppStore((s) => s.openUpgrade);
  const openSignup = useAppStore((s) => s.openSignup);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (!isSignedUp) {
    return (
      <button className="acct-upgrade" onClick={() => openSignup()}>
        Start free
      </button>
    );
  }

  if (tier === "pro") {
    return (
      <span className="acct-badge pro" title="Pro plan">
        <Crown size={13} /> Pro
      </span>
    );
  }

  return (
    <button className="acct-upgrade" onClick={() => openUpgrade()}>
      Upgrade
    </button>
  );
}
