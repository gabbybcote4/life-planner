// Sidebar text lives here. Change labels freely; route ids/hrefs also affect
// active pages and the protected-route list in src/proxy.ts.
export const PLANNER_ROUTES = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "tasks", label: "Tasks", href: "/tasks" },
  { id: "calendar", label: "Calendar", href: "/calendar" },
  { id: "notes", label: "Notes", href: "/notes" },
  { id: "spaces", label: "Spaces", href: "/spaces" },
  { id: "search", label: "Search", href: "/search" },
  { id: "settings", label: "Settings", href: "/settings" },
] as const;
export type PlannerSection = typeof PLANNER_ROUTES[number]["id"];

// Saved positions are a database contract; labels can change without changing keys.
export const NAV_POSITIONS = { left: "Left", right: "Right", top: "Top", bottom: "Bottom" } as const;
export type NavPosition = keyof typeof NAV_POSITIONS;
export const DEFAULT_NAV_POSITION: NavPosition = "left";
export function parseNavPosition(value: unknown): NavPosition | null {
  return typeof value === "string" && Object.hasOwn(NAV_POSITIONS, value) ? value as NavPosition : null;
}
export const MOBILE_PRIMARY_ROUTES = PLANNER_ROUTES.filter(route =>
  route.id === "dashboard" || route.id === "tasks" || route.id === "calendar");
