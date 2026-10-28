"use server";
import {revalidatePath} from "next/cache";
import {getAccountContext} from "@/lib/auth/account";
import {parseCalendarDate} from "@/lib/calendar/dates";
import {isRecordId} from "@/lib/shared/validation";
import {parseHabit,parseAmount,parseHabitRevision,isHabitDayResult,type HabitState,type HabitDayState,type Habit} from "@/lib/habits/types";
function refresh(){for(const p of ["/habits","/","/spaces"])revalidatePath(p);}
export async function saveHabit(_previous:HabitState,data:FormData):Promise<HabitState>{
 const settings=parseHabit(data),id=data.get("id"),revision=parseHabitRevision(data.get("revision"));
 if(!settings||!isRecordId(id)||revision===null)return {error:"Check the habit fields and try again."};
 const account=await getAccountContext();if(!account)return {error:"Sign in again before saving."};
 const {data:result,error}=await account.supabase.rpc("planner_save_habit",{p_id:id,p_revision:revision,p_settings:settings});
 if(error||!result||(!Number.isSafeInteger(result.revision)||result.revision<1))return {error:"Could not confirm this save. Keep your draft; reload this page if another tab changed this habit, or check setup and connection."};
 refresh();return {message:"Habit saved.",revision:result.revision};
}
export async function checkHabit(_previous:HabitState,data:FormData):Promise<HabitState>{
 const id=data.get("id"),day=parseCalendarDate(data.get("day")),amount=parseAmount(data.get("amount")),revision=parseHabitRevision(data.get("revision")),habitRevision=parseHabitRevision(data.get("habit_revision"));
 if(!isRecordId(id)||!day||amount===null||revision===null||habitRevision===null||habitRevision<1)return {error:"Check the date and amount."};
 const account=await getAccountContext();if(!account)return {error:"Sign in again before checking in."};
 const {data:result,error}=await account.supabase.rpc("planner_check_habit",{p_id:id,p_day:day,p_amount:amount,p_revision:revision,p_habit_revision:habitRevision});
 if(error||!result||(!Number.isSafeInteger(result.revision)||result.revision<1))return {error:"Check-in not confirmed. Keep your amount and retry, or reload this page if this habit changed in another tab."};
 refresh();return {message:"Check-in saved.",revision:result.revision};
}
export async function loadHabitDay(data:FormData):Promise<HabitDayState>{
 const day=parseCalendarDate(data.get("day")),raw=data.get("offset"),offset=typeof raw==="string"&&/^(0|[1-9]\d{0,5})$/.test(raw)?Number(raw):-1;
 if(!day||offset<0||offset>999980)return {error:"Choose a valid date or page."};
 const account=await getAccountContext();if(!account)return {error:"Sign in to see habits.",day,offset};
 const {data:result,error}=await account.supabase.rpc("planner_habit_day",{p_day:day,p_offset:offset});
 if(error||!isHabitDayResult(result))return {error:"Habits could not be loaded. Check the habits setup or connection, then refresh.",day,offset};
 return {day,offset,items:result.items as Habit[],total:result.total};
}