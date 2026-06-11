"use client";

import { useEffect, useState } from "react";
import { useAppStore, useUserStore } from "@/lib/store";
import { trackLead, track } from "@/lib/analytics";
import { Activity } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email capture = the Meta "Lead" event and the entry point of the free tier.
// No password / backend — this is the validation-MVP signup.
export default function SignupModal() {
  const { isSignupOpen, signupReason, closeSignup, afterAuth } = useAppStore();
  const signup = useUserStore((s) => s.signup);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignupOpen) {
      setEmail("");
      setError(null);
    }
  }, [isSignupOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError("Enter a valid email address.");
      return;
    }
    signup(clean);
    trackLead(signupReason || "signup_modal");
    track("CompleteRegistration");
    const resume = afterAuth;
    closeSignup();
    // Resume the gated action the user was attempting (e.g. generate report).
    if (resume) setTimeout(resume, 0);
  };

  return (
    <div className={`modal-overlay ${isSignupOpen ? "open" : ""}`} onClick={closeSignup}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center mb-4">
          <div className="welcome-icon" style={{ width: 56, height: 56, borderRadius: 14 }}>
            <Activity size={26} color="var(--accent)" />
          </div>
          <h2 className="modal-title mt-3">Create your free account</h2>
          <p className="modal-subtitle mt-1 mb-0">
            {signupReason
              ? signupReason
              : "Get your first hedge-fund-grade research memo and fair-value checks — free, no card required."}
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              style={{ fontFamily: "Inter, sans-serif" }}
              placeholder="you@email.com"
              value={email}
              autoFocus
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
            />
            {error && (
              <div className="form-hint" style={{ color: "var(--red)" }}>
                {error}
              </div>
            )}
          </div>

          <button type="submit" className="btn-save w-full justify-center" style={{ width: "100%" }}>
            Start free →
          </button>

          <p className="modal-subtitle mt-3 mb-0" style={{ textAlign: "center", fontSize: ".7rem" }}>
            By continuing you agree this is a research & educational tool — not
            investment advice. We&apos;ll email occasional product tips; unsubscribe anytime.
          </p>
        </form>
      </div>
    </div>
  );
}
