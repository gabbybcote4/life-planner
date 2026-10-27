import {DEFAULT_BACKGROUND,parseBackground,backgroundAttributes} from "@/lib/themes/background";
import type { CSSProperties, ReactNode } from "react";
import { getAccountContext } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_THEME, parseTheme, themeVariables, type Theme } from "@/lib/themes/themes";

export async function ThemeRoot({ children }: { children: ReactNode }) {
  let theme: Theme = DEFAULT_THEME;
  let background=DEFAULT_BACKGROUND;
  if (isSupabaseConfigured()) {
    try {
      const account = await getAccountContext();
      if (account) {
        const { data, error } = await account.supabase.from("planner_preferences").select("theme,background_pattern,background_intensity")
          .eq("user_id", account.userId).maybeSingle();
        if (!error) { theme = parseTheme(data?.theme) ?? DEFAULT_THEME; background=parseBackground(data?.background_pattern,data?.background_intensity)??DEFAULT_BACKGROUND; }
      }
    } catch {
      // Keep the planner usable; Settings reports preference-service errors.
    }
  }
  return <div className="theme-root" {...backgroundAttributes(background)} data-theme={theme} style={themeVariables(theme) as CSSProperties}>{children}</div>;
}
