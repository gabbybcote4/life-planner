import type { CSSProperties, ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_THEME, parseTheme, themeVariables, type Theme } from "@/lib/themes/themes";

export async function ThemeRoot({ children }: { children: ReactNode }) {
  let theme: Theme = DEFAULT_THEME;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: auth, error: authError } = await supabase.auth.getClaims();
      if (!authError && auth?.claims?.sub) {
        const { data, error } = await supabase.from("planner_preferences").select("theme")
          .eq("user_id", auth.claims.sub).maybeSingle();
        if (!error) theme = parseTheme(data?.theme) ?? DEFAULT_THEME;
      }
    } catch {
      // Keep sign-in and the planner usable if the preference service is unavailable.
      // Settings reports read/save failures explicitly.
    }
  }
  return <div className="theme-root" data-theme={theme} style={themeVariables(theme) as CSSProperties}>{children}</div>;
}
