"use client";
import { startTransition, useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/fields";
import { FormFeedback } from "@/components/ui/feedback";
import { runAction } from "@/lib/shared/client-actions";
import { EMPTY_LINK_RESULTS, LINK_PAGE_SIZE, type LinkResults, type LinkTarget } from "@/lib/knowledge/links";
import { searchLinkTargets } from "./actions";
export function LinkPicker({onInsert,disabled}:{onInsert:(target:LinkTarget)=>void;disabled:boolean}) {
 const field=useId(), [query,setQuery]=useState("");
 const [state,action,pending]=useActionState<LinkResults,FormData>((previous,data)=>runAction(()=>searchLinkTargets(previous,data),{...EMPTY_LINK_RESULTS,error:"Link choices could not be loaded. Check your connection and try again."}),EMPTY_LINK_RESULTS);
 const busy=disabled||pending;
 function browse(){const data=new FormData();data.set("query",query);data.set("offset","0");startTransition(()=>action(data));}
 return <details className="knowledge-panel" onToggle={e=>{if(e.currentTarget.open&&!busy)browse();}}><summary>Insert a link to a note or page</summary>
 <form action={action} className="link-search" aria-busy={pending}>
 <label htmlFor={field}>Choose a note or page</label>
 <TextInput id={field} name="query" value={query} onChange={e=>setQuery(e.target.value)} maxLength={100} readOnly={busy} placeholder="Search titles, or leave blank to browse"/>
 <Button type="submit" name="offset" value="0" variant="secondary" disabled={disabled} pending={pending} pendingLabel="Searching...">Find / refresh</Button>
 <FormFeedback error={state.error} pending={pending} pendingLabel="Loading notes and pages..."/>
 {state.query!==undefined && state.query===query.trim() && !state.error && <>
 <p className="muted">{state.items.length ? "Choose an item to insert at your text cursor. Save your draft to keep the link." : "No matching notes or pages."}</p>
 <ul className="knowledge-list">{state.items.map(item=><li key={item.kind+item.id}><Button variant="text" disabled={busy} onClick={()=>onInsert(item)}>{item.title}<span className="muted"> · {item.kind==="note" ? "Note" : "Page in "+item.space_title}</span></Button></li>)}</ul>
 <nav className="notes-pagination" aria-label="Link search results">
 {state.offset>0&&<Button type="submit" name="offset" value={state.offset-LINK_PAGE_SIZE} variant="text" disabled={busy||query.trim()!==state.query}>Previous</Button>}
 {state.more&&<Button type="submit" name="offset" value={state.offset+LINK_PAGE_SIZE} variant="text" disabled={busy||query.trim()!==state.query}>Next</Button>}
 </nav></>}
 </form></details>;
}
