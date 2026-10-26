"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "./actions";

type Mode = "signin" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  return <EmailForm key={mode} mode={mode} onModeChange={setMode} />;
}

function EmailForm({ mode, onModeChange }: { mode: Mode; onModeChange: (mode: Mode) => void }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {});
  return <form action={action} className="auth-form">
    <div className="auth-switch" aria-label="Account options">
      <button type="button" disabled={pending} aria-pressed={mode === "signin"} onClick={() => onModeChange("signin")}>Sign in</button>
      <button type="button" disabled={pending} aria-pressed={mode === "signup"} onClick={() => onModeChange("signup")}>Create account</button>
    </div>
    <input type="hidden" name="mode" value={mode} />
    <label htmlFor="email">Email address</label>
    <input id="email" name="email" type="email" autoComplete="email" maxLength={254}
      required readOnly={pending} placeholder="you@example.com" />
    <label htmlFor="password">Password</label>
    <input id="password" name="password" type="password"
      autoComplete={mode === "signup" ? "new-password" : "current-password"}
      minLength={mode === "signup" ? 8 : undefined} maxLength={128} required readOnly={pending}
      aria-describedby={mode === "signup" ? "password-help" : undefined} />
    {mode === "signup" && <p id="password-help" className="muted">Use at least 8 characters.</p>}
    <div aria-live="polite" aria-atomic="true">
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.message && <p className="form-message">{state.message}</p>}
    </div>
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Please wait..." : mode === "signup" ? "Create my account" : "Sign in"}
    </button>
  </form>;
}
