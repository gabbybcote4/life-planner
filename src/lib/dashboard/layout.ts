export const WIDGETS = {
  spaces: {label:"Your spaces",description:"Illustrated shortcuts to your first three saved spaces."},
  calendar: {label:"Calendar & upcoming",description:"A compact month and your next five all-day events (UTC)."},
  connections: {label:"Connection map",description:"A preview of saved links between your first twelve notes and pages."},
  overview: { label: "Task overview", description: "Your open, completed, and total task counts." },
  capture: { label: "Quick add", description: "Capture a new task from your dashboard." },
  progress: { label: "Task progress", description: "See progress across your saved tasks." },
  recent: { label: "Recent tasks", description: "View and edit your five most recently added tasks." },
};
export type WidgetId = keyof typeof WIDGETS;
export const WIDGET_ACCENTS = {pink:"Pink",mint:"Mint",blue:"Blue",yellow:"Butter",lilac:"Lilac"};
export type WidgetAccent = keyof typeof WIDGET_ACCENTS;
export function isWidgetAccent(value:unknown):value is WidgetAccent {return typeof value==="string"&&Object.hasOwn(WIDGET_ACCENTS,value);}
export type Widget = { id: WidgetId; width: "half" | "full"; accent?:WidgetAccent };
export type LayoutState = { error?: string; message?: string; revision?: number };
export const LEGACY_LAYOUT: Widget[] = [
  { id: "overview", width: "full" }, { id: "capture", width: "half" },
  { id: "progress", width: "half" }, { id: "recent", width: "full" },
];

export const DEFAULT_LAYOUT:Widget[] = [{id:"spaces",width:"full"},...LEGACY_LAYOUT.map(widget=>({...widget})),{id:"calendar",width:"half"},{id:"connections",width:"full"}];
export function addWorkspaceWidgets(layout:Widget[]):Widget[] {
 const additions:Widget[]=[{id:"spaces",width:"full"},{id:"calendar",width:"half"},{id:"connections",width:"full"}];
 return [...layout.map(widget=>({...widget})),...additions.filter(widget=>!layout.some(saved=>saved.id===widget.id))];
}

export function parseLayout(value: unknown): Widget[] | null {
  if (!Array.isArray(value) || value.length > Object.keys(WIDGETS).length) return null;
  const seen = new Set<string>();
  const result: Widget[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item) || (Object.keys(item).length < 2 || Object.keys(item).length > 3 || Object.keys(item).some(key=>!["id","width","accent"].includes(key)))) return null;
    if (!Object.hasOwn(item, "id") || !Object.hasOwn(item, "width")) return null;
    if (typeof item.id !== "string" || !Object.hasOwn(WIDGETS, item.id) || seen.has(item.id)) return null;
    if (item.width !== "half" && item.width !== "full") return null;
    if (Object.hasOwn(item,"accent") && !isWidgetAccent(item.accent)) return null;
    seen.add(item.id);
    result.push({ id: item.id as WidgetId, width: item.width, ...(Object.hasOwn(item,"accent") ? {accent:item.accent as WidgetAccent}: {}) });
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

export function setWidgetAccent(layout:Widget[],id:WidgetId,accent:unknown):Widget[] {
 if(accent!=="auto"&&!isWidgetAccent(accent))return layout;
 return layout.map(widget=>{const next={...widget};if(next.id===id){if(accent==="auto")delete next.accent;else next.accent=accent;}return next;});
}
export function clearWidgetAccents(layout:Widget[]):Widget[] {return layout.map(widget=>{const next={...widget};delete next.accent;return next;});}
