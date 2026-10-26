"use server";
import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { isRecordId } from "@/lib/shared/validation";
import { parseRevision, type NoteState } from "@/lib/notes/types";
import { parseSpaceTitle } from "@/lib/spaces/types";
export async function saveSpace(_previous: NoteState, data: FormData): Promise<NoteState> {
  const title = parseSpaceTitle(data.get("title"));
  const id = data.get("id"), mode = data.get("mode"), revision = parseRevision(data.get("revision"));
  if (!title || !isRecordId(id) || (mode !== "create" && mode !== "edit") || (mode === "edit" && !revision)) return { error: "Use a space name of 1–100 characters and refresh if this space is unavailable." };
  try {
    const account = await getAccountContext();
    if (!account) return { error: "Your session expired. Copy your draft before signing in." };
    const { supabase, userId } = account;
    if (mode === "create") {
      const result = await supabase.from("spaces").insert({id, user_id:userId, title}).select("id,revision").single();
      if (!result.error && result.data) { revalidatePath("/spaces"); return { ...result.data, message:"Space saved." }; }
      if (result.error?.code === "23505") {
        const existing = await supabase.from("spaces").select("id,title,revision").eq("id",id).eq("user_id",userId).maybeSingle();
        if (!existing.error && existing.data?.title === title) { revalidatePath("/spaces"); return {id, revision:existing.data.revision, message:"Space saved."}; }
      }
    } else {
      const result = await supabase.from("spaces").update({title}).eq("id",id).eq("user_id",userId).eq("revision",revision).select("id,revision").maybeSingle();
      if (!result.error && result.data) { revalidatePath("/spaces"); return {...result.data,message:"Space renamed."}; }
      if (!result.error) return {error:"This space changed elsewhere. Copy your name before reloading."};
    }
    return {error:"We could not confirm the save. Keep your draft and try again."};
  } catch { return {error:"We could not reach your spaces. Your draft is still here."}; }
}
