"use client";
import {useActionState,useId,useState} from "react";
import {Button} from "@/components/ui/button";
import {TextInput} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import {EMPTY_SEARCH,type SearchState} from "@/lib/search/types";
import type {Task,TaskActionState} from "@/lib/tasks/types";
import {searchPlanner} from "@/app/search/actions";
import {assignTaskSpace} from "./space-actions";
export function TaskSpaceAssignment({task,disabled}:{task:Task;disabled:boolean}) {
 const field=useId(),[choice,setChoice]=useState({id:task.space_id??"",title:task.space?.title??"No space"});
 const [baseline,setBaseline]=useState(task.space_id??""),[query,setQuery]=useState("");
 const [state,save,pending]=useActionState<TaskActionState,FormData>(async(previous,data)=>{const result=await runAction(()=>assignTaskSpace(previous,data),UNCONFIRMED_SAVE);if(!result.error)setBaseline(choice.id);return result;},{});
 const [results,search,searching]=useActionState<SearchState,FormData>((previous,data)=>runAction(()=>searchPlanner(previous,data),{...EMPTY_SEARCH,error:"Space choices could not be reached. Please retry."}),EMPTY_SEARCH);
 const busy=disabled||pending||searching;
 return <details className="task-space-assignment"><summary>{task.space_id?"Change task space":"Assign a space"}</summary>
 <form action={search} className="space-form"><label htmlFor={field}>Find a space by name</label><TextInput id={field} name="query" type="search" value={query} onChange={e=>setQuery(e.target.value)} required maxLength={200} readOnly={busy}/><input type="hidden" name="kind" value="space"/>
 <Button type="submit" name="offset" value="0" variant="secondary" disabled={busy}>Find spaces</Button><FormFeedback error={results.error}/>
 {results.items.map(item=><Button key={item.id} variant="text" disabled={busy} onClick={()=>setChoice({id:item.id,title:item.title})}>{item.title}</Button>)}
 {results.searched&&!results.items.length&&!results.error&&<p className="muted">No matching spaces.</p>}
 <nav className="notes-pagination" aria-label="Space choices">{results.offset>0&&<Button type="submit" variant="text" name="offset" value={results.offset-20} disabled={busy||query.trim()!==results.query}>Previous</Button>}{results.more&&<Button type="submit" variant="text" name="offset" value={results.offset+20} disabled={busy||query.trim()!==results.query}>Next</Button>}</nav>
 </form>
 <form action={save} className="space-form" aria-busy={pending}>
 <input type="hidden" name="id" value={task.id}/><input type="hidden" name="previous_space_id" value={baseline}/><input type="hidden" name="space_id" value={choice.id}/>
 <p>Chosen space: {choice.title}</p><Button variant="text" disabled={busy} onClick={()=>setChoice({id:"",title:"No space"})}>No space</Button>
 <Button type="submit" variant="primary" disabled={busy} pending={pending} pendingLabel="Saving...">Save space assignment</Button><FormFeedback {...state}/>
 </form></details>;
}
