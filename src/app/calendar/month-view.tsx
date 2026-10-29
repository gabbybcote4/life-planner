"use client";
import {usePlanning} from "@/app/components/planning-preferences";
import {calendarWeekdays} from "@/lib/calendar/preferences";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCalendarDate, monthCells, shiftMonth } from "@/lib/calendar/dates";
import { CalendarTodayButton } from "./calendar-today";
import type {Task} from "@/lib/tasks/types";
import {formatTaskTime} from "@/lib/tasks/time";
import type {CalendarRepeat} from "@/lib/calendar/repeats";

export function MonthView({ selectedDate, events,tasks=[],repeats=[] }: { selectedDate: string; events: { event_date: string }[];tasks?:Task[];repeats?:CalendarRepeat[] }) {
  const {week_start,show_task_timezones}=usePlanning();
  const previous = shiftMonth(selectedDate, -1);
  const next = shiftMonth(selectedDate, 1);
  const cells = monthCells(selectedDate,week_start);
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.event_date, (counts.get(event.event_date) ?? 0) + 1);
  const taskDays=new Map<string,Task[]>();
  for(const task of tasks)if(task.due_date)taskDays.set(task.due_date,[...(taskDays.get(task.due_date)??[]),task]);
  const repeatDays=new Map<string,CalendarRepeat[]>();
  for(const repeat of repeats)repeatDays.set(repeat.due_date,[...(repeatDays.get(repeat.due_date)??[]),repeat]);
  const weekdays = calendarWeekdays(week_start);
  const monthName=(date:string)=>new Intl.DateTimeFormat("en-US",{month:"short",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"));

  return <section className="calendar-month" aria-labelledby="calendar-month-heading">
    <div className="calendar-toolbar">
      <h2 id="calendar-month-heading">{formatCalendarDate(selectedDate, true)}</h2>
      <div className="calendar-month-controls">
        {previous ? <Link href={`/calendar?date=${previous}`} className="calendar-arrow" aria-label="Previous month">← {monthName(previous)}</Link> : <Button className="calendar-arrow" disabled aria-label="Previous month">←</Button>}
        <CalendarTodayButton />
        {next ? <Link href={`/calendar?date=${next}`} className="calendar-arrow" aria-label="Next month">{monthName(next)} →</Link> : <Button className="calendar-arrow" disabled aria-label="Next month">→</Button>}
      </div>
    </div>
    <p className="calendar-month-summary">This month · {tasks.length} saved tasks · {repeats.length} planned repeats</p>
    <table className="calendar-table">
      <caption className="visually-hidden">{formatCalendarDate(selectedDate, true)}. Select a date to view or add events.</caption>
      <thead><tr>{weekdays.map((day) => <th key={day} scope="col"><abbr title={day}>{day.slice(0, 3)}</abbr></th>)}</tr></thead>
      <tbody>{Array.from({ length: cells.length / 7 }, (_, row) => <tr key={row}>
        {cells.slice(row * 7, row * 7 + 7).map((date, column) => <td key={date ?? `blank-${column}`}>
          {date && <Link href={`/calendar?date=${date}`} className={`calendar-day${date === selectedDate ? " is-selected" : ""}`}
            aria-current={date === selectedDate ? "date" : undefined}
            aria-label={`${formatCalendarDate(date)}, ${counts.get(date) ?? 0} events, ${taskDays.get(date)?.length??0} tasks, ${repeatDays.get(date)?.length??0} planned repeats`}>
            <span className="calendar-day-number" aria-hidden="true">{Number(date.slice(-2))}</span>
            {counts.has(date)&&<span className="calendar-day-count" aria-hidden="true">{counts.get(date)} {counts.get(date)===1?"event":"events"}</span>}
            {!!taskDays.get(date)?.length&&<span className="calendar-task-count" aria-hidden="true">☐ {taskDays.get(date)!.length}</span>}
            {!!repeatDays.get(date)?.length&&<span className="calendar-task-count" aria-hidden="true">↻ {repeatDays.get(date)!.length}</span>}
            {(taskDays.get(date)??[]).slice(0,2).map(task=><span key={task.id} className="calendar-task-preview" data-completed={task.completed} title={task.title+(show_task_timezones&&task.due_timezone?" · "+task.due_timezone:"")} aria-hidden="true"><span className="calendar-entry-title">{task.completed?"✓":"☐"} {task.title}</span>{task.due_time&&<span className="calendar-entry-time">{formatTaskTime(task.due_time)}</span>}</span>)}
            {(repeatDays.get(date)??[]).slice(0,Math.max(0,2-(taskDays.get(date)?.length??0))).map(repeat=><span key={repeat.source_id+repeat.due_date} className="calendar-task-preview calendar-repeat-preview" title={repeat.title} aria-hidden="true"><span className="calendar-entry-title">↻ {repeat.title}</span>{repeat.due_time&&<span className="calendar-entry-time">{formatTaskTime(repeat.due_time)}</span>}</span>)}
          </Link>}
        </td>)}
      </tr>)}</tbody>
    </table>
    <p className="muted calendar-help">Choose a date → tasks & events. Up to two task titles per day; select a day for its list. {show_task_timezones?"Times use each task’s saved time zone.":"Times follow your task schedule."}</p>
  </section>;
}

