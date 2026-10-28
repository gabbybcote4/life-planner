"use client";
import {useActionState,useId,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {EditDialog} from "@/components/ui/edit-dialog";
import {Button} from "@/components/ui/button";
import {TextInput,TextArea,Select} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {SpacePicker} from "@/app/components/space-picker";
import {createRequestId} from "@/lib/shared/request-id";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import {PROJECT_STATUSES,type Project,type ProjectState} from "@/lib/projects/types";
import type {SpaceChoice} from "@/lib/inbox/types";
import {saveProject} from "./actions";
function ProjectForm({project,onSaved}:{project?:Project;onSaved:(result:ProjectState)=>void}){
 const field=useId(),id=useRef<string|null>(project?.id??null);
 const [title,setTitle]=useState(project?.title??""),[description,setDescription]=useState(project?.description??""),[status,setStatus]=useState(project?.status??"active"),[revision,setRevision]=useState(project?.revision??0),[space,setSpace]=useState<SpaceChoice|null>(project?.space_id?{id:project.space_id,title:project.space_title??"Space"}:null);
 const [state,action,pending]=useActionState<ProjectState,FormData>(async(previous,data)=>{const result=await runAction(async()=>{id.current??=createRequestId();data.set("id",id.current);return saveProject(previous,data);},UNCONFIRMED_SAVE);if(!result.error&&result.id&&result.revision){setRevision(result.revision);onSaved(result);}return result;},{});
 return <div>{!project&&<div className="project-presets">{["Home project","Work project","Study project"].map(label=><Button key={label} variant="secondary" disabled={pending} onClick={()=>setTitle(label)}>{label}</Button>)}</div>}<SpacePicker choice={space} onChange={setSpace} disabled={pending}/>
 <form action={action} className="project-form" aria-busy={pending}><input type="hidden" name="revision" value={revision}/><input type="hidden" name="space_id" value={space?.id??""}/><fieldset disabled={pending}>
 <label htmlFor={field+"-title"}>Project name</label><TextInput id={field+"-title"} name="title" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={200}/>
 <label htmlFor={field+"-status"}>Status</label><Select id={field+"-status"} name="status" value={status} onChange={e=>setStatus(e.target.value as Project["status"])}>{Object.entries(PROJECT_STATUSES).map(([v,label])=><option key={v} value={v}>{label}</option>)}</Select>
 <label htmlFor={field+"-description"}>Short note (optional)</label><TextArea id={field+"-description"} name="description" value={description} onChange={e=>setDescription(e.target.value)} maxLength={500} rows={3}/>
 <Button type="submit" variant="primary" disabled={!title.trim()} pending={pending}>{project?"Save project":"Add project"}</Button></fieldset><FormFeedback {...state}/></form></div>;
}
export function ProjectEditor({project}:{project?:Project}){
 const router=useRouter(),[created,setCreated]=useState(0);
 return <EditDialog title={project?"Edit project: "+project.title:"Add a project"} triggerLabel={project?undefined:"＋ Add project"} closeAfterSave={project?undefined:created}><ProjectForm key={project?.id??created} project={project} onSaved={result=>{if(!project&&result.id){setCreated(v=>v+1);router.push("/projects?project="+result.id);}router.refresh();}}/></EditDialog>;
}
export function ProjectRefreshButton(){const router=useRouter();return <Button variant="text" onClick={()=>router.refresh()}>↻ Refresh</Button>;} 
