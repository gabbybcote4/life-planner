"use client";
import {useId} from "react";
import {Button} from "@/components/ui/button";
import {TextInput} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import type {SpaceChoice} from "@/lib/inbox/types";
import {useRecordChoices} from "./use-record-choices";
export function SpacePicker({choice,onChange,disabled=false}:{choice:SpaceChoice|null;onChange:(value:SpaceChoice|null)=>void;disabled?:boolean}){
 const field=useId();const {query,setQuery,state:results,search,pending,load,current}=useRecordChoices("space");
 const busy=disabled||pending,changed=!current;
 return <details className="capture-space-picker" onToggle={e=>{if(e.currentTarget.open&&!busy)load();}}><summary>Space: {choice?.title??"No space"}</summary>
 <form action={search} className="space-form" aria-busy={pending}>
 <input type="hidden" name="kind" value="space"/><label htmlFor={field}>Choose a space</label><TextInput id={field} name="query" type="search" maxLength={100} placeholder="Filter spaces (optional)" value={query} readOnly={busy} onChange={event=>setQuery(event.target.value)}/>
 <Button variant="secondary" type="submit" name="offset" value="0" pending={pending} pendingLabel="Finding..." disabled={disabled}>Find / refresh</Button><FormFeedback error={results.error} pending={pending} pendingLabel="Loading spaces..."/>
 {results.searched&&!changed&&!results.error&&<><div className="space-picker-results">{results.items.map(item=><Button key={item.id} variant="secondary" disabled={busy} aria-pressed={choice?.id===item.id} onClick={()=>onChange({id:item.id,title:item.title})}>{item.title}</Button>)}</div>
 {!results.error&&!results.items.length&&<p className="muted">No matches</p>}
 <nav className="notes-pagination" aria-label="Space search pages">{results.offset>0&&<Button type="submit" variant="text" name="offset" value={results.offset-20} disabled={busy}>Previous</Button>}{results.more&&<Button type="submit" variant="text" name="offset" value={results.offset+20} disabled={busy}>Next</Button>}</nav></>}
 </form><Button variant="text" disabled={busy} onClick={()=>onChange(null)}>No space</Button></details>;
}
