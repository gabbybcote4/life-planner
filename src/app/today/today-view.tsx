"use client";
import {startTransition,useActionState,useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {DeskIcon} from "@/components/ui/desk-icon";
import {localToday} from "@/lib/calendar/dates";
import {runAction} from "@/lib/shared/client-actions";
import {EditDialog} from "@/components/ui/edit-dialog";
import {EventForm} from "@/app/calendar/calendar-events";
import {TaskList} from "@/app/tasks/task-board";
import {HabitCard} from "@/app/habits/habits-view";
import {TODAY_PAGE_SIZE,type TodayState,type TodayOffsets} from "@/lib/today/types";
import {loadToday} from "./actions";
function same(a:TodayOffsets|undefined,b:TodayOffsets){return a?.tasks===b.tasks&&a?.habits===b.habits&&a?.events===b.events;}
function Pages({label,offset,total,onChange}:{label:string;offset:number;total:number;onChange:(n:number)=>void}){
 if(total<=TODAY_PAGE_SIZE&&offset===0)return null;
 return <nav className="today-pages" aria-label={label+" pages"}><Button variant="text" disabled={!offset} onClick={()=>onChange(Math.max(0,offset-TODAY_PAGE_SIZE))}>← Previous</Button><span>{Math.min(offset+1,total)}–{Math.min(offset+TODAY_PAGE_SIZE,total)} / {total}</span><Button variant="text" disabled={offset+TODAY_PAGE_SIZE>=total||offset>=999980} onClick={()=>onChange(offset+TODAY_PAGE_SIZE)}>Next →</Button></nav>;
}
export function TodayView(){
 const [day,setDay]=useState(""),[offsets,setOffsets]=useState<TodayOffsets>({tasks:0,habits:0,events:0}),[version,setVersion]=useState(0);
 const [state,load,pending]=useActionState<TodayState,void>(async(previous)=>{
  const form=new FormData();form.set("day",day);for(const[k,v]of Object.entries(offsets))form.set(k,String(v));
  const result=await runAction(()=>loadToday(form),{day,offsets,error:"Today could not be refreshed. Your saved records are unchanged."});
  return result.error&&previous.day===day&&same(previous.offsets,offsets)?{...result,data:previous.data}:result;
 },{});
 useEffect(()=>{startTransition(()=>setDay(localToday()));},[]);
 useEffect(()=>{
  function update(){if(document.visibilityState!=="visible")return;const next=localToday();if(next!==day){setDay(next);setOffsets({tasks:0,habits:0,events:0});}else setVersion(v=>v+1);}
  function midnight(){const next=localToday();if(next!==day){setDay(next);setOffsets({tasks:0,habits:0,events:0});}}
  document.addEventListener("visibilitychange",update);const timer=window.setInterval(midnight,60000);return()=>{document.removeEventListener("visibilitychange",update);window.clearInterval(timer);};
 },[day]);
 useEffect(()=>{if(day)startTransition(()=>load());},[day,offsets,version,load]);
 const current=state.day===day&&same(state.offsets,offsets),data=current?state.data:undefined,refresh=()=>setVersion(v=>v+1);
 const change=(kind:keyof TodayOffsets)=>(n:number)=>setOffsets(o=>({...o,[kind]:n}));
 return <section className="today-view" aria-label="Your connected day">
 <div className="today-toolbar"><span>{day&&<time dateTime={day}>{new Intl.DateTimeFormat("en-US",{weekday:"long",month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(day+"T12:00:00Z"))}</time>} <span className="muted">Local day</span></span><Button variant="secondary" disabled={!day||pending} onClick={refresh}>↻ Refresh Today</Button></div>
 {(!day||!current)&&<p role="status">Opening your day…</p>}
 {current&&state.error&&<p role="alert" className="form-error">{state.error}{data&&" Showing previous results; refresh before further changes."}</p>}
 {pending&&data&&<p role="status">Refreshing your day…</p>}
 {data&&<>
 <nav className="today-counts" aria-label="Jump to daily sections"><a href="#today-tasks"><DeskIcon name="tasks"/><strong>{data.counts.tasks}</strong><span>Tasks due</span>{data.counts.overdue>0&&<small>{data.counts.overdue} overdue</small>}</a><a href="#today-habits"><DeskIcon name="habits"/><strong>{data.counts.habits}</strong><span>Habits</span><small>{data.counts.habits_done} checked</small></a><a href="#today-events"><DeskIcon name="calendar"/><strong>{data.counts.events}</strong><span>All-day events</span></a></nav>
 <div className="today-columns">
 <section className="today-section" id="today-tasks" aria-labelledby="today-tasks-heading"><header><h2 id="today-tasks-heading">Tasks</h2><Link href="/tasks">All tasks →</Link></header><p className="today-section-label">Due today + overdue</p>
 {data.tasks.length?<TaskList tasks={data.tasks} onChanged={refresh} day={day}/>:<p className="muted">{data.counts.tasks?"No tasks on this page. Choose Previous.":"No tasks due today."}</p>}
 <Pages label="Task" offset={offsets.tasks} total={data.counts.tasks} onChange={change("tasks")}/>
 </section>
 <section className="today-section" id="today-habits" aria-labelledby="today-habits-heading"><header><h2 id="today-habits-heading">Habits</h2><Link href="/habits">All habits →</Link></header><p className="today-section-label">Scheduled + checked today</p>
 <div className="today-habits">{data.habits.map(h=><HabitCard key={h.id+day} habit={h} day={day} onSaved={refresh}/>)}</div>
 {!data.habits.length&&<p className="muted">{data.counts.habits?"No habits on this page. Choose Previous.":"No habits scheduled today."}</p>}
 <Pages label="Habit" offset={offsets.habits} total={data.counts.habits} onChange={change("habits")}/>
 </section>
 <section className="today-section" id="today-events" aria-labelledby="today-events-heading"><header><h2 id="today-events-heading">Calendar</h2><Link href={"/calendar?date="+day}>Open day →</Link></header><p className="today-section-label">All-day · no times assigned</p>
 {data.events.length?<ul className="today-events">{data.events.map(e=><li key={e.id}><DeskIcon name="calendar"/><Link href={"/calendar?date="+e.event_date}>{e.title}</Link><span>All-day</span><EditDialog title={"Edit event: "+e.title}>{close=><EventForm event={e} selectedDate={day} onSaved={refresh} onCancel={close}/>}</EditDialog></li>)}</ul>:<p className="muted">{data.counts.events?"No events on this page. Choose Previous.":"Nothing on the calendar today."}</p>}
 <Pages label="Calendar" offset={offsets.events} total={data.counts.events} onChange={change("events")}/>
 </section></div>
 <footer className="today-footer"><Link href="/tasks">Undated tasks <strong>{data.counts.undated}</strong> →</Link><details><summary>What appears here?</summary><ul><li>Open tasks with a saved due date today or earlier.</li><li>Habits scheduled for today, plus today’s recorded check-ins.</li><li>Weekly habits count target-met days using their recorded targets; weeks start Monday.</li><li>Calendar items with today’s date; all-day only.</li><li>Five items per section/page. Counts include all matching owned records.</li><li>Undated work stays unscheduled; no deadlines or duplicate records are created.</li></ul></details></footer>
 </>}
 </section>;
}