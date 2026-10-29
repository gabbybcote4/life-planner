import { MonthView } from "./month-view";
import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { monthRange, parseCalendarDate } from "@/lib/calendar/dates";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";
import { CalendarStart } from "./calendar-today";
import { CalendarEvents } from "./calendar-events";
import {TASK_SELECT,type Task} from "@/lib/tasks/types";
import {TaskList} from "@/app/tasks/task-board";
import {validCalendarRepeats,type CalendarRepeat} from "@/lib/calendar/repeats";
import {formatTaskTime} from "@/lib/tasks/time";
import Link from "next/link";

type CalendarSearch = Promise<{ date?: string | string[] }>;

async function CalendarContent({ searchParams }: { searchParams: CalendarSearch }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { supabase, userId, email } = await requireAccount();
  const params = await searchParams;
  const selectedDate = parseCalendarDate(params.date);
  if (!selectedDate) return <CalendarStart />;
  const range = monthRange(selectedDate);
  const { data: events, error, count } = await supabase.from("calendar_events")
    .select("id,title,event_date", { count: "exact" }).eq("user_id", userId)
    .gte("event_date", range.start).lt("event_date", range.end)
    .order("event_date").order("created_at").order("id").limit(1000);
  const tooMany = count !== null && count > (events?.length ?? 0);
  const taskRead=await supabase.from("tasks").select(TASK_SELECT,{count:"exact"}).eq("user_id",userId)
    .gte("due_date",range.start).lt("due_date",range.end).order("due_date").order("due_time",{nullsFirst:true}).order("created_at").order("id").limit(1000);
  const tasks=(taskRead.data??[]) as unknown as Task[];
  const taskOverflow=taskRead.count!==null&&taskRead.count>tasks.length;
  const dayTasks=tasks.filter(task=>task.due_date===selectedDate);
  const repeatRead=await supabase.rpc("planner_calendar_repeats",{p_start:range.start});
  const repeatReady=!repeatRead.error&&validCalendarRepeats(repeatRead.data,range.start);
  const repeats:CalendarRepeat[]=repeatReady?repeatRead.data:[];
  const dayRepeats=repeats.filter(repeat=>repeat.due_date===selectedDate);

  return <>
    <PlannerHeading eyebrow="Make time for what matters" title="Your days, thoughtfully planned." description="Tasks · due dates · all-day events" email={email} />
    {error || tooMany || taskRead.error || taskOverflow || !repeatReady ? <LoadError title="Your calendar could not be loaded completely." description={!repeatReady?"Repeat previews could not be loaded. Check calendar repeat setup or retry; your saved records are unchanged.":tooMany||taskOverflow ? "This month exceeds the 1,000-task or 1,000-event display limit. Your saved records are unchanged." : "Try again. Your saved tasks and events have not been changed."} action="/calendar" params={{ date: selectedDate }} /> : <div className="calendar-layout">
      <MonthView selectedDate={selectedDate} events={events ?? []} tasks={tasks} repeats={repeats}/>
      <div><section className="calendar-agenda" aria-label="Tasks due on the selected date"><h2>Tasks · {dayTasks.length}</h2>
        <p className="muted">Saved due dates · check to complete · pencil to edit</p>
        {dayTasks.length?<TaskList key={userId+selectedDate} tasks={dayTasks.slice(0,200)}/>:<p className="muted">No tasks due on this date.</p>}
        {dayTasks.length>200&&<p className="muted">Showing 200 of {dayTasks.length} tasks for this day.</p>}
        {!!dayRepeats.length&&<><h3>Planned repeats · {dayRepeats.length}</h3><ul className="calendar-event-list">{dayRepeats.map(repeat=><li key={repeat.source_id+repeat.due_date} className="calendar-event calendar-repeat-preview"><span>↻ {repeat.due_time?formatTaskTime(repeat.due_time)+" · ":""}{repeat.title}</span> <Link className="text-link" href={"/tasks?task="+repeat.source_id}>Edit repeat →</Link></li>)}</ul></>}
        <p className="muted">↻ Planned repeats show ahead. Complete the current task to save its next occurrence.</p>
      </section>
      <CalendarEvents key={`${userId}:${selectedDate}`} selectedDate={selectedDate}
        events={(events ?? []).filter((event) => event.event_date === selectedDate)} /></div>
    </div>}
  </>;
}

export default function CalendarPage({ searchParams }: { searchParams: CalendarSearch }) {
  return <PlannerPage active="calendar" loading="Loading your calendar...">
    <CalendarContent searchParams={searchParams} />
  </PlannerPage>;
}
