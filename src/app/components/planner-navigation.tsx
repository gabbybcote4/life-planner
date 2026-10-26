import Link from "next/link";

export function PlannerNavigation({ active }: { active: "dashboard" | "tasks" | "calendar" | "notes" | "settings" }) {
  return <header className="planner-navigation">
    <Link className="brand" href="/">Life Planner</Link>
    <nav aria-label="Planner">
      <Link href="/" aria-current={active === "dashboard" ? "page" : undefined}>Dashboard</Link>
      <Link href="/tasks" aria-current={active === "tasks" ? "page" : undefined}>Tasks</Link>
      <Link href="/calendar" aria-current={active === "calendar" ? "page" : undefined}>Calendar</Link>
      <Link href="/notes" aria-current={active === "notes" ? "page" : undefined}>Notes</Link>
      <Link href="/settings" aria-current={active === "settings" ? "page" : undefined}>Settings</Link>
    </nav>
  </header>;
}
