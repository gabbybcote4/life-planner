import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_THEME, parseTheme } from "@/lib/themes/themes";
import { PlannerNavigation } from "../components/planner-navigation";
import { SignOutButton } from "../sign-out-button";
import { ThemePicker } from "./theme-picker";

async function SettingsContent() {
  if (!isSupabaseConfigured()) return <p className="form-message">Your planner is being set up. Sign-in will be available soon.</p>;
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) redirect("/login");
  const { data, error } = await supabase.from("planner_preferences").select("theme")
    .eq("user_id", auth.claims.sub).maybeSingle();
  return <>
    <div className="planner-intro"><div><p className="eyebrow">Make yourself at home</p><h1>A planner that feels like you.</h1>
      <p className="intro">Choose the colours you want to spend your day with.</p></div>
      <div className="planner-account"><p className="muted">{String(auth.claims.email ?? "Your account")}</p><SignOutButton /></div>
    </div>
    {error ? <section className="task-load-error"><h2>Your settings couldn’t be loaded.</h2>
      <p className="muted">The planner will use Sage until your saved settings can be loaded.</p>
      <form action="/settings" method="get"><button className="secondary-button" type="submit">Try again</button></form></section> :
      <ThemePicker key={auth.claims.sub} savedTheme={parseTheme(data?.theme) ?? DEFAULT_THEME} />}
  </>;
}

export default function SettingsPage() {
  return <main className="planner-shell"><section className="paper-card settings-card" aria-label="Your Life Planner settings">
    <PlannerNavigation active="settings" />
    <Suspense fallback={<p role="status">Loading your settings...</p>}><SettingsContent /></Suspense>
  </section></main>;
}
