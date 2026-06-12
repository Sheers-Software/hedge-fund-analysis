"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore, useUserStore } from "@/lib/store";
import { TIERS } from "@/lib/tiers";
import { Crown, LogOut, ChevronDown, User } from "lucide-react";

// Navbar account control. Logged out → "Log in". Logged in → a tier chip that
// opens a menu with Upgrade (if not top tier) and Log out.
export default function AccountBadge() {
  const tier = useUserStore((s) => s.tier);
  const email = useUserStore((s) => s.email);
  const isSignedUp = useUserStore((s) => s.isSignedUp());
  const logout = useUserStore((s) => s.logout);
  const openUpgrade = useAppStore((s) => s.openUpgrade);
  const openSignup = useAppStore((s) => s.openSignup);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!mounted) return null;

  if (!isSignedUp) {
    return (
      <button className="acct-upgrade" onClick={() => openSignup()}>
        Log in
      </button>
    );
  }

  const tierName = TIERS[tier].name;
  const isPremium = tier === "premium";
  const isFree = tier === "free";

  return (
    <div className="acct-menu-wrap" ref={ref}>
      <button
        className={`acct-badge acct-badge-btn ${tier}`}
        onClick={() => setOpen((o) => !o)}
        title={`${tierName} plan`}
      >
        {isFree ? <User size={13} /> : <Crown size={13} />}
        {tierName}
        <ChevronDown size={12} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div className="acct-dropdown">
          <div className="acct-dd-email">
            <div className="acct-dd-label">Signed in as</div>
            <div className="acct-dd-value">{email}</div>
          </div>
          {!isPremium && (
            <button
              className="acct-dd-item acct-dd-upgrade"
              onClick={() => {
                setOpen(false);
                openUpgrade(
                  isFree
                    ? "Upgrade to unlock unlimited research and the AI Intelligence desk."
                    : "Upgrade to Premium for the AI Intelligence terminal."
                );
              }}
            >
              <Crown size={14} /> Upgrade plan
            </button>
          )}
          <button
            className="acct-dd-item"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
