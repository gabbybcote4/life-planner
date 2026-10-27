"use client";
import {useActionState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {FormFeedback} from "@/components/ui/feedback";
import {DeskIcon} from "@/components/ui/desk-icon";
import {runAction} from "@/lib/shared/client-actions";
import {captureHref,type Capture,type CaptureState} from "@/lib/inbox/types";
import {reviewCapture} from "./actions";
export function CaptureCard({item}:{item:Capture}){
 const [state,action,pending]=useActionState<CaptureState,FormData>((previous,data)=>runAction(()=>reviewCapture(previous,data),{error:"Review not confirmed. Reload before retrying."}),{});
 return <li className="inbox-card">
 <div className="inbox-card-top"><span className="inbox-kind"><DeskIcon name={item.kind==="task"?"tasks":"notes"}/>{item.kind==="task"?"Task":item.kind==="page"?"Space note":"Note"}</span><time dateTime={item.created_at}>{new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(item.created_at))}</time></div>
 <h2><Link href={captureHref(item)}>{item.title}</Link></h2>
 {item.space&&<p className="muted">Captured in {item.space.title}</p>}
 {item.body&&<details className="inbox-original"><summary>Original capture</summary><p>{item.body}</p></details>}
 <div className="inbox-card-actions"><Link className="text-link" href={captureHref(item)}>{item.kind==="task"?"Plan / move / complete":"Open note"} →</Link>
 <form action={action} aria-busy={pending}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="revision" value={item.revision}/><input type="hidden" name="reviewed" value={String(!item.reviewed)}/><Button variant="secondary" type="submit" pending={pending} pendingLabel="Saving...">{item.reviewed?"Return to Inbox":"✓ Reviewed"}</Button></form></div>
 <FormFeedback {...state}/>
 </li>;
}
