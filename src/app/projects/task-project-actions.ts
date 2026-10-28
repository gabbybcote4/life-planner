"use server";
import {getAccountContext} from "@/lib/auth/account";
import {isRecordId} from "@/lib/shared/validation";
import {validTaskChoices,type TaskProjectChoices} from "@/lib/projects/task-projects";
export async function loadTaskProjects(form:FormData):Promise<TaskProjectChoices>{
 const task=form.get("task"),query=form.get("query"),raw=form.get("offset"),offset=typeof raw==="string"&&/^(0|[1-9]\d{0,5})$/.test(raw)?Number(raw):-1;
 const empty={task_id:typeof task==="string"?task:"",query:typeof query==="string"?query.trim():"",offset,items:[],more:false};
 if(!isRecordId(task)||typeof query!=="string"||Array.from(query).length>100||offset<0||offset>999980||offset%20!==0)return {...empty,error:"Choose a valid task and project search."};
 try{const account=await getAccountContext();if(!account)return {...empty,error:"Sign in again to choose projects."};const {data,error}=await account.supabase.rpc("planner_task_project_choices",{p_task:task,p_query:query.trim(),p_offset:offset});if(error||!validTaskChoices(data,task,query.trim(),offset))return {...empty,error:"Projects could not be loaded. Check the task-project setup and refresh."};return data;}
 catch{return {...empty,error:"Project search unavailable. Keep your task draft and retry."};}
}