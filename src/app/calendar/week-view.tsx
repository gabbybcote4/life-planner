"use client";
import {useEffect,useRef} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {formatCalendarDate,type CalendarEvent} from "@/lib/calendar/dates";
import {calendarWeekdays} from "@/lib/calendar/preferences";
import {calendarWeekRange,calendarWeekEntries,shiftCalendarDays,type WeekEntry} from "@/lib/calendar/week";
import {formatTaskTime} from "@/lib/tasks/time";
import type {Task} from "@/lib/tasks/types";
import type {CalendarRepeat} from "@/lib/calendar/repeats";
import {CalendarTodayButton} from "./calendar-today";

export function WeekView({selectedDate,weekStart,tasks,events,repeats}:{selectedDate:string;weekStart:"sunday"|"monday";tasks:Task[];events:CalendarEvent[];repeats:CalendarRepeat[]}){
 const range=calendarWeekRange(selectedDate,weekStart),days=range.days,weekdays=calendarWeekdays(weekStart);
 const buckets=calendarWeekEntries(tasks,events,repeats),previous=shiftCalendarDays(selectedDate,-7),next=shiftCalendarDays(selectedDate,7),grid=useRef<HTMLDivElement>(null);
 const hours=[...buckets.values()].flat().filter(e=>e.time).map(e=>Number(e.time!.slice(0,2))),initialHour=hours.length?Math.max(0,Math.min(...hours)-1):8;
 useEffect(()=>{const box=grid.current,row=box?.querySelector<HTMLElement>('[data-hour="'+initialHour+'"]');if(box&&row){const sticky=(box.querySelector<HTMLElement>("thead")?.offsetHeight??0)+(box.querySelector<HTMLElement>(".week-all-day")?.offsetHeight??0);box.scrollTop=Math.max(0,row.offsetTop-sticky);}},[range.start,initialHour]);
 function entries(date:string|null,hour:string){if(!date)return null;const values=buckets.get(date+":"+hour)??[];return <>{values.slice(0,3).map(entry=><Link key={entry.key} href={"/calendar?date="+date+"&view=week"} className="week-entry" data-kind={entry.kind} data-completed={entry.completed} title={entry.title} aria-label={`${entry.kind==="repeat"?"Planned repeat":entry.kind}: ${entry.title}${entry.time?", "+formatTaskTime(entry.time):", all-day"}. Select day to view.`}><Entry entry={entry}/></Link>)}{values.length>3&&<Link className="text-link" href={"/calendar?date="+date+"&view=week"}>＋{values.length-3} more</Link>}</>;}
 return <section className="calendar-week" aria-label="Weekly calendar"><div className="calendar-toolbar"><h2>{formatCalendarDate(range.start)} – {formatCalendarDate(days.filter(Boolean).at(-1)!)}</h2><div className="calendar-month-controls">{previous?<Link className="calendar-arrow" aria-label="Previous week" href={"/calendar?date="+previous+"&view=week"}>←</Link>:<Button disabled aria-label="Previous week">←</Button>}<CalendarTodayButton view="week"/>{next?<Link className="calendar-arrow" aria-label="Next week" href={"/calendar?date="+next+"&view=week"}>→</Link>:<Button disabled aria-label="Next week">→</Button>}</div></div>
  <p className="muted">{tasks.length} saved tasks · {repeats.length} planned repeats · select a day to edit. Scroll for hours; swipe sideways on small screens.</p>
  <div className="week-grid-scroll" ref={grid} tabIndex={0} role="region" aria-label="Hourly week grid, scroll to other times"><table className="week-grid"><caption className="visually-hidden">All-day items and hourly task due times. Times follow saved task schedules; cards do not imply durations.</caption><thead><tr><th scope="col">Time</th>{days.map((date,i)=><th scope="col" key={date??i}>{date?<Link href={"/calendar?date="+date+"&view=week"} aria-label={formatCalendarDate(date)} aria-current={date===selectedDate?"date":undefined}>{weekdays[i].slice(0,3)} <span>{Number(date.slice(-2))}</span></Link>:weekdays[i].slice(0,3)}</th>)}</tr></thead><tbody><tr className="week-all-day"><th scope="row">All-day</th>{days.map((date,i)=><td key={date??i}>{entries(date,"all")}</td>)}</tr>{Array.from({length:24},(_,hour)=><tr key={hour} data-hour={hour}><th scope="row">{formatTaskTime(String(hour).padStart(2,"0")+":00")}</th>{days.map((date,i)=><td key={date??i} data-selected={date===selectedDate}>{entries(date,String(hour).padStart(2,"0"))}</td>)}</tr>)}</tbody></table></div>
 </section>;
}
function Entry({entry}:{entry:WeekEntry}){return <><span className="week-entry-title">{entry.kind==="repeat"?"↻ ":entry.kind==="event"?"▣ ":entry.completed?"✓ ":"☐ "}{entry.title}</span>{entry.time&&<span>{formatTaskTime(entry.time)}</span>}</>;}
