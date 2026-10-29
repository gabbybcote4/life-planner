export type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  due_date?: string | null;
  due_time?: string | null;
  due_timezone?: string | null;
  priority?: TaskPriority;
  planning_revision?: number;
  repeat_frequency?: TaskRepeat;
  repeat_anchor_day?: number | null;
  repeat_next_id?: string;
  repeat_parent_id?: string | null;
  repeat_rule?: import("./recurrence").RepeatRule | null;
  repeat_anchor_date?: string | null;
  repeat_index?: number;
  repeat_finished?: boolean;
  repeat_series_id?: string | null;
  repeat_scheduled_date?: string | null;
  space_id?: string | null;
  space?: {title:string} | null;
  projects?: {id:string;title:string}[];
  project_count?:number;
  projects_error?:boolean;
};

export type TaskActionState = {
  error?: string;
  message?: string;
};

export const TASK_TITLE_LIMIT = 200;

export function parseTaskTitle(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const title = value.trim();
  if (!title || Array.from(title).length > TASK_TITLE_LIMIT) return null;
  return title;
}


export const TASK_SELECT = "id,title,completed,created_at,due_date,due_time,due_timezone,priority,planning_revision,repeat_frequency,repeat_anchor_day,repeat_next_id,repeat_parent_id,repeat_rule,repeat_anchor_date,repeat_index,repeat_finished,repeat_series_id,repeat_scheduled_date,space_id,space:spaces(title)";

export const TASK_REPEATS = {none:"Does not repeat",daily:"Daily",weekdays:"Weekdays",weekly:"Weekly",monthly:"Monthly",yearly:"Yearly",custom:"Custom…"} as const;
export type TaskRepeat = keyof typeof TASK_REPEATS;
export function parseTaskRepeat(value:unknown):TaskRepeat|null {
  return typeof value === "string" && Object.hasOwn(TASK_REPEATS,value) ? value as TaskRepeat : null;
}

// No date/priority is a valid quick capture, not an inferred deadline or urgency.
export const TASK_PRIORITIES = { none: "No priority", low: "Low", medium: "Medium", high: "High" } as const;
export type TaskPriority = keyof typeof TASK_PRIORITIES;
export function parseTaskPriority(value: unknown): TaskPriority | null {
  return typeof value === "string" && Object.hasOwn(TASK_PRIORITIES, value) ? value as TaskPriority : null;
}
export type TaskPlanningState = TaskActionState & { revision?: number };
