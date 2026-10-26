"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

export async function authenticate(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const mode = formData.get("mode");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "Enter a valid email address." };
  }
  if (mode !== "signin" && mode !== "signup") return { error: "Choose sign in or create account." };
  if (!password || password.length > 128) return { error: "Enter a password of up to 128 characters." };
  if (mode === "signup" && password.length < 8) return { error: "Choose a password with at least 8 characters." };

  try {
    const supabase = await createClient();
    if (mode === "signup") {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteUrl) return { error: "Account creation needs the app URL configured." };
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: new URL("/auth/callback", siteUrl).toString() },
      });
      if (error) return { error: "We couldn't create the account. Check your details and try again later." };
      if (!data.session) return { message: "Check your email for a confirmation link, then return here to sign in. If you already have an account, use Sign in." };
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: "Sign-in failed. Check your email and password, confirm your email if needed, and try again." };
    }
  } catch {
    return { error: "We couldn't reach the sign-in service. Please try again." };
  }
  redirect("/");
}

export async function signOut(): Promise<AuthState> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "Sign-out failed. Please try again." };
  } catch {
    return { error: "We couldn't sign you out. Please try again." };
  }
  redirect("/login");
}
