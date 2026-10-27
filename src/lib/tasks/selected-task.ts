import type { SupabaseClient } from "@supabase/supabase-js";
import { isRecordId } from "@/lib/shared/validation";
import { TASK_SELECT, type Task } from "./types";
export async function loadSelectedTask(client: Pick<SupabaseClient,"from">,userId:string,id:unknown):Promise<{task:Task|null;error:boolean}> {
 if(!isRecordId(id))return {task:null,error:true};
 try {
  const {data,error}=await client.from("tasks").select(TASK_SELECT).eq("id",id).eq("user_id",userId).maybeSingle();
  return {task:data as unknown as Task|null,error:Boolean(error||!data)};
 } catch {return {task:null,error:true};}
}
