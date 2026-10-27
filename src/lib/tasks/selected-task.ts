import type { SupabaseClient } from "@supabase/supabase-js";
import { isRecordId } from "@/lib/shared/validation";
import type { Task } from "./types";
export async function loadSelectedTask(client: Pick<SupabaseClient,"from">,userId:string,id:unknown):Promise<{task:Task|null;error:boolean}> {
 if(!isRecordId(id))return {task:null,error:true};
 try {
  const {data,error}=await client.from("tasks").select("id,title,completed,created_at").eq("id",id).eq("user_id",userId).maybeSingle();
  return {task:data,error:Boolean(error||!data)};
 } catch {return {task:null,error:true};}
}
