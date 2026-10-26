import Link from "next/link";
import { PLANNER_ROUTES, type PlannerSection } from "@/lib/navigation";

export function PlannerNavigation({ active }: { active: PlannerSection }) {
  return <header className="planner-navigation">
    <Link className="brand" href="/">Life Planner</Link>
    <nav aria-label="Planner">{PLANNER_ROUTES.map((route) =>
      <Link key={route.id} href={route.href} aria-current={active === route.id ? "page" : undefined}>{route.label}</Link>
    )}</nav>
  </header>;
}
