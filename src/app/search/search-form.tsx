"use client";
import Link from "next/link";
import {useActionState,useId,useState} from "react";
import {Button} from "@/components/ui/button";
import {TextInput} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {runAction} from "@/lib/shared/client-actions";
import {EMPTY_SEARCH,SEARCH_KINDS,SEARCH_LABELS,SEARCH_PAGE_SIZE,searchHref,type SearchState,type SearchKind} from "@/lib/search/types";
import {searchPlanner} from "./actions";
export function SearchForm() {
 const field=useId(),[query,setQuery]=useState(""),[kind,setKind]=useState<SearchKind>("all");
 const [state,action,pending]=useActionState<SearchState,FormData>((previous,form)=>runAction(()=>searchPlanner(previous,form),{...EMPTY_SEARCH,error:"Search could not be reached. Your search text is still here; please retry."}),EMPTY_SEARCH);
 const changed=query.trim()!==state.query||kind!==state.kind;
 return <form action={action} className="planner-search" aria-busy={pending}>
 <label htmlFor={field+"-query"}>What are you looking for?</label>
 <TextInput id={field+"-query"} name="query" type="search" value={query} onChange={e=>setQuery(e.target.value)} maxLength={200} readOnly={pending} placeholder="Search your saved titles and text..." autoComplete="off"/>
 <label htmlFor={field+"-kind"}>Look in</label>
 <select id={field+"-kind"} className="form-control" name="kind" value={kind} onChange={e=>setKind(e.target.value as SearchKind)} disabled={pending}>{SEARCH_KINDS.map(value=><option key={value} value={value}>{SEARCH_LABELS[value]}</option>)}</select>
 <Button type="submit" name="offset" value="0" variant="primary" pending={pending} pendingLabel="Searching...">Search</Button>
 <FormFeedback pending={pending} pendingLabel="Searching your planner..." error={state.error}/>
 {!state.searched&&!state.error&&!pending&&<p className="muted">Enter a word or phrase to search your saved planner. Nothing here is shared with other accounts.</p>}
 {state.searched&&!state.error&&<section aria-label="Search results" aria-live="polite">
 <h2>Results for “{state.query}”</h2>
 {changed&&<p className="muted">These results are from your previous search. Choose Search to update them.</p>}
 {!state.items.length?<p className="muted">No matches found. Try another word or a different category.</p>:<>
 <p className="muted">Showing {state.offset+1}–{state.offset+state.items.length}{state.more?" · more results available":""}</p>
 <ul className="search-results">{state.items.map(item=><li key={item.kind+item.id}>
 <Link className="text-link" href={searchHref(item)}>{item.title}</Link>
 <p className="muted">{SEARCH_LABELS[item.kind]}{item.kind==="event"?" · "+item.event_date:""}{item.kind==="task"?" · "+(item.completed?"Completed":"To do"):""}{item.kind==="page"?" · "+item.space_title:""}</p>
 </li>)}</ul></>}
 <nav className="notes-pagination" aria-label="Search result pages">
 {state.offset>0&&<Button type="submit" name="offset" value={state.offset-SEARCH_PAGE_SIZE} variant="text" disabled={pending||changed}>Previous</Button>}
 {state.more&&state.offset<999980&&<Button type="submit" name="offset" value={state.offset+SEARCH_PAGE_SIZE} variant="text" disabled={pending||changed}>Next</Button>}
 </nav></section>}
 </form>;
}
