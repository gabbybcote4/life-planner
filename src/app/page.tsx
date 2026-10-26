import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Task } from "@/lib/tasks/types";
import { SignOutButton } from "./sign-out-button";
import { AddTaskForm, TaskList } from "./tasks/task-board";
import { PlannerNavigation } from "./components/planner-navigation";

async function Dashboard() {
  if (!isSupabaseConfigured()) return <p className="form-message">Your planner is being set up. Sign-in will be available soon.</p>;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  const userId = data.claims.sub;

  // Count every owned task, not just the rows displayed in the recent-task panel.
  // Each request uses the current session and is also protected by database RLS.
  const [open, completed, recent] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("completed", false),
    supabase.from("tasks").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("completed", true),
    supabase.from("tasks").select("id,title,completed,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false })
      .order("id", { ascending: false }).limit(5),
  ]);
  const loadFailed = open.error || completed.error || recent.error || open.count === null || completed.count === null;

  return <>
    <div className="planner-intro dashboard-intro">
      <div>
        <p className="eyebrow">A little clarity, a little breathing room</p>
        <h1>Your life, one small step at a time.</h1>
        <p className="intro">A simple overview of what’s on your list and how far you’ve come.</p>
      </div>
      <div className="planner-account">
        <p className="muted">{String(data.claims.email ?? "Your account")}</p>
        <SignOutButton />
      </div>
    </div>
    {loadFailed ? <section className="task-load-error" aria-labelledby="dashboard-error-heading">
      <h2 id="dashboard-error-heading">Your dashboard couldn’t be loaded.</h2>
      <p className="muted">Refresh to try again. Your saved tasks have not been changed.</p>
      <form action="/" method="get"><button className="secondary-button" type="submit">Try again</button></form>
    </section> : <DashboardPanels key={userId} open={open.count ?? 0} completed={completed.count ?? 0} tasks={recent.data ?? []} />}
  </>;
}

function DashboardPanels({ open, completed, tasks }: {
  open: number; completed: number; tasks: Task[];
}) {
  const total = open + completed;
  const percent = total === 0 ? 0 : Math.round(completed / total * 100);

  return <>
    <section className="overview-section" aria-labelledby="overview-heading">
      <div className="dashboard-section-heading">
        <h2 id="overview-heading">At a glance</h2>
        <p className="muted">Across all your saved tasks</p>
      </div>
      <dl className="overview-cards">
        <div className="overview-card overview-open"><dt>To do</dt><dd><span className="overview-number">{open}</span><span className="overview-note">Room for your next step</span></dd></div>
        <div className="overview-card overview-completed"><dt>Completed</dt><dd><span className="overview-number">{completed}</span><span className="overview-note">Small wins add up</span></dd></div>
        <div className="overview-card"><dt>Total tasks</dt><dd><span className="overview-number">{total}</span><span className="overview-note">Your list, all in one place</span></dd></div>
      </dl>
      <p className="visually-hidden" role="status">{open} tasks to do, {completed} completed, {total} total.</p>
    </section>
    <div className="dashboard-grid">
      <section className="dashboard-panel dashboard-capture" aria-labelledby="capture-heading">
        <p className="eyebrow">Make a little room</p>
        <h2 id="capture-heading">Get it off your mind.</h2>
        <p className="muted panel-intro">Capture a task here. It will be waiting in your list.</p>
        <AddTaskForm />
      </section>
      <section className="dashboard-panel dashboard-progress" aria-labelledby="progress-heading">
        <p className="eyebrow">Every step counts</p>
        <h2 id="progress-heading">Your progress</h2>
        {total === 0 ? <p className="muted panel-intro">Your first task is a lovely place to start. Your progress will appear here.</p> : <>
          <p className="progress-value">{percent}<span>% complete</span></p>
          <progress value={completed} max={total} aria-label={`${completed} of ${total} saved tasks completed`} />
          <p className="muted panel-intro">{open === 0 ? "All caught up. Take a moment to enjoy it." : `${completed} of ${total} tasks completed. Keep going at your own pace.`}</p>
        </>}
      </section>
    </div>
    <section className="dashboard-recent" aria-labelledby="recent-heading">
      <div className="dashboard-section-heading">
        <div><p className="eyebrow">Pick up where you left off</p><h2 id="recent-heading">Recently added</h2></div>
        <Link className="text-link" href="/tasks">View all tasks <span aria-hidden="true">→</span></Link>
      </div>
      {tasks.length === 0 ? <div className="task-empty">
        <p className="empty-title">Your list starts here.</p>
        <p className="muted">Add a task above and it will appear in this space.</p>
      </div> : <TaskList tasks={tasks} />}
    </section>
  </>;
}

export default function Home() {
  return <main className="planner-shell">
    <section className="paper-card dashboard-card" aria-label="Your Life Planner dashboard">
      <PlannerNavigation active="dashboard" />
      <Suspense fallback={<p role="status">Opening your dashboard and loading your tasks...</p>}><Dashboard /></Suspense>
    </section>
  </main>;
}
