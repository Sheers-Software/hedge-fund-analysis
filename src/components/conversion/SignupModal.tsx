"use client";

import { useEffect, useState } from "react";
import { useAppStore, useUserStore } from "@/lib/store";
import { trackLead, track } from "@/lib/analytics";
import { Activity, Mail, Lock, ArrowLeft } from "lucide-react";

type Mode = "signup" | "login" | "verify";

// The account modal. Handles the full client-side auth lifecycle: sign up
// (email + password) → email verification → logged in, plus log in / relogin.
// Email capture still fires the Meta "Lead" event. See src/lib/auth.ts for the
// security caveat (validation MVP, swap for a managed provider in prod).
export default function SignupModal() {
  const { isSignupOpen, signupReason, closeSignup, afterAuth } = useAppStore();
  const register = useUserStore((s) => s.register);
  const verifyEmail = useUserStore((s) => s.verifyEmail);
  const resendCode = useUserStore((s) => s.resendCode);
  const login = useUserStore((s) => s.login);
  const accounts = useUserStore((s) => s.accounts);
  const pending = useUserStore((s) => s.pending);

  const hasAccounts = Object.keys(accounts).length > 0;
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isSignupOpen) {
      setMode(hasAccounts ? "login" : "signup");
      setEmail("");
      setPassword("");
      setCode("");
      setDemoCode(null);
      setError(null);
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignupOpen]);

  const finish = () => {
    const resume = afterAuth;
    closeSignup();
    if (resume) setTimeout(resume, 0);
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await register(email, password);
    setBusy(false);
    if (!res.ok) return setError(res.error || "Could not create account.");
    // Email captured = Meta Lead.
    trackLead(signupReason || "signup_modal");
    setDemoCode(res.code || null);
    setMode("verify");
  };

  const onVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const res = verifyEmail(code);
    if (!res.ok) return setError(res.error || "Verification failed.");
    track("CompleteRegistration");
    finish();
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) return finish();
    if (res.needsVerification) {
      setDemoCode(res.code || null);
      setError(res.error || null);
      setMode("verify");
      return;
    }
    setError(res.error || "Login failed.");
  };

  const onResend = () => {
    const c = resendCode();
    if (c) {
      setDemoCode(c);
      setError(null);
    }
  };

  const verifyingEmail = pending?.email || email;

  return (
    <div className={`modal-overlay ${isSignupOpen ? "open" : ""}`} onClick={closeSignup}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center mb-4">
          <div className="welcome-icon" style={{ width: 56, height: 56, borderRadius: 14 }}>
            <Activity size={26} color="var(--accent)" />
          </div>
          <h2 className="modal-title mt-3">
            {mode === "signup" && "Create your account"}
            {mode === "login" && "Welcome back"}
            {mode === "verify" && "Verify your email"}
          </h2>
          <p className="modal-subtitle mt-1 mb-0">
            {mode === "verify"
              ? `We sent a 6-digit code to ${verifyingEmail}. Enter it to finish.`
              : signupReason ||
                "Hedge-fund-grade research memos and fair-value checks — free to start, no card required."}
          </p>
        </div>

        {/* SIGN UP */}
        {mode === "signup" && (
          <form onSubmit={onSignup}>
            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email</label>
              <div className="auth-input-wrap">
                <Mail size={15} className="auth-input-icon" />
                <input id="auth-email" type="email" className="form-input auth-input" placeholder="you@email.com"
                  value={email} autoFocus autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="auth-pw">Password</label>
              <div className="auth-input-wrap">
                <Lock size={15} className="auth-input-icon" />
                <input id="auth-pw" type="password" className="form-input auth-input" placeholder="At least 8 characters"
                  value={password} autoComplete="new-password"
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }} />
              </div>
              <div className="form-hint">8+ characters, with a letter and a number.</div>
            </div>
            {error && <div className="form-hint auth-error">{error}</div>}
            <button type="submit" className="btn-save w-full justify-center" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Creating…" : "Create account →"}
            </button>
            <p className="auth-switch">
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(null); }}>Log in</button>
            </p>
          </form>
        )}

        {/* LOG IN */}
        {mode === "login" && (
          <form onSubmit={onLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <Mail size={15} className="auth-input-icon" />
                <input id="login-email" type="email" className="form-input auth-input" placeholder="you@email.com"
                  value={email} autoFocus autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-pw">Password</label>
              <div className="auth-input-wrap">
                <Lock size={15} className="auth-input-icon" />
                <input id="login-pw" type="password" className="form-input auth-input" placeholder="Your password"
                  value={password} autoComplete="current-password"
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }} />
              </div>
            </div>
            {error && <div className="form-hint auth-error">{error}</div>}
            <button type="submit" className="btn-save w-full justify-center" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Signing in…" : "Log in →"}
            </button>
            <p className="auth-switch">
              New here?{" "}
              <button type="button" onClick={() => { setMode("signup"); setError(null); }}>Create an account</button>
            </p>
          </form>
        )}

        {/* VERIFY */}
        {mode === "verify" && (
          <form onSubmit={onVerify}>
            {demoCode && (
              <div className="auth-demo-code">
                Demo mode — no email service wired yet. Your code is <b>{demoCode}</b>.
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="verify-code">Verification code</label>
              <input id="verify-code" inputMode="numeric" maxLength={6} className="form-input auth-code-input"
                placeholder="••••••" value={code} autoFocus
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); if (error) setError(null); }} />
            </div>
            {error && <div className="form-hint auth-error">{error}</div>}
            <button type="submit" className="btn-save w-full justify-center" style={{ width: "100%" }} disabled={code.length < 6}>
              Verify &amp; continue →
            </button>
            <p className="auth-switch">
              Didn&apos;t get it?{" "}
              <button type="button" onClick={onResend}>Resend code</button>
              {" · "}
              <button type="button" onClick={() => { setMode(hasAccounts ? "login" : "signup"); setError(null); }}>
                <ArrowLeft size={11} style={{ display: "inline", verticalAlign: "middle" }} /> Back
              </button>
            </p>
          </form>
        )}

        <p className="modal-subtitle mt-3 mb-0" style={{ textAlign: "center", fontSize: ".7rem" }}>
          By continuing you agree this is a research &amp; educational tool — not
          investment advice.
        </p>
      </div>
    </div>
  );
}
