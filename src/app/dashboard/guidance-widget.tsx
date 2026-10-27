"use client";
import Link from "next/link";
import {startTransition,useActionState,useCallback,useEffect,useRef,useState} from "react";
import {DeskIcon} from "@/components/ui/desk-icon";
import {Button} from "@/components/ui/button";
import {FormFeedback} from "@/components/ui/feedback";
import {localToday} from "@/lib/calendar/dates";
import {runAction} from "@/lib/shared/client-actions";
import {taskCue,shortGuidanceDate,taskReason,type GuidanceData,type GuidanceState} from "@/lib/dashboard/guidance";
import {StartGuidedFocus} from "./focus-timer";
import {loadGuidance} from "./guidance-actions";
export function GuidanceContent({data,date,selected,onChoose}:{data:GuidanceData;date:string;selected:number;onChoose:()=>void}){
 const task=data.tasks[selected]??data.tasks[0],cue=task?taskCue(task,date):null;
 return <>
 <dl className="guidance-counts">
  <div data-tone={data.overdue?"overdue":"quiet"}><dt><span aria-hidden="true" className="guidance-count-icon">!</span>Overdue</dt><dd>{data.overdue}</dd></div>
  <div data-tone="today"><dt><DeskIcon name="tasks"/>Due today</dt><dd>{data.today}</dd></div>
  <div data-tone="events"><dt><DeskIcon name="calendar"/>Events today</dt><dd>{data.events_today}</dd></div>
 </dl>
 <div className="guidance-columns"><div className="guidance-focus" data-cue={cue?.kind??"empty"}>
 {task&&cue?<>
  <div className="guidance-card-top"><span className="guidance-kicker">Next up</span><span className="guidance-cue" data-cue={cue.kind}>{cue.label}</span></div>
  <h3><Link href={"/tasks?task="+task.id}>{task.title}</Link></h3>
  <div className="guidance-meta">
   {task.priority!=="none"&&cue.kind!=="priority"&&<span className="guidance-priority-tag">{task.priority==="high"?"High":task.priority==="medium"?"Medium":"Low"} priority</span>}
   {task.due_date&&<span className="guidance-date" title={task.due_date}><DeskIcon name="calendar"/><time dateTime={task.due_date}>{shortGuidanceDate(task.due_date,date)}</time></span>}
   {task.space_id&&task.space_title&&<Link href={"/spaces?space="+task.space_id}><DeskIcon name="spaces"/>{task.space_title}</Link>}
  </div>
  <div className="guidance-controls"><Link className="primary-button guidance-open-task" href={"/tasks?task="+task.id}>Open task <span aria-hidden="true">→</span></Link><StartGuidedFocus/>{data.tasks.length>1&&<Button variant="text" onClick={onChoose}>Show another</Button>}</div>
  <details className="guidance-why"><summary>Why this?</summary><p>{taskReason(task,date)}</p><p className="muted">A suggestion, not a new deadline.</p></details>
 </>:<div className="guidance-empty"><span aria-hidden="true">✓</span><h3>No open tasks</h3><Link className="text-link" href="/tasks">+ Capture a task</Link></div>}
 </div><div className="guidance-events"><div className="guidance-events-heading"><h3>Next events</h3><span className="guidance-small-tag">All-day</span></div>
 {data.events.length?<ul>{data.events.map(event=><li key={event.id}><time className="guidance-event-date" dateTime={event.event_date} title={event.event_date}>{shortGuidanceDate(event.event_date,date)}</time><Link href={"/calendar?date="+event.event_date}>{event.title}</Link></li>)}</ul>:<p className="muted">Nothing scheduled</p>}
 <Link className="text-link" href="/calendar">Calendar →</Link></div></div>
 <div className="guidance-footer">
  {data.unplanned>0&&<Link className="guidance-inbox" href="/tasks"><DeskIcon name="notes"/><span>Unplanned</span><strong>{data.unplanned}</strong><span aria-hidden="true">→</span></Link>}
  <span className="guidance-local-day"><time dateTime={date} title={date}>{new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"))}</time> · Local day</span>
 </div>
 <details className="guidance-logic"><summary>How suggestions work</summary><ul><li>Overdue → Today → High priority → Upcoming</li><li>Then other planned work, then oldest unplanned captures.</li><li>From all {data.open} open tasks · up to 3 options.</li><li>No date/priority does not mean urgent.</li><li>Ties: date → priority → capture order.</li><li>Up to 3 saved all-day events.</li></ul></details>
 </>;
}
export function GuidanceWidget({refreshKey}:{refreshKey:string}){
 const [selected,setSelected]=useState(0),requestedDay=useRef("");
 const [state,action,pending]=useActionState<GuidanceState,FormData>(async(previous,form)=>{
  const result=await runAction(()=>loadGuidance(previous,form),{error:"Guidance could not be reached. Refresh when connected."});
  if(result.data)setSelected(0);return result;
 },{});
 const refresh=useCallback(()=>{
  const today=localToday();requestedDay.current=today;
  const form=new FormData();form.set("today",today);startTransition(()=>action(form));
 },[action]);
 useEffect(()=>{refresh();},[refresh,refreshKey]);
 useEffect(()=>{
  const checkDay=()=>{if(document.visibilityState==="visible"&&localToday()!==requestedDay.current)refresh();};
  document.addEventListener("visibilitychange",checkDay);const interval=window.setInterval(checkDay,60000);
  return ()=>{document.removeEventListener("visibilitychange",checkDay);window.clearInterval(interval);};
 },[refresh]);
 return <section className="dashboard-guidance" aria-label="Your next step" aria-busy={pending}>
 <div className="guidance-heading"><h2>Your next step</h2><Button variant="text" disabled={pending} onClick={refresh} aria-label="Refresh guidance"><span aria-hidden="true">↻</span> Refresh</Button></div>
 <FormFeedback error={state.error} pending={pending} pendingLabel="Checking your saved plans..."/>
 {!state.data&&!state.error&&!pending&&<p role="status">Opening your next steps...</p>}
 {state.data&&state.date&&<GuidanceContent data={state.data} date={state.date} selected={selected} onChoose={()=>setSelected(index=>(index+1)%state.data!.tasks.length)}/>}
 </section>;
}
