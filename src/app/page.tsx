import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SignOutButton } from "./sign-out-button";
import { TaskBoard } from "./tasks/task-board";

async function Planner() {
  if (!isSupabaseConfigured()) return <p className="form-message">Your planner is being set up. Sign-in will be available soon.</p>;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");

  const { data: tasks, error: tasksError } = await supabase.from("tasks")
    .select("id,title,completed,created_at")
    .eq("user_id", data.claims.sub)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(201);

  return <>
    <div className="planner-intro">
      <div>
        <p className="eyebrow">Your own little corner</p>
        <h1>Make space for today.</h1>
        <p className="intro">A place for the things on your mind, one small step at a time.</p>
      </div>
      <div className="planner-account">
        <p className="muted">{String(data.claims.email ?? "Your account")}</p>
        <SignOutButton />
      </div>
    </div>
    {tasksError ? <section className="task-load-error" aria-labelledby="task-error-heading">
      <h2 id="task-error-heading">Your tasks couldn’t be loaded.</h2>
      <p className="muted">Refresh to try again. Your saved tasks have not been changed.</p>
      <form action="/" method="get"><button className="secondary-button" type="submit">Try again</button></form>
    </section> : <TaskBoard key={data.claims.sub} tasks={(tasks ?? []).slice(0, 200)} hasMore={(tasks?.length ?? 0) > 200} />}
  </>;
}

export default function Home() {
  return <main className="planner-shell">
    <section className="paper-card planner-card" aria-label="Your Life Planner">
      <p className="brand">Life Planner</p>
      <Suspense fallback={<p role="status">Opening your planner and loading your tasks...</p>}><Planner /></Suspense>
    </section>
  </main>;
}

