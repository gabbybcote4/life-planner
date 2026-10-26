"use server";

import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { isRecordId as isNoteId } from "@/lib/shared/validation";
import { parseNote, parseRevision, type NoteState } from "@/lib/notes/types";

export async function saveNote(_previous: NoteState, formData: FormData): Promise<NoteState> {
  const values = parseNote(formData.get("title"), formData.get("body"));
  if (!values) return { error: "Use a title of 1–200 characters and note text of up to 20,000 characters." };
  const id = formData.get("id");
  const mode = formData.get("mode");
  const revision = parseRevision(formData.get("revision"));
  if (!isNoteId(id) || (mode !== "create" && mode !== "edit") || (mode === "edit" && !revision)) {
    return { error: "Copy your draft, then refresh Notes before trying again." };
  }
  let savedRevision: number;
  try {
    const account = await getAccountContext();
    if (!account) return { error: "Your session expired. Copy your draft before signing in again." };
    const { supabase, userId } = account;

    if (mode === "create") {
      const { data, error } = await supabase.from("notes").insert({ id, user_id: userId, ...values })
        .select("id,revision").single();
      if (error) {
        if (error.code !== "23505") return { error: "We couldn't confirm the save. Your draft is still here. Please try again." };
        const existing = await supabase.from("notes").select("id,title,body,revision")
          .eq("id", id).eq("user_id", userId).maybeSingle();
        if (existing.error || !existing.data || existing.data.title !== values.title || existing.data.body !== values.body) {
          return { error: "An earlier attempt may have saved this note. Copy your draft before refreshing to check." };
        }
        savedRevision = existing.data.revision;
      } else {
        if (!data) return { error: "We couldn't confirm the save. Please try again." };
        savedRevision = data.revision;
      }
    } else {
      const { data, error } = await supabase.from("notes").update(values)
        .eq("id", id).eq("user_id", userId).eq("revision", revision)
        .select("id,revision").maybeSingle();
      if (error) return { error: "We couldn't confirm the save. Your draft is still here. Please try again." };
      if (!data) return { error: "This note changed elsewhere or is no longer available. Copy your draft before reloading; it has not overwritten the saved note." };
      savedRevision = data.revision;
    }
  } catch {
    return { error: "We couldn't reach your notes. Your draft is still here. Please try again." };
  }
  revalidatePath("/notes");
  return { message: "Note saved.", id, revision: savedRevision };
}
