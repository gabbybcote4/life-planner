import {TASK_SELECT,type Task} from "@/lib/tasks/types";
import Link from "next/link";
import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadSelectedTask } from "@/lib/tasks/selected-task";
import { TaskBoard, TaskList } from "./task-board";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";

type TaskSearch = Promise<{task?:string|string[]}>;
async function Planner({searchParams}:{searchParams:TaskSearch}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { supabase, userId, email } = await requireAccount();
  const params=await searchParams;
  if(params.task!==undefined) {
    const selected=await loadSelectedTask(supabase,userId,params.task);
    return <>
      <PlannerHeading eyebrow="One thing at a time" title="Your selected task." description="Edit or complete this task, or return to your task list." email={email}/>
      <Link className="text-link" href="/tasks">Show all tasks</Link>
      {selected.error||!selected.task ? <LoadError title="This task is unavailable." description="Open a task from your list or search again." action="/tasks"/> : <TaskList key={userId+selected.task.id} tasks={[selected.task]}/>}
    </>;
  }
  const { data: tasks, error: tasksError } = await supabase.from("tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(201);
  return <>
    <PlannerHeading eyebrow="Your own little corner" title="One thing at a time." description="Your saved tasks, ready whenever you are." email={email} />
    {tasksError ? <LoadError title="Your tasks could not be loaded." description="Refresh to try again. Your saved tasks have not been changed." action="/tasks" /> : <TaskBoard key={userId} tasks={((tasks ?? []) as unknown as Task[]).slice(0, 200)} hasMore={(tasks?.length ?? 0) > 200} />}
  </>;
}
export default function TasksPage({searchParams}:{searchParams:TaskSearch}) {
  return <PlannerPage active="tasks" loading="Loading your saved tasks..."><Planner searchParams={searchParams}/></PlannerPage>;
}
