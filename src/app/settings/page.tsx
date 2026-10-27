import {MobileSection} from "@/components/ui/mobile-section";
import {NavigationPicker} from "./navigation-picker";
import {DEFAULT_NAV_POSITION,parseNavPosition} from "@/lib/navigation";
import {BackgroundPicker} from "./background-picker";
import {DEFAULT_BACKGROUND,parseBackground} from "@/lib/themes/background";
import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_THEME, parseTheme } from "@/lib/themes/themes";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";
import { ThemePicker } from "./theme-picker";

async function SettingsContent() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { supabase, userId, email } = await requireAccount();
  const { data, error } = await supabase.from("planner_preferences").select("theme,background_pattern,background_intensity,background_revision,nav_position,nav_revision")
    .eq("user_id", userId).maybeSingle();
  return <>
    <PlannerHeading eyebrow="Make yourself at home" title="A planner that feels like you." description="Choose the colours you want to spend your day with." email={email} />
    {error ? <LoadError title="Your settings could not be loaded." description="The planner will use Sage until your saved settings can be loaded." action="/settings" /> :
      <><NavigationPicker key={"navigation-"+userId} saved={parseNavPosition(data?.nav_position)??DEFAULT_NAV_POSITION} revision={data?.nav_revision??1}/><MobileSection title="Colour theme"><ThemePicker key={userId} savedTheme={parseTheme(data?.theme) ?? DEFAULT_THEME} /></MobileSection><MobileSection title="Desktop background"><BackgroundPicker key={"background-"+userId} saved={parseBackground(data?.background_pattern,data?.background_intensity)??DEFAULT_BACKGROUND} revision={data?.background_revision??1}/></MobileSection></>}
  </>;
}

export default function SettingsPage() {
  return <PlannerPage active="settings" loading="Loading your settings...">
    <SettingsContent />
  </PlannerPage>;
}
