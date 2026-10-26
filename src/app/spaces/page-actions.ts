"use server";

import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { isRecordId as isPageId } from "@/lib/shared/validation";
import { parseNote, parseRevision, type NoteState } from "@/lib/notes/types";

export async function saveSpacePage(_previous: NoteState, formData: FormData): Promise<NoteState> {
  const values = parseNote(formData.get("title"), formData.get("body"));
  if (!values) return { error: "Use a title of 1–200 characters and page text of up to 20,000 characters." };
  const id = formData.get("id");
  const spaceId = formData.get("space_id");
  if (!isPageId(spaceId)) return { error: "Open a space before saving a page." };
  const mode = formData.get("mode");
  const revision = parseRevision(formData.get("revision"));
  if (!isPageId(id) || (mode !== "create" && mode !== "edit") || (mode === "edit" && !revision)) {
    return { error: "Copy your draft, then refresh Pages before trying again." };
  }
  let savedRevision: number;
  try {
    const account = await getAccountContext();
    if (!account) return { error: "Your session expired. Copy your draft before signing in again." };
    const { supabase, userId } = account;
    const parent = await supabase.from("spaces").select("id").eq("id", spaceId).eq("user_id", userId).maybeSingle();
    if (parent.error || !parent.data) return { error: "This space is unavailable. Copy your draft before refreshing." };

    if (mode === "create") {
      const { data, error } = await supabase.from("space_pages").insert({ id, user_id: userId, space_id: spaceId, ...values })
        .select("id,revision").single();
      if (error) {
        if (error.code !== "23505") return { error: "We couldn't confirm the save. Your draft is still here. Please try again." };
        const existing = await supabase.from("space_pages").select("id,title,body,revision")
          .eq("id", id).eq("user_id", userId).eq("space_id", spaceId).maybeSingle();
        if (existing.error || !existing.data || existing.data.title !== values.title || existing.data.body !== values.body) {
          return { error: "An earlier attempt may have saved this page. Copy your draft before refreshing to check." };
        }
        savedRevision = existing.data.revision;
      } else {
        if (!data) return { error: "We couldn't confirm the save. Please try again." };
        savedRevision = data.revision;
      }
    } else {
      const { data, error } = await supabase.from("space_pages").update(values)
        .eq("id", id).eq("user_id", userId).eq("space_id", spaceId).eq("revision", revision)
        .select("id,revision").maybeSingle();
      if (error) return { error: "We couldn't confirm the save. Your draft is still here. Please try again." };
      if (!data) return { error: "This page changed elsewhere or is no longer available. Copy your draft before reloading; it has not overwritten the saved page." };
      savedRevision = data.revision;
    }
  } catch {
    return { error: "We couldn't reach your pages. Your draft is still here. Please try again." };
  }
  revalidatePath("/spaces");
  revalidatePath("/notes");
  return { message: "Page saved.", id, revision: savedRevision };
}
