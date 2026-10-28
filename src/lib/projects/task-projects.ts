import type {SupabaseClient} from "@supabase/supabase-js";
import type {Task} from "../tasks/types";
import {isRecordId} from "../shared/validation";
import {PROJECT_STATUSES} from "./types";
export type TaskProjectChoice={project_id:string;title:string;status:keyof typeof PROJECT_STATUSES;active:boolean;revision:number};
export type TaskProjectChoices={task_id:string;query:string;offset:number;items:TaskProjectChoice[];more:boolean;error?:string};
export function validTaskChoices(v:unknown,task:string,query:string,offset:number):v is TaskProjectChoices{
 if(!v||typeof v!=="object")return false;const d=v as TaskProjectChoices;
 return d.task_id===task&&d.query===query&&d.offset===offset&&typeof d.more==="boolean"&&Array.isArray(d.items)&&d.items.length<=20&&d.items.every(i=>i&&isRecordId(i.project_id)&&typeof i.title==="string"&&Object.hasOwn(PROJECT_STATUSES,i.status)&&typeof i.active==="boolean"&&Number.isSafeInteger(i.revision)&&i.revision>=0&&(!i.active||i.revision>0))&&new Set(d.items.map(i=>i.project_id)).size===d.items.length;
}
// Request-scoped enrichment. Failure means unknown metadata, never an unassigned task.
export async function withTaskProjects(supabase:SupabaseClient,tasks:Task[]):Promise<Task[]>{
 if(!tasks.length)return tasks;const ids=[...new Set(tasks.map(t=>t.id))];
 try{
  if(ids.length>200)throw Error("Task preview bound");
  const {data,error}=await supabase.rpc("planner_task_project_badges",{p_tasks:ids});
  if(error||!Array.isArray(data)||data.length>ids.length)throw Error("Project metadata unavailable");
  const rows=new Map<string,{projects:NonNullable<Task["projects"]>;total:number}>();
  for(const row of data){if(!row||!ids.includes(row.task_id)||rows.has(row.task_id)||!Number.isSafeInteger(row.total)||row.total<0||!Array.isArray(row.projects)||row.projects.length>3||row.projects.length!==Math.min(3,row.total)||!row.projects.every((p:{id?:unknown;title?:unknown})=>p&&isRecordId(p.id)&&typeof p.title==="string")||new Set(row.projects.map((p:{id:string})=>p.id)).size!==row.projects.length)throw Error("Invalid project metadata");rows.set(row.task_id,{projects:row.projects,total:row.total});}
  return tasks.map(task=>{const row=rows.get(task.id);return row?{...task,projects:row.projects,project_count:row.total,projects_error:false}:{...task,projects:undefined,project_count:undefined,projects_error:true};});
 }catch{return tasks.map(task=>({...task,projects:undefined,project_count:undefined,projects_error:true}));}
}