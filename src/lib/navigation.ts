export const PLANNER_ROUTES = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "tasks", label: "Tasks", href: "/tasks" },
  { id: "calendar", label: "Calendar", href: "/calendar" },
  { id: "notes", label: "Notes", href: "/notes" },
  { id: "spaces", label: "Spaces", href: "/spaces" },
  { id: "settings", label: "Settings", href: "/settings" },
] as const;
export type PlannerSection = typeof PLANNER_ROUTES[number]["id"];
