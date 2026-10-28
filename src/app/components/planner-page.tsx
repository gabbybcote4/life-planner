import {QuickCaptureButton} from "@/app/inbox/quick-capture";
import type {SpaceChoice} from "@/lib/inbox/types";
import { FocusTimerStatus } from "@/app/dashboard/focus-timer";
import type { ReactNode } from "react";
import { Suspense } from "react";
import type { PlannerSection } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { PlannerNavigation } from "./planner-navigation";
import { SignOutButton } from "../sign-out-button";

const cards: Record<PlannerSection, string> = {
  projects: "notes-card", today: "dashboard-card", habits: "planner-card", inbox: "notes-card", dashboard: "dashboard-card", tasks: "planner-card", calendar: "calendar-card", notes: "notes-card", settings: "settings-card", spaces: "notes-card", search: "notes-card",
};

export function PlannerPage({ active, loading, children }: { active: PlannerSection; loading: string; children: ReactNode }) {
  return <><a className="skip-link" href="#planner-main">Skip to main content</a>
    <div className="desktop-app">
    <PlannerNavigation active={active} />
    <main id="planner-main" tabIndex={-1} className="planner-shell desktop-main">
    <section className={`paper-card ${cards[active]}`} aria-label={`Your Life Planner ${active}`}>

      <Suspense fallback={<p role="status">{loading}</p>}>{children}</Suspense>
    </section>
  </main></div></>;
}

export function PlannerHeading({ eyebrow, title, description, email, captureSpace, className = "" }: {
  eyebrow: string; title: string; description: string; email: string; captureSpace?: SpaceChoice; className?: string;
}) {
  return <div className={`planner-intro ${className}`.trim()}>
    <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro">{description}</p></div>
    <div className="planner-account"><p className="muted">{email}</p><QuickCaptureButton space={captureSpace}/><SignOutButton /><FocusTimerStatus /></div>
  </div>;
}

export function SetupNotice() {
  return <p className="form-message">Your planner is being set up. Sign-in will be available soon.</p>;
}

export function LoadError({ title, description, action, params = {} }: {
  title: string; description: string; action: string; params?: Record<string, string>;
}) {
  return <section className="task-load-error" aria-label={title}>
    <h2>{title}</h2><p className="muted">{description}</p>
    <form action={action} method="get">
      {Object.entries(params).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <Button variant="secondary" type="submit">Try again</Button>
    </form>
  </section>;
}
