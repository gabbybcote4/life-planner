"use client";
import {useActionState,useState} from "react";
import {Button} from "@/components/ui/button";
import {FormFeedback} from "@/components/ui/feedback";
import {SpacePicker} from "@/app/components/space-picker";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import type {Task,TaskActionState} from "@/lib/tasks/types";
import type {SpaceChoice} from "@/lib/inbox/types";
import {assignTaskSpace} from "./space-actions";
export function TaskSpaceAssignment({task,disabled}:{task:Task;disabled:boolean}){
 const [choice,setChoice]=useState<SpaceChoice|null>(task.space_id?{id:task.space_id,title:task.space?.title??"Space"}:null),[baseline,setBaseline]=useState(task.space_id??"");
 const [state,save,pending]=useActionState<TaskActionState,FormData>(async(previous,data)=>{
  const result=await runAction(()=>assignTaskSpace(previous,data),UNCONFIRMED_SAVE);
  if(!result.error)setBaseline(choice?.id??"");return result;
 },{});
 const busy=disabled||pending;
 return <details className="task-space-assignment"><summary>{task.space_id?"Change task space":"Assign a space"}</summary>
 <SpacePicker choice={choice} onChange={setChoice} disabled={busy}/>
 <form action={save} className="space-form" aria-busy={pending}><input type="hidden" name="id" value={task.id}/><input type="hidden" name="previous_space_id" value={baseline}/><input type="hidden" name="space_id" value={choice?.id??""}/>
 <p>Chosen space: {choice?.title??"No space"}</p><Button type="submit" variant="primary" disabled={busy} pending={pending} pendingLabel="Saving...">Save space assignment</Button><FormFeedback {...state}/></form></details>;
}
