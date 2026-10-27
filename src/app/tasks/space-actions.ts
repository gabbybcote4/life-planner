"use server";
import {revalidatePath} from "next/cache";
import {getAccountContext} from "@/lib/auth/account";
import {isRecordId} from "@/lib/shared/validation";
import type {TaskActionState} from "@/lib/tasks/types";
export async function assignTaskSpace(_previous:TaskActionState,form:FormData):Promise<TaskActionState> {
 const id=form.get("id"), desired=form.get("space_id"), previous=form.get("previous_space_id");
 if(!isRecordId(id)||typeof desired!=="string"||typeof previous!=="string"||(desired!==""&&!isRecordId(desired))||(previous!==""&&!isRecordId(previous)))return {error:"Open a task and choose a valid space."};
 try {
  const account=await getAccountContext();if(!account)return {error:"Sign in again before changing this task's space."};
  const {supabase,userId}=account;
  if(desired){const parent=await supabase.from("spaces").select("id").eq("id",desired).eq("user_id",userId).maybeSingle();if(parent.error||!parent.data)return {error:"That space is unavailable. Choose one of your own spaces."};}
  let query=supabase.from("tasks").update({space_id:desired||null}).eq("id",id).eq("user_id",userId);
  query=previous?query.eq("space_id",previous):query.is("space_id",null);
  const result=await query.select("id").maybeSingle();
  if(result.error)return {error:"We could not confirm this change. Check the saved task before trying again."};
  if(!result.data){
   const current=await supabase.from("tasks").select("id,space_id").eq("id",id).eq("user_id",userId).maybeSingle();
   if(current.error||!current.data||current.data.space_id!==(desired||null))return {error:"This task moved elsewhere or is unavailable. Reload before changing its space; your choice has not overwritten it."};
  }
 } catch {return {error:"We could not confirm this change. Keep your choice and try again."};}
 revalidatePath("/");revalidatePath("/tasks");revalidatePath("/spaces");revalidatePath("/search");
 return {message:desired?"Task assigned to the space.":"Task removed from the space; it remains in your task list."};
}
