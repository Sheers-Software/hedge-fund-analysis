"use client";

// ── Step 3 WTP A/B test: annual renewal anchor ($279 cell A vs $299 cell B) ──
// The cell decides three things in lockstep so display ↔ charge ↔ analytics never
// disagree: the renewal price shown, the Stripe link used, and the `wtp_cell` on
// the Purchase event. Intro stays $99/$199 in both cells (see docs/meta-gtm/wtp-test.md).
//
// Assignment: a `?cell=a|b` URL param (set per Meta ad set) wins and sticks; else
// the previously stored cell; else a sticky 50/50 split so untagged traffic still
// divides cleanly. Everything degrades to cell "a" on the server / if storage fails.

import { useEffect, useState } from "react";
import type { WtpCell } from "@/lib/tiers";

const CELL_KEY = "apex-alpha-wtp-cell";

const isCell = (v: string | null): v is WtpCell => v === "a" || v === "b";

/**
 * Resolve the visitor's WTP cell (browser only). Safe to call from event
 * handlers (e.g. checkout) — reads/writes localStorage synchronously.
 */
export function resolveWtpCell(): WtpCell {
  if (typeof window === "undefined") return "a";
  try {
    const param = new URLSearchParams(window.location.search).get("cell");
    if (isCell(param)) {
      localStorage.setItem(CELL_KEY, param);
      return param;
    }
    const stored = localStorage.getItem(CELL_KEY);
    if (isCell(stored)) return stored;
    const assigned: WtpCell = Math.random() < 0.5 ? "a" : "b";
    localStorage.setItem(CELL_KEY, assigned);
    return assigned;
  } catch {
    return "a";
  }
}

/**
 * Cell for rendering. Defaults to "a" on first paint (stable SSR/hydration) then
 * resolves the real cell after mount, so the renewal anchor reflects the assignment.
 */
export function useWtpCell(): WtpCell {
  const [cell, setCell] = useState<WtpCell>("a");
  useEffect(() => {
    setCell(resolveWtpCell());
  }, []);
  return cell;
}
