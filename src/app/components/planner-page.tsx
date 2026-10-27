import type { ReactNode } from "react";
import { Suspense } from "react";
import type { PlannerSection } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { PlannerNavigation } from "./planner-navigation";
import { SignOutButton } from "../sign-out-button";

const cards: Record<PlannerSection, string> = {
  dashboard: "dashboard-card", tasks: "planner-card", calendar: "calendar-card", notes: "notes-card", settings: "settings-card", spaces: "notes-card", search: "notes-card",
};

export function PlannerPage({ active, loading, children }: { active: PlannerSection; loading: string; children: ReactNode }) {
  return <><a className="skip-link" href="#planner-main">Skip to main content</a>
    <main id="planner-main" tabIndex={-1} className="planner-shell">
    <section className={`paper-card ${cards[active]}`} aria-label={`Your Life Planner ${active}`}>
      <PlannerNavigation active={active} />
      <Suspense fallback={<p role="status">{loading}</p>}>{children}</Suspense>
    </section>
  </main></>;
}

export function PlannerHeading({ eyebrow, title, description, email, className = "" }: {
  eyebrow: string; title: string; description: string; email: string; className?: string;
}) {
  return <div className={`planner-intro ${className}`.trim()}>
    <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro">{description}</p></div>
    <div className="planner-account"><p className="muted">{email}</p><SignOutButton /></div>
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
