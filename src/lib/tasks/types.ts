export type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  due_date?: string | null;
  priority?: TaskPriority;
  planning_revision?: number;
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


export const TASK_SELECT = "id,title,completed,created_at,due_date,priority,planning_revision,space_id,space:spaces(title)";

// No date/priority is a valid quick capture, not an inferred deadline or urgency.
export const TASK_PRIORITIES = { none: "No priority", low: "Low", medium: "Medium", high: "High" } as const;
export type TaskPriority = keyof typeof TASK_PRIORITIES;
export function parseTaskPriority(value: unknown): TaskPriority | null {
  return typeof value === "string" && Object.hasOwn(TASK_PRIORITIES, value) ? value as TaskPriority : null;
}
export type TaskPlanningState = TaskActionState & { revision?: number };
