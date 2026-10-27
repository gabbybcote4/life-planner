import {QuickCaptureProvider} from "@/app/inbox/quick-capture";
import { FocusTimerProvider } from "@/app/dashboard/focus-timer";
import {DEFAULT_NAV_POSITION,parseNavPosition} from "@/lib/navigation";
import {DEFAULT_BACKGROUND,parseBackground,backgroundAttributes} from "@/lib/themes/background";
import type { CSSProperties, ReactNode } from "react";
import { getAccountContext } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_THEME, parseTheme, themeVariables, type Theme } from "@/lib/themes/themes";

export async function ThemeRoot({ children }: { children: ReactNode }) {
  let theme: Theme = DEFAULT_THEME;
  let timerOwner: string | null = null;
  let background=DEFAULT_BACKGROUND;
  let navigation=DEFAULT_NAV_POSITION;
  if (isSupabaseConfigured()) {
    try {
      const account = await getAccountContext();
      if (account) {
        timerOwner = account.userId;
        const { data, error } = await account.supabase.from("planner_preferences").select("theme,background_pattern,background_intensity,nav_position")
          .eq("user_id", account.userId).maybeSingle();
        if (!error) { navigation=parseNavPosition(data?.nav_position)??DEFAULT_NAV_POSITION; theme = parseTheme(data?.theme) ?? DEFAULT_THEME; background=parseBackground(data?.background_pattern,data?.background_intensity)??DEFAULT_BACKGROUND; }
      }
    } catch {
      // Keep the planner usable; Settings reports preference-service errors.
    }
  }
  return <div className="theme-root" {...backgroundAttributes(background)} data-theme={theme} data-nav-position={navigation} style={themeVariables(theme) as CSSProperties}><FocusTimerProvider key={timerOwner ?? "signed-out"}><QuickCaptureProvider>{children}</QuickCaptureProvider></FocusTimerProvider></div>;
}
