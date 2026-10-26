import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_THEME, parseTheme } from "@/lib/themes/themes";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";
import { ThemePicker } from "./theme-picker";

async function SettingsContent() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { supabase, userId, email } = await requireAccount();
  const { data, error } = await supabase.from("planner_preferences").select("theme")
    .eq("user_id", userId).maybeSingle();
  return <>
    <PlannerHeading eyebrow="Make yourself at home" title="A planner that feels like you." description="Choose the colours you want to spend your day with." email={email} />
    {error ? <LoadError title="Your settings could not be loaded." description="The planner will use Sage until your saved settings can be loaded." action="/settings" /> :
      <ThemePicker key={userId} savedTheme={parseTheme(data?.theme) ?? DEFAULT_THEME} />}
  </>;
}

export default function SettingsPage() {
  return <PlannerPage active="settings" loading="Loading your settings...">
    <SettingsContent />
  </PlannerPage>;
}
