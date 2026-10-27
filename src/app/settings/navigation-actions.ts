"use server";
import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { parseNavPosition } from "@/lib/navigation";
export type NavigationState = { error?: string; message?: string; revision?: number };
export async function saveNavigation(_previous: NavigationState, data: FormData): Promise<NavigationState> {
  const position = parseNavPosition(data.get("position")), raw = data.get("revision");
  if (!position || typeof raw !== "string" || !/^[1-9]\d{0,8}$/.test(raw)) return { error: "Choose an available position and reload settings if needed." };
  const revision = Number(raw);
  try {
    const account = await getAccountContext();
    if (!account) return { error: "Sign in again before saving navigation." };
    const { supabase, userId } = account;
    const update = () => supabase.from("planner_preferences").update({ nav_position: position })
      .eq("user_id", userId).eq("nav_revision", revision).select("nav_revision").maybeSingle();
    let result = await update();
    if (result.error) return { error: "We couldn't save navigation. Keep your choice and try again." };
    if (!result.data) {
      const existing = await supabase.from("planner_preferences").select("nav_revision").eq("user_id", userId).maybeSingle();
      if (existing.error) return { error: "We couldn't check your settings. Try again." };
      if (existing.data || revision !== 1) return { error: "Navigation changed in another tab. Your preview is retained; reload settings before saving again." };
      const inserted = await supabase.from("planner_preferences").insert({ user_id: userId, nav_position: position }).select("nav_revision").single();
      if (inserted.error?.code === "23505") result = await update(); else result = inserted;
      if (result.error || !result.data) return { error: "We couldn't confirm navigation. Reload settings to check before retrying." };
    }
    revalidatePath("/", "layout");
    return { message: "Navigation position saved to your account.", revision: result.data.nav_revision };
  } catch { return { error: "We couldn't reach your settings. Your choice is retained." }; }
}
