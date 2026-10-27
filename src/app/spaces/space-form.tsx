"use client";
import {useActionState,useId,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {TextInput} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import {createRequestId} from "@/lib/shared/request-id";
import {type Space} from "@/lib/spaces/types";
import {type SpaceTemplate,type SpaceCreationState} from "@/lib/templates/types";
import {saveSpace} from "./actions";
import {createSpaceFromTemplate} from "./template-actions";
export function SpaceForm({space,templates=[],templatesError}:{space?:Space;templates?:SpaceTemplate[];templatesError?:string}) {
 const field=useId(),router=useRouter();
 const [title,setTitle]=useState(space?.title??""),[revision,setRevision]=useState(space?.revision??1),[template,setTemplate]=useState("blank");
 const requestId=useRef<string|null>(space?.id??null);
 const selected=templates.find(item=>item.key===template);
 const [state,action,pending]=useActionState<SpaceCreationState,FormData>(async(previous,data)=>{
  const result=await runAction<SpaceCreationState>(async()=>{
   requestId.current??=createRequestId();data.set("id",requestId.current);data.set("revision",String(revision));
   return space?saveSpace(previous,data):createSpaceFromTemplate(previous,data);
  },UNCONFIRMED_SAVE);
  if(!result.error&&result.id&&result.revision){
   setRevision(result.revision);
   if(!space){requestId.current=null;setTitle("");setTemplate("blank");router.push('/spaces?space='+result.id+(result.pageId?'&entry='+result.pageId:''));}
   else router.refresh();
  }
  return result;
 },{});
 function choose(key:string){
  if(!title.trim()||title===selected?.title)setTitle(templates.find(item=>item.key===key)?.title??"");
  setTemplate(key);
 }
 return <form action={action} className="space-form space-create-form" aria-busy={pending}>
 <input type="hidden" name="mode" value={space?"edit":"create"}/>
 {!space&&<fieldset className="template-choices" disabled={pending}><legend>Start your space</legend>
 <label className="template-choice"><input type="radio" name="template" value="blank" checked={template==="blank"} onChange={()=>choose("blank")}/><strong>Blank space</strong><span className="muted">A clean start, with no starter pages.</span></label>
 {templates.map(item=><label className="template-choice" key={item.key}><input type="radio" name="template" value={item.key} checked={template===item.key} onChange={()=>choose(item.key)}/><strong>{item.title}</strong><span className="muted">{item.description}</span><span className="muted">{item.pages.length} starter pages</span></label>)}
 </fieldset>}
 {!space&&templatesError&&<FormFeedback error={templatesError}/>}
 {!space&&selected&&<details className="template-preview"><summary>Preview {selected.title} starter pages</summary>{selected.pages.map(page=><section key={page.title}><h3>{page.title}</h3><p className="template-page-text">{page.body}</p></section>)}<p className="muted">These become your own editable pages. No tasks, events, or account settings will be changed.</p></details>}
 <label htmlFor={field}>{space?"Space name":"New space name"}</label>
 <TextInput id={field} name="title" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={200} readOnly={pending} placeholder="Home, work, or something yours..."/>
 <Button type="submit" variant="primary" disabled={pending||!title.trim()} pending={pending} pendingLabel={space?"Saving...":"Creating your space..."}>{space?"Rename space":selected?"Create from "+selected.title:"Create blank space"}</Button>
 <FormFeedback error={state.error} message={state.message}/>
 </form>;
}
