import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SignOutButton } from "./sign-out-button";

async function Account() {
  if (!isSupabaseConfigured()) return <p className="form-message">Your planner is being set up. Sign-in will be available soon.</p>;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  return <>
    <div className="account-details">
      <p className="eyebrow">Your own little corner</p>
      <h1>You’re right where you need to be.</h1>
      <p className="intro">Signed in as <strong>{String(data.claims.email ?? "your account")}</strong>.</p>
      <p className="muted">Your account is ready. Tasks are the next part of your planner we’re building.</p>
    </div>
    <SignOutButton />
  </>;
}

export default function Home() {
  return <main className="planner-shell">
    <section className="paper-card" aria-label="Your Life Planner account">
      <p className="brand">Life Planner</p>
      <Suspense fallback={<p role="status">Opening your space...</p>}><Account /></Suspense>
    </section>
  </main>;
}
