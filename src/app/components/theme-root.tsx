import {DEFAULT_PLANNING,validPlanning} from "@/lib/calendar/preferences";
import {PlanningProvider} from "./planning-preferences";
import {DEFAULT_DISPLAY,validDisplay,displayVariables} from "@/lib/themes/display";
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
  let display=DEFAULT_DISPLAY;
  let planning=DEFAULT_PLANNING;
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
        const displayRead=await account.supabase.from("planner_preferences").select("font_preset,text_size,app_zoom,reduce_motion,strong_focus,simple_background").eq("user_id",account.userId).maybeSingle();
        if(!displayRead.error&&validDisplay(displayRead.data))display=displayRead.data;
        const planningRead=await account.supabase.from("planner_preferences").select("week_start,date_format").eq("user_id",account.userId).maybeSingle();
        if(!planningRead.error&&validPlanning(planningRead.data))planning=planningRead.data;
      }
    } catch {
      // Keep the planner usable; Settings reports preference-service errors.
    }
  }
  return <div className="theme-root" {...backgroundAttributes(background)} data-theme={theme} data-nav-position={navigation} data-text-size={display.text_size} data-reduce-motion={display.reduce_motion} data-strong-focus={display.strong_focus} data-simple-background={display.simple_background} style={{...themeVariables(theme),...displayVariables(display)} as CSSProperties}><FocusTimerProvider key={timerOwner ?? "signed-out"}><QuickCaptureProvider><PlanningProvider value={planning}>{children}</PlanningProvider></QuickCaptureProvider></FocusTimerProvider></div>;
}
