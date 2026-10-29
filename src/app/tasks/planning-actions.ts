"use server";
import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { isRecordId } from "@/lib/shared/validation";
import { parseCalendarDate } from "@/lib/calendar/dates";
import { parseTaskPriority, parseTaskRepeat, type TaskPlanningState } from "@/lib/tasks/types";
import {parseRepeatRule} from "@/lib/tasks/recurrence";
import {parseTaskTime,validTaskZone} from "@/lib/tasks/time";

export async function saveTaskPlanning(_previous: TaskPlanningState, form: FormData): Promise<TaskPlanningState> {
  const id = form.get("id"), rawDate = form.get("due_date"), priority = parseTaskPriority(form.get("priority")), rawRevision = form.get("revision");
  const dueDate = rawDate === "" ? null : parseCalendarDate(rawDate);
  const rawTime=form.get("due_time"),rawZone=form.get("due_timezone");
  const dueTime=rawTime===""?null:parseTaskTime(rawTime);
  if(rawTime!==null&&(typeof rawTime!=="string"||(rawTime!==""&&(!dueTime||!dueDate||!validTaskZone(rawZone)))))return {error:"Choose a due date, a valid time and a time zone, or clear the time for an all-day task."};
  const repeatInput=form.get("repeat_frequency"), repeat=repeatInput===null ? null : parseTaskRepeat(repeatInput);
  if(repeatInput!==null&&(!repeat||(repeat!=="none"&&!dueDate)))return {error:"Choose a due date and a repeat schedule, or choose Does not repeat."};
  let rule=null;
  if(repeat==="custom"){
    try{rule=parseRepeatRule(JSON.parse(String(form.get("repeat_rule"))));}catch{}
    if(!rule||!dueDate||(rule.ends==="on"&&rule.end_date!<dueDate)||(rule.unit==="week"&&!rule.weekdays.includes(new Date(dueDate+"T12:00:00Z").getUTCDay())))return {error:"Check your custom repeat. Choose at least one weekday including the due date’s day, and an ending on or after the due date."};
  }
  if (!isRecordId(id) || typeof rawDate !== "string" || (rawDate !== "" && !dueDate) || !priority || typeof rawRevision !== "string" || !/^[1-9]\d{0,8}$/.test(rawRevision)) {
    return { error: "Choose a valid date (1900–2100) and priority, or leave the date blank." };
  }
  try {
    const account = await getAccountContext();
    if (!account) return { error: "Sign in again before saving your task plan." };
    const { data, error } = await account.supabase.from("tasks").update({ due_date: dueDate, priority, ...(rawTime!==null?{due_time:dueTime,due_timezone:dueTime?rawZone:null}:{}), ...(repeat?{repeat_frequency:repeat,repeat_rule:rule}:{}) })
      .eq("id", id).eq("user_id", account.userId).eq("planning_revision", Number(rawRevision))
      .select("planning_revision").maybeSingle();
    if (error) return { error: error.code==="23514" ? "Check the repeat dates and selected weekdays. For a completed repeat, edit the next task instead." : "We couldn't confirm the task plan. Your choices are retained; check the saved task before retrying." };
    if (!data) return { error: "This task plan changed elsewhere or an earlier save succeeded. Your draft is retained; reload before saving again." };
    revalidatePath("/"); revalidatePath("/tasks"); revalidatePath("/spaces"); revalidatePath("/search");revalidatePath("/calendar");revalidatePath("/today");revalidatePath("/projects");
    return { message: "Task plan saved.", revision: data.planning_revision };
  } catch {
    return { error: "We couldn't reach your tasks. Your date and priority are still here." };
  }
}
