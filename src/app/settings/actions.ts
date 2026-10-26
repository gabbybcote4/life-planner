"use server";

import { revalidatePath } from "next/cache";
import { getAccountContext } from "@/lib/auth/account";
import { parseTheme, type ThemeState } from "@/lib/themes/themes";

export async function saveTheme(_previous: ThemeState, formData: FormData): Promise<ThemeState> {
  const theme = parseTheme(formData.get("theme"));
  if (!theme) return { error: "Choose one of the available themes." };
  try {
    const account = await getAccountContext();
    if (!account) return { error: "Your session expired. Sign in again before changing your theme." };
    const { supabase, userId } = account;

    const update = () => supabase.from("planner_preferences").update({ theme })
      .eq("user_id", userId).select("theme").maybeSingle();
    const result = await update();
    if (result.error) return { error: "We couldn't save your theme. Please try again." };
    if (!result.data) {
      const inserted = await supabase.from("planner_preferences").insert({ user_id: userId, theme }).select("theme").single();
      if (inserted.error) {
        // Another tab may have created the row first. Never grant owner updates
        // just to support an upsert that rewrites its conflict-key column.
        if (inserted.error.code !== "23505") return { error: "We couldn't save your theme. Please try again." };
        const retried = await update();
        if (retried.error || !retried.data) return { error: "We couldn't confirm your theme. Please try again." };
      } else if (!inserted.data) return { error: "We couldn't confirm your theme. Please try again." };
    }
  } catch {
    return { error: "We couldn't reach your settings. Please try again." };
  }
  revalidatePath("/", "layout");
  return { message: "Theme saved to your account." };
}
