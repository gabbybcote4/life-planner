export type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  space_id?: string | null;
  space?: {title:string} | null;
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


export const TASK_SELECT = "id,title,completed,created_at,space_id,space:spaces(title)";
