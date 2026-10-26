export const WIDGETS = {
  overview: { label: "Task overview", description: "Your open, completed, and total task counts." },
  capture: { label: "Quick add", description: "Capture a new task from your dashboard." },
  progress: { label: "Task progress", description: "See progress across your saved tasks." },
  recent: { label: "Recent tasks", description: "View and edit your five most recently added tasks." },
};
export type WidgetId = keyof typeof WIDGETS;
export type Widget = { id: WidgetId; width: "half" | "full" };
export type LayoutState = { error?: string; message?: string; revision?: number };
export const DEFAULT_LAYOUT: Widget[] = [
  { id: "overview", width: "full" }, { id: "capture", width: "half" },
  { id: "progress", width: "half" }, { id: "recent", width: "full" },
];

export function parseLayout(value: unknown): Widget[] | null {
  if (!Array.isArray(value) || value.length > Object.keys(WIDGETS).length) return null;
  const seen = new Set<string>();
  const result: Widget[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).length !== 2) return null;
    if (!Object.hasOwn(item, "id") || !Object.hasOwn(item, "width")) return null;
    if (typeof item.id !== "string" || !Object.hasOwn(WIDGETS, item.id) || seen.has(item.id)) return null;
    if (item.width !== "half" && item.width !== "full") return null;
    seen.add(item.id);
    result.push({ id: item.id as WidgetId, width: item.width });
  }
  return result;
}

export function parseLayoutRevision(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^(0|[1-9]\d{0,8})$/.test(value) ? Number(value) : null;
}

export function moveWidget(layout: Widget[], id: WidgetId, direction: -1 | 1): Widget[] {
  const index = layout.findIndex((widget) => widget.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= layout.length) return layout;
  const moved = [...layout];
  [moved[index], moved[next]] = [moved[next], moved[index]];
  return moved;
}
