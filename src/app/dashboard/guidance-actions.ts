"use server";
import {getAccountContext} from "@/lib/auth/account";
import {parseCalendarDate} from "@/lib/calendar/dates";
import {isGuidanceData,type GuidanceState} from "@/lib/dashboard/guidance";
export async function loadGuidance(_previous:GuidanceState,form:FormData):Promise<GuidanceState>{
 const today=parseCalendarDate(form.get("today"));
 if(!today)return {error:"Choose a valid planner day before refreshing guidance."};
 try{
  const account=await getAccountContext();if(!account)return {error:"Sign in again to load your next steps."};
  const {data,error}=await account.supabase.rpc("planner_dashboard_guidance",{p_today:today});
  if(error||!isGuidanceData(data))return {error:"Guidance could not be loaded. Your saved plans are unchanged; check setup and refresh."};
  return {data,date:today};
 }catch{return {error:"We couldn't reach your next steps. Refresh when your connection returns."};}
}
