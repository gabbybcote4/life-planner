"use client";

import { FormFeedback } from "@/components/ui/feedback";
import { TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
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
      <Button type="button" disabled={pending} aria-pressed={mode === "signin"} onClick={() => onModeChange("signin")}>Sign in</Button>
      <Button type="button" disabled={pending} aria-pressed={mode === "signup"} onClick={() => onModeChange("signup")}>Create account</Button>
    </div>
    <input type="hidden" name="mode" value={mode} />
    <label htmlFor="email">Email address</label>
    <TextInput id="email" name="email" type="email" autoComplete="email" maxLength={254}
      required readOnly={pending} placeholder="you@example.com" />
    <label htmlFor="password">Password</label>
    <TextInput id="password" name="password" type="password"
      autoComplete={mode === "signup" ? "new-password" : "current-password"}
      minLength={mode === "signup" ? 8 : undefined} maxLength={128} required readOnly={pending}
      aria-describedby={mode === "signup" ? "password-help" : undefined} />
    {mode === "signup" && <p id="password-help" className="muted">Use at least 8 characters.</p>}
    <FormFeedback {...state} panel />
    <Button variant="primary" type="submit" disabled={pending}>
      {pending ? "Please wait..." : mode === "signup" ? "Create my account" : "Sign in"}
    </Button>
  </form>;
}
