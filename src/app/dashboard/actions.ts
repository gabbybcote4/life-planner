"use server";

import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { parseLayout, parseLayoutRevision, type LayoutState } from "@/lib/dashboard/layout";

export async function saveDashboardLayout(_previous: LayoutState, formData: FormData): Promise<LayoutState> {
  const raw = formData.get("layout");
  const revision = parseLayoutRevision(formData.get("revision"));
  if (typeof raw !== "string" || raw.length > 4000 || revision === null) return { error: "This layout could not be saved. Refresh before trying again." };
  let layout;
  try { layout = parseLayout(JSON.parse(raw)); } catch { return { error: "Choose valid widgets and sizes before saving." }; }
  if (!layout) return { error: "Choose valid widgets and sizes before saving." };
  let nextRevision: number;
  try {
    const account = await getAccountContext();
    if (!account) return { error: "Your session expired. Sign in again before saving your dashboard." };
    const { supabase, userId } = account;
    if (revision === 0) {
      const { data, error } = await supabase.from("dashboard_layouts").insert({ user_id: userId, layout })
        .select("revision").single();
      if (error?.code === "23505") return { error: "A layout was saved in another tab or an earlier attempt. Reload to check it before making more changes." };
      if (error || !data) return { error: "We couldn't confirm the save. Your layout changes are still here. Please try again." };
      nextRevision = data.revision;
    } else {
      const { data, error } = await supabase.from("dashboard_layouts").update({ layout })
        .eq("user_id", userId).eq("revision", revision).select("revision").maybeSingle();
      if (error) return { error: "We couldn't confirm the save. Your layout changes are still here. Please try again." };
      if (!data) return { error: "This layout changed elsewhere or an earlier save succeeded. Reload to check the saved layout; your draft has not overwritten it." };
      nextRevision = data.revision;
    }
  } catch {
    return { error: "We couldn't reach your dashboard settings. Your changes are still here. Please try again." };
  }
  revalidatePath("/");
  return { message: "Dashboard layout saved.", revision: nextRevision };
}
