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
    supabase.from("tasks").select("id,title,completed,created_at").eq("user_id", userId)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(5),
    supabase.from("dashboard_layouts").select("layout,revision").eq("user_id", userId).maybeSingle(),
  ]);
  const loadFailed = open.error || completed.error || recent.error || open.count === null || completed.count === null;
  const parsedLayout = savedLayout.data ? parseLayout(savedLayout.data.layout) : DEFAULT_LAYOUT;
  const layoutFailed = Boolean(savedLayout.error || !parsedLayout);

  return <>
    <PlannerHeading eyebrow="A little clarity, a little breathing room" title="Your life, one small step at a time." description="A simple overview of what’s on your list and how far you’ve come." email={email} className="dashboard-intro" />
    {loadFailed ? <LoadError title="Your dashboard could not be loaded." description="Refresh to try again. Your saved tasks have not been changed." action="/" /> : <>
      {layoutFailed && <div className="form-error" role="alert">Your layout settings could not be loaded. You can still use the dashboard; reload before customizing.
        <form action="/" method="get"><Button variant="text" type="submit">Reload layout settings</Button></form></div>}
      <TaskWidgets key={userId} open={open.count ?? 0} completed={completed.count ?? 0} tasks={recent.data ?? []}
        layout={parsedLayout ?? DEFAULT_LAYOUT} revision={savedLayout.data?.revision ?? 0} canCustomize={!layoutFailed} />
    </>}
  </>;
}

export default function Home() {
  return <PlannerPage active="dashboard" loading="Opening your dashboard and loading your tasks...">
    <Dashboard />
  </PlannerPage>;
}
