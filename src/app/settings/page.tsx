import {ExportPanel} from "./export-panel";
import {PlanningPicker} from "./planning-picker";
import {DEFAULT_PLANNING,validPlanning} from "@/lib/calendar/preferences";
import Link from "next/link";
import {SignOutButton} from "@/app/sign-out-button";
import {SettingsTabs} from "./settings-tabs";
import {DisplayPicker} from "./display-picker";
import {DEFAULT_DISPLAY,validDisplay} from "@/lib/themes/display";
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
  const displayRead=await supabase.from("planner_preferences").select("font_preset,text_size,app_zoom,reduce_motion,strong_focus,simple_background,text_revision,zoom_revision,accessibility_revision").eq("user_id",userId).maybeSingle();
  const display=validDisplay(displayRead.data)?displayRead.data:DEFAULT_DISPLAY;
  const ready=!displayRead.error;
  const planningRead=await supabase.from("planner_preferences").select("week_start,date_format,show_task_timezones,planning_revision").eq("user_id",userId).maybeSingle();
  return <>
    <PlannerHeading eyebrow="Make yourself at home" title="A planner that feels like you." description="Your look · your workspace · your preferences" email={email} />
    {error ? <LoadError title="Your settings could not be loaded." description="The planner will use Sage until your saved settings can be loaded." action="/settings" /> :
      <SettingsTabs key={userId} panels={{
       appearance:<><h2>Appearance</h2><div className="settings-groups">
        <details className="settings-group" name="appearance"><summary>Colours <span>Light & dark themes</span></summary><ThemePicker key={userId} savedTheme={parseTheme(data?.theme)??DEFAULT_THEME}/></details>
        <details className="settings-group" name="appearance"><summary>Background <span>Pattern & intensity</span></summary><BackgroundPicker key={"background-"+userId} saved={parseBackground(data?.background_pattern,data?.background_intensity)??DEFAULT_BACKGROUND} revision={data?.background_revision??1}/></details>
        <details className="settings-group" name="appearance"><summary>Fonts & text <span>Font style & reading size</span></summary><DisplayPicker group="text" saved={display} revision={displayRead.data?.text_revision??1} ready={ready}/></details>
        <details className="settings-group" name="appearance"><summary>Zoom <span>Scale the whole app</span></summary><DisplayPicker group="zoom" saved={display} revision={displayRead.data?.zoom_revision??1} ready={ready}/></details>
       </div></>,
       workspace:<><h2>Workspace</h2><details className="settings-group" name="workspace" open><summary>Planning <span>Calendar weeks · dates · time zones</span></summary><PlanningPicker saved={validPlanning(planningRead.data)?planningRead.data:DEFAULT_PLANNING} revision={planningRead.data?.planning_revision??1} ready={!planningRead.error}/></details><details className="settings-group" name="workspace"><summary>Navigation <span>Left · right · top · bottom</span></summary><NavigationPicker saved={parseNavPosition(data?.nav_position)??DEFAULT_NAV_POSITION} revision={data?.nav_revision??1}/></details><section className="settings-info"><h3>Dashboard</h3><Link className="text-link" href="/">Open dashboard →</Link><p className="muted">Pencil → widgets, order & sizes</p></section><details className="settings-future"><summary>Planned workspace settings</summary><p className="muted">Default views · optional modules · reminders · integrations</p></details></>,
       account:<><h2>Account</h2><dl className="settings-facts"><dt>Signed in as</dt><dd>{email}</dd></dl><SignOutButton/><details className="settings-future"><summary>Planned account settings</summary><p className="muted">Profile · password & sessions · connected sign-in methods</p></details></>,
       privacy:<><h2>Data & privacy</h2><ExportPanel/><dl className="settings-facts"><dt>Current access</dt><dd>Private to your account</dd><dt>Storage</dt><dd>Supabase</dd><dt>Sharing</dt><dd>Not enabled</dd></dl><details className="settings-future"><summary>Planned data controls</summary><p className="muted">Import · backups & recovery · history · account deletion · selective sharing · AI permissions · offline data</p><p className="muted">These controls are not available yet.</p></details></>,
       accessibility:<><DisplayPicker group="accessibility" saved={display} revision={displayRead.data?.accessibility_revision??1} ready={ready}/><p className="muted">Keyboard: Tab to move · Enter to choose · Escape to close popups. Text size is under Appearance → Fonts & text. Device reduced-motion settings also apply.</p></>,
       about:<><h2>About Life Planner</h2><p>Your connected personal planner.</p><ul className="settings-about-list"><li>Tasks · habits · calendar</li><li>Notes · spaces · projects</li><li>Private account data in Supabase</li></ul><p className="muted">Saved settings follow your account. This planner is in active development; voice capture, AI and offline support remain future work.</p><p className="muted">Browser zoom: Ctrl + plus/minus · Ctrl + 0 to reset.</p></>
      }}/>}
  </>;
}

export default function SettingsPage() {
  return <PlannerPage active="settings" loading="Loading your settings...">
    <SettingsContent />
  </PlannerPage>;
}
