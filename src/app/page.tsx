import Link from "next/link";
import {Suspense} from "react";
import {DashboardGuidance,DashboardSpaces,DashboardConnections,DashboardUpcoming} from "./dashboard/workspace-data";
import {TASK_SELECT,type Task} from "@/lib/tasks/types";
import { Button } from "@/components/ui/button";
import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_LAYOUT, parseLayout } from "@/lib/dashboard/layout";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";
import { TaskWidgets } from "./dashboard/task-widgets";

async function Dashboard() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { supabase, userId, email } = await requireAccount();

  const [open, completed, recent, savedLayout] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("completed", false),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
    supabase.from("tasks").select(TASK_SELECT).eq("user_id", userId)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(3),
    supabase.from("dashboard_layouts").select("layout,revision").eq("user_id", userId).maybeSingle(),
  ]);
  const loadFailed = open.error || completed.error || recent.error || open.count === null || completed.count === null;
  const parsedLayout = savedLayout.data ? parseLayout(savedLayout.data.layout) : DEFAULT_LAYOUT;
  const layoutFailed = Boolean(savedLayout.error || !parsedLayout);

  return <>
    <PlannerHeading eyebrow="A little clarity, a little breathing room" title="A little room for your day." description="Plan · focus · capture · make it yours." email={email} className="dashboard-intro" />
    <p className="today-shortcut"><Link className="primary-button" href="/today">Open Today →</Link></p>
    {loadFailed ? <LoadError title="Your dashboard could not be loaded." description="Refresh to try again. Your saved tasks have not been changed." action="/" /> : <>
      {layoutFailed && <div className="form-error" role="alert">Your layout settings could not be loaded. You can still use the dashboard; reload before customizing.
        <form action="/" method="get"><Button variant="text" type="submit">Reload layout settings</Button></form></div>}


      <TaskWidgets key={userId} open={open.count ?? 0} completed={completed.count ?? 0} tasks={(recent.data ?? []) as unknown as Task[]}
        layout={parsedLayout ?? DEFAULT_LAYOUT} revision={savedLayout.data?.revision ?? 0} canCustomize={!layoutFailed} workspaceSlots={{guidance:<Suspense fallback={<p role="status">Checking your plans...</p>}><DashboardGuidance/></Suspense>,spaces:<Suspense fallback={<p role="status">Opening your spaces...</p>}><DashboardSpaces/></Suspense>,calendar:<Suspense fallback={<p role="status">Loading your calendar...</p>}><DashboardUpcoming/></Suspense>,connections:<Suspense fallback={<p role="status">Drawing saved links...</p>}><DashboardConnections/></Suspense>}} />
    </>}
  </>;
}

export default function Home() {
  return <PlannerPage active="dashboard" loading="Opening your dashboard and loading your tasks...">
    <Dashboard />
  </PlannerPage>;
}
