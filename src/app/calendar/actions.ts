"use server";

import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { isRecordId as isEventId } from "@/lib/shared/validation";
import { parseCalendarDate, parseEventTitle, type CalendarActionState } from "@/lib/calendar/dates";

export async function saveCalendarEvent(_previous: CalendarActionState, formData: FormData): Promise<CalendarActionState> {
  const id = formData.get("id");
  const mode = formData.get("mode");
  const title = parseEventTitle(formData.get("title"));
  const eventDate = parseCalendarDate(formData.get("event_date"));
  if (!title) return { error: "Give your event a title between 1 and 200 characters." };
  if (!eventDate) return { error: "Choose a valid date between 1900 and 2100." };
  if (!isEventId(id) || (mode !== "create" && mode !== "edit")) return { error: "Refresh your calendar before saving this event." };

  const failure = { error: "We couldn't confirm the save. Your changes are still here. Please try again." };
  try {
    const account = await getAccountContext();
    if (!account) return { error: "Your session has expired. Sign in again before saving events." };
    const { supabase, userId } = account;

    if (mode === "create") {
      const { data, error } = await supabase.from("calendar_events")
        .insert({ id, user_id: userId, title, event_date: eventDate }).select("id").single();
      if (error) {
        if (error.code !== "23505") return failure;
        const existing = await supabase.from("calendar_events").select("id,title,event_date")
          .eq("id", id).eq("user_id", userId).maybeSingle();
        if (existing.error || !existing.data) return failure;
        if (existing.data.title !== title || existing.data.event_date !== eventDate) {
          return { error: "An earlier attempt saved this event. Refresh to see it before making changes." };
        }
      } else if (!data) return failure;
    } else {
      const { data, error } = await supabase.from("calendar_events").update({ title, event_date: eventDate })
        .eq("id", id).eq("user_id", userId).select("id").maybeSingle();
      if (error) return failure;
      if (!data) return { error: "This event is no longer available. Refresh your calendar before trying again." };
    }
  } catch {
    return failure;
  }
  revalidatePath("/calendar");
  return { message: "Event saved.", savedDate: eventDate };
}

