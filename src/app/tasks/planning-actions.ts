"use server";
import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { isRecordId } from "@/lib/shared/validation";
import { parseCalendarDate } from "@/lib/calendar/dates";
import { parseTaskPriority, type TaskPlanningState } from "@/lib/tasks/types";

export async function saveTaskPlanning(_previous: TaskPlanningState, form: FormData): Promise<TaskPlanningState> {
  const id = form.get("id"), rawDate = form.get("due_date"), priority = parseTaskPriority(form.get("priority")), rawRevision = form.get("revision");
  const dueDate = rawDate === "" ? null : parseCalendarDate(rawDate);
  if (!isRecordId(id) || typeof rawDate !== "string" || (rawDate !== "" && !dueDate) || !priority || typeof rawRevision !== "string" || !/^[1-9]\d{0,8}$/.test(rawRevision)) {
    return { error: "Choose a valid date (1900–2100) and priority, or leave the date blank." };
  }
  try {
    const account = await getAccountContext();
    if (!account) return { error: "Sign in again before saving your task plan." };
    const { data, error } = await account.supabase.from("tasks").update({ due_date: dueDate, priority })
      .eq("id", id).eq("user_id", account.userId).eq("planning_revision", Number(rawRevision))
      .select("planning_revision").maybeSingle();
    if (error) return { error: "We couldn't confirm the task plan. Your choices are retained; check the saved task before retrying." };
    if (!data) return { error: "This task plan changed elsewhere or an earlier save succeeded. Your draft is retained; reload before saving again." };
    revalidatePath("/"); revalidatePath("/tasks"); revalidatePath("/spaces"); revalidatePath("/search");
    return { message: "Task date and priority saved.", revision: data.planning_revision };
  } catch {
    return { error: "We couldn't reach your tasks. Your date and priority are still here." };
  }
}
