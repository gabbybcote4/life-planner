"use client";
import {useActionState,useId,useState} from "react";
import {Button} from "@/components/ui/button";
import {TextInput} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {runAction} from "@/lib/shared/client-actions";
import {EMPTY_SEARCH,type SearchState} from "@/lib/search/types";
import type {SpaceChoice} from "@/lib/inbox/types";
import {searchPlanner} from "@/app/search/actions";
export function SpacePicker({choice,onChange,disabled=false}:{choice:SpaceChoice|null;onChange:(value:SpaceChoice|null)=>void;disabled?:boolean}){
 const field=useId(),[query,setQuery]=useState("");
 const [results,search,pending]=useActionState<SearchState,FormData>((previous,data)=>runAction(()=>searchPlanner(previous,data),{...EMPTY_SEARCH,error:"Space search unavailable. Try again."}),EMPTY_SEARCH);
 const busy=disabled||pending,changed=query.trim()!==results.query;
 return <details className="capture-space-picker"><summary>Space: {choice?.title??"No space"}</summary>
 <form action={search} className="space-form">
 <input type="hidden" name="kind" value="space"/><label htmlFor={field}>Find a space</label><TextInput id={field} name="query" type="search" maxLength={200} required value={query} readOnly={busy} onChange={event=>setQuery(event.target.value)}/>
 <Button variant="secondary" type="submit" name="offset" value="0" pending={pending} pendingLabel="Finding..." disabled={disabled}>Find spaces</Button><FormFeedback error={results.error}/>
 {results.searched&&!changed&&<><div className="space-picker-results">{results.items.map(item=><Button key={item.id} variant="secondary" disabled={busy} aria-pressed={choice?.id===item.id} onClick={()=>onChange({id:item.id,title:item.title})}>{item.title}</Button>)}</div>
 {!results.error&&!results.items.length&&<p className="muted">No matches</p>}
 <nav className="notes-pagination" aria-label="Space search pages">{results.offset>0&&<Button type="submit" variant="text" name="offset" value={results.offset-20} disabled={busy}>Previous</Button>}{results.more&&<Button type="submit" variant="text" name="offset" value={results.offset+20} disabled={busy}>Next</Button>}</nav></>}
 </form><Button variant="text" disabled={busy} onClick={()=>onChange(null)}>No space</Button></details>;
}
