"use client";
import { useActionState, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/fields";
import { FormFeedback } from "@/components/ui/feedback";
import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";
import { createRequestId } from "@/lib/shared/request-id";
import { type Space } from "@/lib/spaces/types";
import { type NoteState } from "@/lib/notes/types";
import { saveSpace } from "./actions";
export function SpaceForm({space}:{space?:Space}) {
 const field = useId(), router = useRouter();
 const [title,setTitle]=useState(space?.title ?? ""), [revision,setRevision]=useState(space?.revision ?? 1);
 const requestId=useRef<string|null>(space?.id ?? null);
 const [state,action,pending]=useActionState<NoteState,FormData>(async(previous,data)=>{
   const result=await runAction(async()=>{requestId.current ??= createRequestId(); data.set("id",requestId.current); data.set("revision",String(revision));return saveSpace(previous,data);},UNCONFIRMED_SAVE);
   if (!result.error && result.id && result.revision) {setRevision(result.revision);if(!space) router.push('/spaces?space='+result.id);else router.refresh();}
   return result;
 },{});
 return <form action={action} className="space-form" aria-busy={pending}>
 <input type="hidden" name="mode" value={space ? "edit":"create"}/>
 <label htmlFor={field}>{space ? "Space name":"New space name"}</label>
 <TextInput id={field} name="title" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={200} readOnly={pending} placeholder="Home, work, or something yours..."/>
 <Button type="submit" variant="primary" pending={pending} pendingLabel="Saving...">{space ? "Rename space":"Create space"}</Button>
 <FormFeedback error={state.error} message={state.message}/>
 </form>;
}
