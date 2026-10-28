"use client";
import {useActionState,useId,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {TextInput,Select} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {EditDialog} from "@/components/ui/edit-dialog";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import {useRecordChoices} from "@/app/components/use-record-choices";
import {PROJECT_KINDS,type ProjectKind,type ProjectState} from "@/lib/projects/types";
import {setProjectItem} from "./actions";
export function ProjectLinkControl({project,kind,target,active,revision,onSaved}:{project:string;kind:ProjectKind;target:string;active:boolean;revision:number;onSaved?:()=>void}){
 const router=useRouter();const [state,save,pending]=useActionState<ProjectState,FormData>(async(previous,data)=>{const result=await runAction(()=>setProjectItem(previous,data),UNCONFIRMED_SAVE);if(!result.error&&result.revision){router.refresh();onSaved?.();}return result;},{});
 return <form action={save} className="project-link-control" aria-busy={pending}><input type="hidden" name="project" value={project}/><input type="hidden" name="kind" value={kind}/><input type="hidden" name="target" value={target}/><input type="hidden" name="active" value={String(active)}/><input type="hidden" name="revision" value={revision}/><Button type="submit" variant="text" disabled={pending||(active&&revision===0&&Boolean(state.revision))} pending={pending}>{active?(revision?"Restore link":"Link item"):"Unlink"}</Button><FormFeedback {...state}/></form>;
}
export function ProjectItemPicker({project}:{project:string}){
 const field=useId(),[kind,setKind]=useState<ProjectKind>("task");
 const {query,setQuery,state,search,pending,load,current}=useRecordChoices(kind);
 return <EditDialog title="Link an existing item" triggerLabel="＋ Link item" onOpen={()=>load()}><form action={search} className="project-item-search" aria-busy={pending}>
 <label htmlFor={field+"-kind"}>Item type</label><Select id={field+"-kind"} name="kind" value={kind} disabled={pending} onChange={e=>{const next=e.target.value as ProjectKind;setKind(next);load(next);}}>{Object.entries(PROJECT_KINDS).map(([v,label])=><option key={v} value={v}>{label}</option>)}</Select>
 <label htmlFor={field+"-query"}>Choose an existing item</label><TextInput id={field+"-query"} name="query" type="search" placeholder="Filter items (optional)" maxLength={100} value={query} readOnly={pending} onChange={e=>setQuery(e.target.value)}/><Button type="submit" name="offset" value="0" variant="secondary" pending={pending}>Find / refresh</Button><FormFeedback error={state.error} pending={pending} pendingLabel="Loading items..."/>
 {current&&state.searched&&<nav aria-label="Item search pages">{state.offset>0&&<Button type="submit" name="offset" value={state.offset-20} disabled={pending}>Previous</Button>}{state.more&&<Button type="submit" name="offset" value={state.offset+20} disabled={pending}>Next</Button>}</nav>}</form>
 {current&&state.searched&&!state.error&&<ul className="project-picker-results">{state.items.filter(i=>i.kind===kind).map(i=><li key={i.kind+i.id}><span>{i.title}{i.space_title&&<small>{i.space_title}</small>}</span><ProjectLinkControl project={project} kind={kind} target={i.id} active revision={0}/></li>)}{!state.items.length&&<li>No matches. Use ＋ Capture to create an item, then find it here.</li>}</ul>}
 <p className="muted">Links use the original item. Unlinking keeps it saved. Previously unlinked items have a Restore link button in the project list.</p></EditDialog>;
}