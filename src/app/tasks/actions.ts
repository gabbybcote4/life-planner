"use server";

import { isRecordId as isTaskId } from "@/lib/shared/validation";
import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { parseTaskTitle, type TaskActionState } from "@/lib/tasks/types";

const sessionError = { error: "Your session has expired. Sign in again before saving your tasks." };
const saveError = { error: "We couldn't confirm the save. Your changes are still here. Please try again." };
const unavailableError = { error: "This task is no longer available. Refresh your planner before trying again." };

export async function addTask(_previous: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const title = parseTaskTitle(formData.get("title"));
  const id = formData.get("id");
  if (!title) return { error: "Give your task a title between 1 and 200 characters." };
  if (!isTaskId(id)) return { error: "Please refresh your planner before adding this task." };

  try {
    const context = await getAccountContext();
    if (!context) return sessionError;
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("tasks")
      .insert({ id, user_id: userId, title }).select("id").single();
    if (error) {
      // A retry after a lost response must not create a second task.
      if (error.code !== "23505") return saveError;
      const existing = await supabase.from("tasks").select("id,title")
        .eq("id", id).eq("user_id", userId).maybeSingle();
      if (existing.error || !existing.data) return saveError;
      if (existing.data.title !== title) return { error: "An earlier attempt saved this task. Refresh to see it before editing its title." };
    } else if (!data) return saveError;
  } catch {
    return saveError;
  }
  revalidatePath("/");
  revalidatePath("/tasks");
  return { message: "Task saved." };
}

export async function renameTask(_previous: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const id = formData.get("id");
  const title = parseTaskTitle(formData.get("title"));
  if (!isTaskId(id) || !title) return { error: "Give your task a title between 1 and 200 characters." };
  try {
    const context = await getAccountContext();
    if (!context) return sessionError;
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("tasks").update({ title })
      .eq("id", id).eq("user_id", userId).select("id").maybeSingle();
    if (error) return saveError;
    if (!data) return unavailableError;
  } catch {
    return saveError;
  }
  revalidatePath("/");
  revalidatePath("/tasks");
  return { message: "Changes saved." };
}

export async function setTaskCompleted(_previous: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const id = formData.get("id");
  const completed = formData.get("completed");
  if (!isTaskId(id) || (completed !== "true" && completed !== "false")) {
    return { error: "Please refresh your planner before updating this task." };
  }
  try {
    const context = await getAccountContext();
    if (!context) return sessionError;
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("tasks").update({ completed: completed === "true" })
      .eq("id", id).eq("user_id", userId).select("id").maybeSingle();
    if (error) return { error: "We couldn't confirm this change. Refresh to check the saved status, then try again." };
    if (!data) return unavailableError;
  } catch {
    return { error: "We couldn't confirm this change. Refresh to check the saved status, then try again." };
  }
  revalidatePath("/");
  revalidatePath("/tasks");
  return { message: completed === "true" ? "Task completed and saved." : "Task reopened and saved." };
}

