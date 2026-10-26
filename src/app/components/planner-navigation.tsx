import Link from "next/link";

export function PlannerNavigation({ active }: { active: "dashboard" | "tasks" | "calendar" }) {
  return <header className="planner-navigation">
    <Link className="brand" href="/">Life Planner</Link>
    <nav aria-label="Planner">
      <Link href="/" aria-current={active === "dashboard" ? "page" : undefined}>Dashboard</Link>
      <Link href="/tasks" aria-current={active === "tasks" ? "page" : undefined}>Tasks</Link>
      <Link href="/calendar" aria-current={active === "calendar" ? "page" : undefined}>Calendar</Link>
    </nav>
  </header>;
}
