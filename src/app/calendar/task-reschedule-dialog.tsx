"use client";
import {useActionState,useId,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {EditDialog} from "@/components/ui/edit-dialog";
import {Button} from "@/components/ui/button";
import {TextInput} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {usePlanning} from "@/app/components/planning-preferences";
import {createRequestId} from "@/lib/shared/request-id";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import type {MoveProposal,MoveState} from "@/lib/calendar/reschedule";
import {rescheduleTask} from "./reschedule-actions";

export function TaskRescheduleDialog({proposal,onClose}:{proposal:MoveProposal;onClose:()=>void}){
 const [saved,setSaved]=useState(0),router=useRouter();
 return <EditDialog title={"Move task: "+proposal.source.title} hintText="Review the date and time, then save the move." autoOpen hideTrigger onClose={onClose} closeAfterSave={saved}>{close=><MoveForm proposal={proposal} onCancel={close} onSaved={date=>{setSaved(n=>n+1);router.push("/calendar?date="+date+"&view=week");router.refresh();}}/>}</EditDialog>;
}
export function MoveForm({proposal,onCancel,onSaved}:{proposal:MoveProposal;onCancel:()=>void;onSaved:(date:string)=>void}){
 const field=useId(),{source}=proposal,[date,setDate]=useState(proposal.date),[time,setTime]=useState(proposal.time),[zone,setZone]=useState(proposal.timezone),[scope,setScope]=useState("one"),request=useRef<string|null>(null),{show_task_timezones}=usePlanning();
 const changed=date!==source.date||time!==(source.time??"");
 const [state,action,pending]=useActionState<MoveState,FormData>(async(previous,form)=>{
  const result=await runAction(async()=>{request.current??=createRequestId();form.set("request_id",request.current);return rescheduleTask(previous,form);},UNCONFIRMED_SAVE);
  if(!result.error&&result.id)onSaved(date);
  return result;
 },{});
 return <form action={action} aria-busy={pending} className="task-move-form">
  <input type="hidden" name="source_id" value={source.id}/><input type="hidden" name="revision" value={source.revision}/><input type="hidden" name="index" value={source.index}/><input type="hidden" name="scheduled_date" value={source.scheduledDate}/><input type="hidden" name="timezone" value={time?zone:""}/>
  <fieldset disabled={pending}><legend>New date & time</legend><label htmlFor={field+"-date"}>Move to</label><TextInput id={field+"-date"} name="date" type="date" min="1900-01-01" max="2100-12-31" required value={date} onChange={e=>setDate(e.target.value)}/>
   <label htmlFor={field+"-time"}>Time · blank is all-day</label><TextInput id={field+"-time"} name="time" type="time" step={60} value={time} onChange={e=>{setTime(e.target.value);if(e.target.value&&!zone)setZone(source.timezone??Intl.DateTimeFormat().resolvedOptions().timeZone??"UTC");}}/>
   {time&&show_task_timezones&&<p className="muted">{zone}</p>}
   <Button variant="text" onClick={()=>setTime("")}>Make all-day</Button>
   {source.repeating?<fieldset className="move-scope"><legend>Apply to</legend><label><input type="radio" name="scope" value="one" checked={scope==="one"} onChange={()=>setScope("one")}/> This occurrence</label><label><input type="radio" name="scope" value="future" checked={scope==="future"} onChange={()=>setScope("future")}/> This and future occurrences</label><p className="muted">Completed history stays saved.</p>{scope==="future"&&<details><summary>Previously moved tasks</summary><p className="muted">Individually moved tasks and already split series stay separate.</p></details>}</fieldset>:<input type="hidden" name="scope" value="one"/>}
   <div className="form-actions"><Button type="submit" variant="primary" pending={pending} pendingLabel="Moving..." disabled={!changed||!date}>Save move</Button><Button onClick={onCancel}>Cancel</Button></div>
  </fieldset><FormFeedback {...state}/>
 </form>;
}
