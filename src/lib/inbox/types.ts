import {parseTaskTitle} from "@/lib/tasks/types";
import {parseNote} from "@/lib/notes/types";
import {isRecordId} from "@/lib/shared/validation";
export type CaptureKind="task"|"note"|"page";
export type CaptureState={error?:string;message?:string;href?:string};
export type SpaceChoice={id:string;title:string};
export type Capture={id:string;kind:CaptureKind;title:string;body:string;space_id:string|null;reviewed:boolean;revision:number;created_at:string;space?:{title:string}|null};
export function parseCapture(form:FormData):{id:string;kind:"task"|"note";space_id:string|null;title:string;body:string}|null{
 const id=form.get("id"),kind=form.get("kind"),text=form.get("text"),custom=form.get("title"),space=form.get("space_id");
 if(!isRecordId(id)||(kind!=="task"&&kind!=="note")||typeof text!=="string"||!text.trim()||typeof custom!=="string"||typeof space!=="string"||(space!==""&&!isRecordId(space)))return null;
 if(kind==="task"){const title=parseTaskTitle(text);return title?{id,kind,space_id:space||null,title,body:""}:null;}
 const title=custom.trim()||Array.from(text.split(/\r?\n/).find(line=>line.trim())?.trim()??"").slice(0,200).join("");
 const note=parseNote(title,text);return note?{id,kind,space_id:space||null,...note}:null;
}
export function captureHref(value:{id:string;kind:CaptureKind;space_id:string|null}):string{
 if(value.kind==="task")return "/tasks?task="+value.id;
 if(value.kind==="page")return "/spaces?space="+value.space_id+"&entry="+value.id;
 return "/notes?note="+value.id;
}
