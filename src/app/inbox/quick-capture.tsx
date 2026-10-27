"use client";
import {createContext,useContext,useRef,useState,useActionState,useId,type ReactNode} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {TextInput,TextArea} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {WindowTitleBar} from "@/components/ui/desktop-window";
import {SpacePicker} from "@/app/components/space-picker";
import {createRequestId} from "@/lib/shared/request-id";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import type {SpaceChoice,CaptureState} from "@/lib/inbox/types";
import {captureItem} from "./actions";
const CaptureContext=createContext<((space?:SpaceChoice)=>void)|null>(null);
export function QuickCaptureProvider({children}:{children:ReactNode}){
 const dialog=useRef<HTMLDialogElement>(null),requestId=useRef<string|null>(null),field=useId();
 const [kind,setKind]=useState<"task"|"note">("task"),[text,setText]=useState(""),[title,setTitle]=useState(""),[space,setSpace]=useState<SpaceChoice|null>(null),[attempted,setAttempted]=useState(false);
 const [state,action,pending]=useActionState<CaptureState,FormData>(async(previous,data)=>{
  setAttempted(true);
  const result=await runAction(async()=>{
   requestId.current??=createRequestId();data.set("id",requestId.current);return captureItem(previous,data);
  },UNCONFIRMED_SAVE);
  if(!result.error){setText("");setTitle("");requestId.current=null;}return result;
 },{});
 function open(initial?:SpaceChoice){
  if(!text.trim()&&!title.trim())setSpace(initial??null);
  if(!dialog.current?.open)dialog.current?.showModal();
 }
 function discard(){setText("");setTitle("");requestId.current=null;setAttempted(false);}
 const longTask=kind==="task"&&Array.from(text.trim()).length>200;
 return <CaptureContext value={open}>{children}
 <dialog ref={dialog} className="quick-capture-dialog" aria-labelledby={field+"-heading"} onCancel={event=>{if(pending)event.preventDefault();}}>
  <WindowTitleBar><h2 id={field+"-heading"}>Quick capture</h2><Button className="capture-close" aria-label="Close quick capture" disabled={pending} onClick={()=>dialog.current?.close()}>×</Button></WindowTitleBar>
  <div className="capture-content"><div className="capture-kind" role="group" aria-label="Capture type"><Button variant="secondary" aria-pressed={kind==="task"} disabled={pending} onClick={()=>{setKind("task");setAttempted(false);}}>✓ Task</Button><Button variant="secondary" aria-pressed={kind==="note"} disabled={pending} onClick={()=>{setKind("note");setAttempted(false);}}>▤ Note</Button></div>
  <SpacePicker choice={space} disabled={pending} onChange={value=>{setSpace(value);setAttempted(false);}}/>
  <form action={action} aria-busy={pending}>
   <input type="hidden" name="kind" value={kind}/><input type="hidden" name="space_id" value={space?.id??""}/>
   <label htmlFor={field+"-text"}>{kind==="task"?"One thing to do":"Dump your thoughts"}</label>
   <TextArea autoFocus id={field+"-text"} name="text" value={text} maxLength={20000} required readOnly={pending} rows={5} onChange={event=>{setText(event.target.value);setAttempted(false);}} placeholder={kind==="task"?"What needs doing?":"Ideas, plans, reminders..."}/>
   {kind==="note"?<details className="capture-title"><summary>Title (optional)</summary><label className="visually-hidden" htmlFor={field+"-title"}>Note title</label><TextInput id={field+"-title"} name="title" maxLength={200} readOnly={pending} value={title} onChange={event=>{setTitle(event.target.value);setAttempted(false);}} placeholder="First line becomes the title"/></details>:<input type="hidden" name="title" value=""/>}
   {longTask&&<p className="form-error">Long thought? Choose Note. Tasks allow 200 characters.</p>}
   <div className="capture-actions"><Button variant="primary" type="submit" disabled={!text.trim()||longTask} pending={pending} pendingLabel="Capturing...">Capture</Button><Button variant="text" disabled={pending||(!text&&!title)} onClick={discard}>Discard draft</Button><Link className="text-link" href="/inbox" onClick={event=>{if(pending)event.preventDefault();else dialog.current?.close();}}>Inbox →</Link></div>
   <FormFeedback error={attempted?state.error:undefined} message={attempted?state.message:undefined}/>
   {attempted&&state.href&&<Link className="text-link" href={state.href} onClick={()=>dialog.current?.close()}>Open saved item →</Link>}
  </form><p className="muted capture-hint">Closing keeps this draft in this tab. Refreshing clears unsaved text.</p></div>
 </dialog></CaptureContext>;
}
export function QuickCaptureButton({space}:{space?:SpaceChoice}){
 const open=useContext(CaptureContext);
 return <Button variant="secondary" className="quick-capture-launch" disabled={!open} onClick={()=>open?.(space)}>＋ Capture</Button>;
}
