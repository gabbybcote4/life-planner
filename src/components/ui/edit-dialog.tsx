"use client";
import {useId,useState,useEffect,type ReactNode} from "react";
import {Button} from "./button";
import {WindowTitleBar} from "./desktop-window";

// Shared edit surface. Closing keeps mounted drafts; saves stay feature-owned.
export function EditDialog({title,children,disabled=false,onOpen,onClose,triggerLabel,closeAfterSave}:{title:string;children:ReactNode|((close:()=>void)=>ReactNode);disabled?:boolean;onOpen?:()=>void;onClose?:()=>void;triggerLabel?:string;closeAfterSave?:number}){
 const [dialog,setDialog]=useState<HTMLDialogElement|null>(null),label=useId(),hint=useId();
 useEffect(()=>{if(closeAfterSave&&dialog?.open)dialog.close();},[closeAfterSave,dialog]);
 function close(){
  if(dialog?.querySelector('[aria-busy="true"]'))return;
  dialog?.close();
 }
 return <>
  <Button className="edit-pencil" aria-label={title} title={title} disabled={disabled} onClick={()=>{onOpen?.();dialog?.showModal();}}>
   {triggerLabel??<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg>
}  </Button>
  <dialog ref={setDialog} className="entry-edit-dialog" aria-labelledby={label} aria-describedby={hint} onCancel={event=>{event.preventDefault();close();}} onClose={onClose}>
   <WindowTitleBar><h2 id={label}>{title}</h2><Button className="edit-dialog-close" aria-label="Close editor" onClick={close}>×</Button></WindowTitleBar>
   <div className="entry-edit-content"><p id={hint} className="muted">Save each change to keep it. Closing keeps drafts on this page.</p>{typeof children==="function"?children(close):children}</div>
  </dialog>
 </>;
}
