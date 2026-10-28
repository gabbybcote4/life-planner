"use server";
import {withTaskProjects} from "@/lib/projects/task-projects";

import {getAccountContext} from "@/lib/auth/account";
import {parseCalendarDate} from "@/lib/calendar/dates";
import {parseTodayOffset,isTodayData,type TodayState} from "@/lib/today/types";
export async function loadToday(form:FormData):Promise<TodayState>{
 const day=parseCalendarDate(form.get("day")),tasks=parseTodayOffset(form.get("tasks")),habits=parseTodayOffset(form.get("habits")),events=parseTodayOffset(form.get("events"));
 if(!day||tasks===null||habits===null||events===null)return {error:"Choose a valid day and page."};
 const offsets={tasks,habits,events};
 try{
  const account=await getAccountContext();if(!account)return {day,offsets,error:"Sign in again to open Today."};
  const {data,error}=await account.supabase.rpc("planner_today",{p_day:day,p_tasks_offset:tasks,p_habits_offset:habits,p_events_offset:events});
  if(error||!isTodayData(data,day))return {day,offsets,error:"Today could not be loaded. Check the Today setup or connection, then refresh."};
  return {day,offsets,data:{...data,tasks:await withTaskProjects(account.supabase,data.tasks)}};
 }catch{return {day,offsets,error:"We could not reach Today. Refresh when your connection returns."};}
}