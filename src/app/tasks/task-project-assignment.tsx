"use client";
import {startTransition,useActionState,useId,useState} from "react";
import {Button} from "@/components/ui/button";
import {TextInput} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {runAction} from "@/lib/shared/client-actions";
import {PROJECT_STATUSES} from "@/lib/projects/types";
import type {TaskProjectChoices} from "@/lib/projects/task-projects";
import {ProjectLinkControl} from "@/app/projects/project-item-picker";
import {loadTaskProjects} from "@/app/projects/task-project-actions";
export function TaskProjectAssignment({taskId,onChanged}:{taskId:string;onChanged?:()=>void}){
 const field=useId(),[query,setQuery]=useState("");
 const [state,load,pending]=useActionState<TaskProjectChoices,FormData>((previous,form)=>runAction(()=>loadTaskProjects(form),{task_id:taskId,query:query.trim(),offset:0,items:[],more:false,error:"Projects could not be loaded."}),{task_id:taskId,query:"",offset:0,items:[],more:false});
 const [opened,setOpened]=useState(false);const current=state.query===query.trim();
 function refresh(offset=0){const form=new FormData();form.set("task",taskId);form.set("query",query);form.set("offset",String(offset));startTransition(()=>load(form));}
 return <details className="task-project-assignment" onToggle={e=>{if(e.currentTarget.open&&!opened){setOpened(true);refresh();}}}><summary>Projects</summary>
 <form action={load} aria-busy={pending}><input type="hidden" name="task" value={taskId}/><label htmlFor={field}>Choose an existing project</label><TextInput id={field} name="query" type="search" maxLength={100} value={query} readOnly={pending} onChange={e=>setQuery(e.target.value)} placeholder="All projects, or find a name"/><Button type="submit" variant="secondary" name="offset" value="0" pending={pending}>Find / refresh</Button></form>
 <FormFeedback error={state.error} pending={pending} pendingLabel="Finding your projects…"/>
 {opened&&current&&!state.error&&<><ul className="task-project-choices">{state.items.map(p=><li key={p.project_id+p.revision}><span>{p.title}<small>{PROJECT_STATUSES[p.status]} · {p.active?"Linked":p.revision?"Previously unlinked":"Available"}</small></span><ProjectLinkControl project={p.project_id} kind="task" target={taskId} active={!p.active} revision={p.revision} onSaved={()=>{refresh(state.offset);onChanged?.();}}/></li>)}</ul>{!pending&&!state.items.length&&<p className="muted">No matching projects. Create one in Projects, then refresh here.</p>}<nav className="notes-pagination" aria-label="Task project pages">{state.offset>0&&<Button variant="text" disabled={pending} onClick={()=>refresh(state.offset-20)}>Previous</Button>}{state.more&&<Button variant="text" disabled={pending} onClick={()=>refresh(state.offset+20)}>Next</Button>}</nav></>}
 <p className="muted">This changes the connection only. Task details and Space stay as they are.</p>
 </details>;
}