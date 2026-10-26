import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { TaskBoard } from "./task-board";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";

async function Planner() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { supabase, userId, email } = await requireAccount();

  const { data: tasks, error: tasksError } = await supabase.from("tasks")
    .select("id,title,completed,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(201);

  return <>
    <PlannerHeading eyebrow="Your own little corner" title="One thing at a time." description="Your saved tasks, ready whenever you are." email={email} />
    {tasksError ? <LoadError title="Your tasks could not be loaded." description="Refresh to try again. Your saved tasks have not been changed." action="/tasks" /> : <TaskBoard key={userId} tasks={(tasks ?? []).slice(0, 200)} hasMore={(tasks?.length ?? 0) > 200} />}
  </>;
}

export default function TasksPage() {
  return <PlannerPage active="tasks" loading="Loading your saved tasks...">
    <Planner />
  </PlannerPage>;
}
