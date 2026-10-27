"use client";
import Link from "next/link";
import {startTransition,useActionState,useCallback,useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {FormFeedback} from "@/components/ui/feedback";
import {localToday} from "@/lib/calendar/dates";
import {runAction} from "@/lib/shared/client-actions";
import {taskReason,type GuidanceData,type GuidanceState} from "@/lib/dashboard/guidance";
import {StartGuidedFocus} from "./focus-timer";
import {loadGuidance} from "./guidance-actions";
export function GuidanceContent({data,date,selected,onChoose}:{data:GuidanceData;date:string;selected:number;onChoose:()=>void}){
 const task=data.tasks[selected]??data.tasks[0];
 return <>
 <dl className="guidance-counts"><div><dt>Overdue tasks</dt><dd>{data.overdue}</dd></div><div><dt>Due today</dt><dd>{data.today}</dd></div><div><dt>Events today</dt><dd>{data.events_today}</dd></div></dl>
 <div className="guidance-columns"><div className="guidance-focus">
 {task?<><p className="muted">A place to start</p><h3><Link href={"/tasks?task="+task.id}>{task.title}</Link></h3><p className="guidance-reason">{taskReason(task,date)}</p>
 {task.space_id&&task.space_title&&<Link className="text-link" href={"/spaces?space="+task.space_id}>{task.space_title}</Link>}
 <div className="guidance-controls"><Link className="text-link" href={"/tasks?task="+task.id}>Open task →</Link><StartGuidedFocus/>{data.tasks.length>1&&<Button variant="text" onClick={onChoose}>Show another</Button>}</div>
 <p className="muted">A suggestion, not a new deadline. Choose what works for you.</p></>:<><h3>No open tasks right now.</h3><Link className="text-link" href="/tasks">Capture a task →</Link></>}
 </div><div className="guidance-events"><h3>Coming up</h3><p className="muted">Your next three saved all-day events</p>
 {data.events.length?<ul>{data.events.map(event=><li key={event.id}><time dateTime={event.event_date}>{event.event_date===date?"Today":event.event_date}</time><Link href={"/calendar?date="+event.event_date}>{event.title}</Link></li>)}</ul>:<p className="muted">No saved upcoming events.</p>}
 <Link className="text-link" href="/calendar">Open calendar →</Link></div></div>
 {data.unplanned>0&&<p className="guidance-organize"><Link href="/tasks">{data.unplanned} capture{data.unplanned===1?"":"s"} with no date or priority</Link> · Organize when useful; these are not automatically urgent.</p>}
 <p className="muted">For {date}, using your local day. Tasks rank by overdue, today, high priority, then upcoming dates; ties use date, priority and capture order. Up to three task options from all {data.open} open tasks.</p>
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
 <div className="guidance-heading"><h2>Your next step</h2><Button variant="text" disabled={pending} onClick={refresh}>Refresh guidance</Button></div>
 <FormFeedback error={state.error} pending={pending} pendingLabel="Checking your saved plans..."/>
 {!state.data&&!state.error&&!pending&&<p role="status">Opening your next steps...</p>}
 {state.data&&state.date&&<GuidanceContent data={state.data} date={state.date} selected={selected} onChoose={()=>setSelected(index=>(index+1)%state.data!.tasks.length)}/>}
 </section>;
}
