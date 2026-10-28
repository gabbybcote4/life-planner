"use client";
import {startTransition,useActionState,useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {TextInput} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {EditDialog} from "@/components/ui/edit-dialog";
import {localToday} from "@/lib/calendar/dates";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import {isHabitDue,scheduleLabel,type Habit,type HabitState,type HabitDayState} from "@/lib/habits/types";
import {checkHabit,loadHabitDay} from "./actions";
import {HabitForm} from "./habit-form";
function HabitCheckin({habit,day,onSaved}:{habit:Habit;day:string;onSaved:()=>void}){
 const [amount,setAmount]=useState(String(habit.log?.amount??0)),[revision,setRevision]=useState(habit.log?.revision??0);
 const kind=habit.log?.kind??habit.kind,target=habit.log?.target??habit.target,unit=habit.log?.unit??habit.unit;
 const [state,action,pending]=useActionState<HabitState,FormData>(async(previous,data)=>{
  const result=await runAction(()=>checkHabit(previous,data),UNCONFIRMED_SAVE);
  if(!result.error&&result.revision){setRevision(result.revision);onSaved();}return result;
 },{});
 const done=(habit.log?.amount??0)>=target,canLog=Boolean(habit.log)||(!habit.paused&&day>=habit.start_date);
 return <form action={action} className="habit-checkin" aria-busy={pending}>
 <input type="hidden" name="id" value={habit.id}/><input type="hidden" name="day" value={day}/><input type="hidden" name="revision" value={revision}/><input type="hidden" name="habit_revision" value={habit.revision}/>
 <p className="habit-progress">{habit.log?.amount??0} / {target} {unit} <span>{done?"✓ Done":""}</span></p>
 {kind==="check"?<><input type="hidden" name="amount" value={done?0:1}/><Button type="submit" variant={done?"secondary":"primary"} disabled={pending||!canLog} aria-label={(done?"Undo check-in: ":"Check in: ")+habit.title}>{done?"✓ Done · undo":"○ Check in"}</Button></>:<><label htmlFor={"amount-"+habit.id}>Amount for {habit.title}</label><div className="habit-amount"><Button aria-label={"Decrease "+habit.title} disabled={pending||!canLog} onClick={()=>setAmount(String(Math.max(0,Math.round((Number(amount||0)-1)*100)/100)))}>−</Button><TextInput id={"amount-"+habit.id} name="amount" type="number" step="0.01" min="0" max="1000000" required value={amount} onChange={e=>setAmount(e.target.value)} readOnly={pending||!canLog}/><Button aria-label={"Increase "+habit.title} disabled={pending||!canLog} onClick={()=>setAmount(String(Math.min(1000000,Math.round((Number(amount||0)+1)*100)/100)))}>+</Button><Button type="submit" variant="primary" disabled={pending||!canLog}>Save</Button></div></>}
 <FormFeedback {...state} pending={pending}/>{habit.log&&<span className="muted">Target when recorded</span>}
 </form>;
}
export function HabitsView({compact=false}:{compact?:boolean}){
 const [today,setToday]=useState(""),[day,setDay]=useState(""),[offset,setOffset]=useState(0),[version,setVersion]=useState(0),[created,setCreated]=useState(0);
 const [state,load,pending]=useActionState(async(previous:HabitDayState)=>{
  const f=new FormData();f.set("day",compact?today:day);f.set("offset",String(compact?0:offset));const result=await runAction(()=>loadHabitDay(f),{error:"Habits could not be loaded.",day:compact?today:day,offset:compact?0:offset});return result.error&&previous.day===result.day&&previous.offset===result.offset?{...result,items:previous.items,total:previous.total}:result;
 },{} as Awaited<ReturnType<typeof loadHabitDay>>);
 useEffect(()=>{startTransition(()=>{const local=localToday();setToday(local);setDay(local);});},[]);
 useEffect(()=>{function updateDay(){const local=localToday();if(local!==today){setToday(local);if(compact)setDay(local);}}document.addEventListener("visibilitychange",updateDay);const timer=window.setInterval(updateDay,60000);return()=>{document.removeEventListener("visibilitychange",updateDay);window.clearInterval(timer);};},[today,compact]);
 useEffect(()=>{if(today&&day)startTransition(()=>load());},[today,day,offset,version,load]);
 const selected=compact?today:day,current=state.day===selected&&state.offset===(compact?0:offset);
 const refresh=()=>setVersion(v=>v+1);
 const items=current?(state.items??[]):[],visible=compact?items.filter(h=>isHabitDue(h,selected)||Boolean(h.log)).slice(0,5):items;
 return <section className="habits-view" aria-label={compact?"Today's habits":"Your habits"}>
 <div className="habits-toolbar"><h2>{compact?"Today's habits":"Habits"}</h2>{compact?<Link className="text-link" href="/habits">All habits →</Link>:<EditDialog title="Add a habit" triggerLabel="＋ Add habit" disabled={!today} closeAfterSave={created}><HabitForm key={created} today={today} onSaved={()=>{refresh();setCreated(value=>value+1);}}/></EditDialog>}<Button variant="text" onClick={refresh} disabled={pending||!today}>↻ Refresh</Button></div>
 {!compact&&<label className="habit-day">Check-ins for <TextInput type="date" min="1900-01-01" max={today||"2100-12-31"} value={day} onChange={e=>{setDay(e.target.value);setOffset(0);}}/> <span className="muted">Local day · weeks start Monday</span></label>}
 {!today||!current?<p role="status">Opening your habits…</p>:<>
 {state.error&&<p role="alert" className="form-error">{state.error} {state.items?"Previous results remain below; refresh before making further changes.":""}</p>}{pending&&<p role="status">Refreshing habits…</p>}{!state.error&&!visible.length&&<p className="muted">{compact?"No habits due in this preview.":"Choose the pencil to add a habit from a preset."}</p>}
 <div className="habit-grid">{visible.map(h=><article key={h.id+selected} className="habit-card">
 <header><h3>{h.title}</h3>{!compact&&<EditDialog title={"Edit habit: "+h.title}><HabitForm habit={h} today={today} onSaved={refresh}/></EditDialog>}</header>
 <div className="habit-labels"><span>{h.paused?"Paused":isHabitDue(h,selected)?"Due":"Not due"}</span><span>{scheduleLabel(h)}</span>{h.schedule==="weekly"&&<span>{h.week_done} / {h.weekly_goal} days this week</span>}{h.space_id&&<Link href={"/spaces?space="+h.space_id}>{h.space_title??"Space"}</Link>}</div>
 <HabitCheckin habit={h} day={selected} onSaved={refresh}/>
 </article>)}</div>
 {!compact&&state.total!==undefined&&<nav className="notes-pagination" aria-label="Habit pages"><Button variant="text" disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-20))}>Previous</Button><span>{state.total??0} habits</span><Button variant="text" disabled={offset+20>=(state.total??0)} onClick={()=>setOffset(offset+20)}>Next</Button></nav>}
 {compact&&state.items&&<p className="muted">Up to 5 due/logged habits from your first 20. Open All habits for the full list.</p>}
 </>}
 {!compact&&<details className="habit-help"><summary>How check-ins work</summary><ul><li>Presets are editable starting points; adjust targets to your routine.</li><li>Binary habits use one tap. Amount changes save with Save.</li><li>Weekly targets count days that met their recorded daily target.</li><li>Choose a date to view or correct history. New entries use the current target; existing entries keep their original target and unit.</li><li>Schedule changes affect current suggestions; they do not rewrite saved check-ins. Pause keeps history.</li><li>No automatic tasks, reminders, streak penalties or AI suggestions are added.</li></ul></details>}
 </section>;
}