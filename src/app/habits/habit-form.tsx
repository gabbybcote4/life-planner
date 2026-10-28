"use client";
import {useActionState,useId,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {TextInput,Select} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {SpacePicker} from "@/app/components/space-picker";
import {createRequestId} from "@/lib/shared/request-id";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import {HABIT_PRESETS,WEEKDAYS,type Habit,type HabitState} from "@/lib/habits/types";
import type {SpaceChoice} from "@/lib/inbox/types";
import {saveHabit} from "./actions";
export function HabitForm({habit,today,onSaved}:{habit?:Habit;today:string;onSaved:()=>void}){
 const field=useId(),id=useRef(habit?.id??null);
 const [title,setTitle]=useState(habit?.title??""),[kind,setKind]=useState(habit?.kind??"check"),[target,setTarget]=useState(String(habit?.target??1)),[unit,setUnit]=useState(habit?.unit??"done"),[schedule,setSchedule]=useState(habit?.schedule??"daily"),[days,setDays]=useState(habit?.weekdays??[1,2,3,4,5]),[goal,setGoal]=useState(habit?.weekly_goal??3),[paused,setPaused]=useState(habit?.paused??false),[revision,setRevision]=useState(habit?.revision??0),[space,setSpace]=useState<SpaceChoice|null>(habit?.space_id?{id:habit.space_id,title:habit.space_title??"Space"}:null);
 const [state,action,pending]=useActionState<HabitState,FormData>(async(previous,data)=>{
  const result=await runAction(async()=>{id.current??=createRequestId();data.set("id",id.current);return saveHabit(previous,data);},UNCONFIRMED_SAVE);
  if(!result.error&&result.revision){setRevision(result.revision);onSaved();}return result;
 },{});
 return <div className="habit-form-panel">
 {!habit&&<div className="habit-presets" aria-label="Habit presets">{HABIT_PRESETS.map(p=><Button key={p.title} variant="secondary" disabled={pending||revision>0} onClick={()=>{setTitle(p.title);setKind(p.kind);setTarget(String(p.target));setUnit(p.unit);}}>{p.title}</Button>)}</div>}
 <SpacePicker choice={space} onChange={setSpace} disabled={pending||(!habit&&revision>0)}/>
 <form action={action} className="habit-form" aria-busy={pending}>
 <input type="hidden" name="revision" value={revision}/><input type="hidden" name="space_id" value={space?.id??""}/><input type="hidden" name="start_date" value={habit?.start_date??today}/><input type="hidden" name="paused" value={String(paused)}/>
 <fieldset disabled={pending||(!habit&&revision>0)}>
 <label htmlFor={field+"-title"}>Habit</label><TextInput id={field+"-title"} name="title" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={200} placeholder="Choose a preset or name your habit"/>
 <label htmlFor={field+"-kind"}>Track</label><Select id={field+"-kind"} name="kind" value={kind} onChange={e=>{setKind(e.target.value as "check"|"amount");if(e.target.value==="amount"&&unit==="done")setUnit("minutes");}}><option value="check">Done / not done</option><option value="amount">Count or amount</option></Select>
 {kind==="amount"?<><label htmlFor={field+"-target"}>Daily target</label><TextInput id={field+"-target"} name="target" type="number" min="0.01" max="1000000" step="0.01" required value={target} onChange={e=>setTarget(e.target.value)}/><label htmlFor={field+"-unit"}>Unit</label><TextInput id={field+"-unit"} name="unit" value={unit} onChange={e=>setUnit(e.target.value)} required maxLength={30} list={field+"-units"}/><datalist id={field+"-units"}>{["minutes","glasses","pages","steps","sessions","km"].map(u=><option key={u} value={u}/>)}</datalist></>:<><input type="hidden" name="target" value="1"/><input type="hidden" name="unit" value="done"/></>}
 <label htmlFor={field+"-schedule"}>Repeat</label><Select id={field+"-schedule"} name="schedule" value={schedule} onChange={e=>setSchedule(e.target.value as Habit["schedule"])}><option value="daily">Every day</option><option value="weekdays">Choose weekdays</option><option value="weekly">A number of days per week</option></Select>
 <div className="habit-weekdays" hidden={schedule!=="weekdays"}>{WEEKDAYS.map((d,i)=><label key={d}><input type="checkbox" name="weekdays" value={i} checked={days.includes(i)} onChange={e=>setDays(e.target.checked?[...days,i]:days.filter(x=>x!==i))}/>{d}</label>)}</div>
 <label htmlFor={field+"-goal"} hidden={schedule!=="weekly"}>Days per week</label><Select id={field+"-goal"} name="weekly_goal" value={goal} hidden={schedule!=="weekly"} onChange={e=>setGoal(Number(e.target.value))}>{[1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n} days</option>)}</Select>
 {habit&&<label className="habit-pause"><input type="checkbox" checked={paused} onChange={e=>setPaused(e.target.checked)}/>Pause habit</label>}
 <Button variant="primary" type="submit" disabled={!title.trim()||!today||(schedule==="weekdays"&&!days.length)} pending={pending}>{habit?"Save habit":"Add habit"}</Button>
 </fieldset><FormFeedback error={state.error} message={revision>0?state.message:undefined}/>
 </form>{!habit&&revision>0&&<><p className="muted">Saved. Close this popup or add another.</p><Button variant="secondary" onClick={()=>{id.current=null;setRevision(0);setTitle("");setKind("check");setTarget("1");setUnit("done");setSchedule("daily");setDays([1,2,3,4,5]);setGoal(3);setPaused(false);}}>Add another habit</Button></>}
 </div>;
}