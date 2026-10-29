"use server";
import {revalidatePath} from "next/cache";
import {getAccountContext} from "@/lib/auth/account";
import {parseMoveForm,type MoveState} from "@/lib/calendar/reschedule";
import {isRecordId} from "@/lib/shared/validation";
export async function rescheduleTask(_previous:MoveState,form:FormData):Promise<MoveState>{
 const args=parseMoveForm(form);if(!args)return {error:"Choose a valid date and time, or make it all-day."};
 try{
  const account=await getAccountContext();if(!account)return {error:"Sign in again before moving this task."};
  const {data,error}=await account.supabase.rpc("planner_reschedule_task",args);
  if(error)return {error:error.code==="40001"?"This schedule changed elsewhere. Your choices are kept; refresh before trying again.":error.code==="23505"?"An earlier move may already be saved. Refresh to check before trying again.":error.code==="42501"?"This task is unavailable or completed. Refresh your planner.":error.code==="22023"?"Check the move date/time and the repeat's ending. Choose a new date or time.":error.code==="54000"?"This occurrence is too far ahead to move here. Choose a nearer occurrence or edit its series.":"Move not confirmed. Your choices are kept; check setup or connection and retry."};
  if(!data||!isRecordId(data.id))return {error:"Move not confirmed. Refresh to check the saved schedule."};
  for(const path of ["/calendar","/tasks","/today","/spaces","/projects","/search","/"])revalidatePath(path);
  return {id:data.id,message:"Task moved."};
 }catch{return {error:"Could not confirm the move. Your date and time are still here."};}
}
