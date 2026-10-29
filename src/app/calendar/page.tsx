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
import {WeekView} from "./week-view";
import {calendarWeekRange,calendarRangeMonths} from "@/lib/calendar/week";

type CalendarSearch = Promise<{ date?: string | string[];view?:string|string[] }>;

async function CalendarContent({ searchParams }: { searchParams: CalendarSearch }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { supabase, userId, email } = await requireAccount();
  const params = await searchParams;
  const view=params.view==="week"?"week":"month";
  const selectedDate = parseCalendarDate(params.date);
  if (!selectedDate) return <CalendarStart view={view}/>;
  const planningRead=view==="week"?await supabase.from("planner_preferences").select("week_start").eq("user_id",userId).maybeSingle():null;
  const weekStart=planningRead?.data?.week_start==="monday"?"monday":"sunday";
  const range=view==="week"?calendarWeekRange(selectedDate,weekStart):monthRange(selectedDate);
  const months=calendarRangeMonths(range.start,range.end);
  const [eventRead,taskRead,repeatReads]=await Promise.all([supabase.from("calendar_events")
    .select("id,title,event_date", { count: "exact" }).eq("user_id", userId)
    .gte("event_date", range.start).lt("event_date", range.end)
    .order("event_date").order("created_at").order("id").limit(1000),
    supabase.from("tasks").select(TASK_SELECT,{count:"exact"}).eq("user_id",userId)
    .gte("due_date",range.start).lt("due_date",range.end).order("due_date").order("due_time",{nullsFirst:true}).order("created_at").order("id").limit(1000),
    Promise.all(months.map(month=>supabase.rpc("planner_calendar_repeats",{p_start:month})))]);
  const {data:events,error,count}=eventRead;
  const tooMany = count !== null && count > (events?.length ?? 0);
  const tasks=(taskRead.data??[]) as unknown as Task[];
  const taskOverflow=taskRead.count!==null&&taskRead.count>tasks.length;
  const dayTasks=tasks.filter(task=>task.due_date===selectedDate);
  const repeatReady=repeatReads.every((read,index)=>!read.error&&validCalendarRepeats(read.data,months[index]));
  const repeats:CalendarRepeat[]=repeatReady?repeatReads.flatMap(read=>read.data as CalendarRepeat[]).filter(repeat=>repeat.due_date>=range.start&&repeat.due_date<range.end):[];
  const dayRepeats=repeats.filter(repeat=>repeat.due_date===selectedDate);

  return <>
    <PlannerHeading eyebrow="Make time for what matters" title="Your days, thoughtfully planned." description="Tasks · due dates · all-day events" email={email} />
    <nav className="calendar-view-switch" aria-label="Calendar view"><Link href={"/calendar?date="+selectedDate} aria-current={view==="month"?"page":undefined}>Month</Link><Link href={"/calendar?date="+selectedDate+"&view=week"} aria-current={view==="week"?"page":undefined}>Week</Link></nav>
    {error || tooMany || taskRead.error || taskOverflow || !repeatReady || planningRead?.error ? <LoadError title="Your calendar could not be loaded completely." description={planningRead?.error?"Your calendar week preference could not be loaded. Try again.":!repeatReady?"Repeat previews could not be loaded. Check calendar repeat setup or retry; your saved records are unchanged.":tooMany||taskOverflow ? "This view exceeds the 1,000-task or 1,000-event display limit. Your saved records are unchanged." : "Try again. Your saved tasks and events have not been changed."} action="/calendar" params={{ date: selectedDate,...(view==="week"?{view:"week"}:{}) }} /> : <div className="calendar-layout" data-view={view}>
      {view==="week"?<WeekView selectedDate={selectedDate} weekStart={weekStart} tasks={tasks} events={events??[]} repeats={repeats}/>:<MonthView selectedDate={selectedDate} events={events ?? []} tasks={tasks} repeats={repeats}/>}
      <div className="calendar-selected-day"><section className="calendar-agenda" aria-label="Tasks due on the selected date"><h2>Tasks · {dayTasks.length}</h2>
        <p className="muted">Saved due dates · check to complete · pencil to edit</p>
        {dayTasks.length?<TaskList key={userId+selectedDate} tasks={dayTasks.slice(0,200)}/>:<p className="muted">No tasks due on this date.</p>}
        {dayTasks.length>200&&<p className="muted">Showing 200 of {dayTasks.length} tasks for this day.</p>}
        {!!dayRepeats.length&&<><h3>Planned repeats · {dayRepeats.length}</h3><ul className="calendar-event-list">{dayRepeats.map(repeat=><li key={repeat.source_id+repeat.due_date} className="calendar-event calendar-repeat-preview"><span>↻ {repeat.due_time?formatTaskTime(repeat.due_time)+" · ":""}{repeat.title}</span> <Link className="text-link" href={"/tasks?task="+repeat.source_id}>Edit repeat →</Link></li>)}</ul></>}
        <p className="muted">↻ Planned repeats show ahead. Complete the current task to save its next occurrence.</p>
      </section>
      <CalendarEvents key={`${userId}:${selectedDate}`} selectedDate={selectedDate} view={view}
        events={(events ?? []).filter((event) => event.event_date === selectedDate)} /></div>
    </div>}
  </>;
}

export default function CalendarPage({ searchParams }: { searchParams: CalendarSearch }) {
  return <PlannerPage active="calendar" loading="Loading your calendar...">
    <CalendarContent searchParams={searchParams} />
  </PlannerPage>;
}
