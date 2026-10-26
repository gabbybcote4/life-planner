"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/feedback";
import { runAction } from "@/lib/shared/client-actions";
import { EMPTY_LINK_RESULTS, LINK_PAGE_SIZE, targetHref, type LinkKind, type LinkResults } from "@/lib/knowledge/links";
import { loadConnections } from "./actions";
export function ConnectionList({kind,id,direction,initial}:{kind:LinkKind;id:string;direction:"outgoing"|"backlinks";initial:LinkResults}) {
 const [state,action,pending]=useActionState<LinkResults,FormData>((previous,data)=>runAction(()=>loadConnections(previous,data),{...EMPTY_LINK_RESULTS,error:"We could not load these links. Check your connection and retry."}),initial);
 return <section className="knowledge-panel" aria-label={direction==="outgoing"?"Links from this item":"Backlinks"}>
 <h3>{direction==="outgoing"?"Linked notes and pages":"Linked from"}</h3>
 <FormFeedback pending={pending} pendingLabel="Loading links..." error={state.error}/>
 {!state.error && <><ul className="knowledge-list">{state.items.map(item=><li key={item.kind+item.id}><Link href={targetHref(item)}>{item.title}</Link><span className="muted"> · {item.kind==="note"?"Note":"Page in "+item.space_title}</span></li>)}</ul>
 {!state.items.length && <p className="muted">{direction==="outgoing"?"No available saved links on this page.":"No available saved pages link here yet."}</p>}</>}
 <form action={action}><input type="hidden" name="kind" value={kind}/><input type="hidden" name="id" value={id}/><input type="hidden" name="direction" value={direction}/>
 <nav className="notes-pagination" aria-label={direction==="outgoing"?"Linked items pages":"Backlink pages"}>
 <Button variant="text" type="submit" name="offset" value="0" disabled={pending}>{state.error?"Retry":"Refresh links"}</Button>
 {state.offset>0&&<Button variant="text" type="submit" name="offset" value={state.offset-LINK_PAGE_SIZE} disabled={pending}>Previous</Button>}
 {state.more&&<Button variant="text" type="submit" name="offset" value={state.offset+LINK_PAGE_SIZE} disabled={pending}>Next</Button>}
 </nav></form></section>;
}
