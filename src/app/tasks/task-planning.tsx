"use client";
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput, Select } from "@/components/ui/fields";
import { FormFeedback } from "@/components/ui/feedback";
import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";
import { TASK_PRIORITIES, type Task, type TaskPriority, type TaskPlanningState } from "@/lib/tasks/types";
import { formatCalendarDate } from "@/lib/calendar/dates";
import { saveTaskPlanning } from "./planning-actions";

// One planning control is shared by Tasks, dashboard lists, and space task lists.
export function TaskPlanning({ task, disabled, expanded = false, onSaved }: { task: Task; disabled: boolean; expanded?: boolean; onSaved?:()=>void }) {
  const field = useId();
  const [dueDate, setDueDate] = useState(task.due_date ?? ""), [priority, setPriority] = useState<TaskPriority>(task.priority ?? "none");
  const [confirmed, setConfirmed] = useState({ dueDate: task.due_date ?? "", priority: task.priority ?? "none" });
  const [revision, setRevision] = useState(task.planning_revision ?? 1);
  const changed = dueDate !== confirmed.dueDate || priority !== confirmed.priority;
  const [state, action, pending] = useActionState<TaskPlanningState, FormData>(async (previous, data) => {
    const result = await runAction(() => saveTaskPlanning(previous, data), UNCONFIRMED_SAVE);
    if (!result.error && result.revision) { setRevision(result.revision); setConfirmed({ dueDate, priority });onSaved?.(); }
    return result;
  }, {});
  return <details className="task-planning" open={expanded}><summary>
    {task.due_date || (task.priority && task.priority !== "none") ? <span className="task-plan-badges">
      {task.due_date && <span>Due <time dateTime={task.due_date}>{formatCalendarDate(task.due_date)}</time></span>}
      {task.priority && task.priority !== "none" && <span className="task-priority" data-priority={task.priority}>{TASK_PRIORITIES[task.priority]} priority</span>}
      <span className="muted">Edit plan</span>
    </span> : "Add a date or priority"}
  </summary><form action={action} aria-busy={pending}>
    <input type="hidden" name="id" value={task.id} /><input type="hidden" name="revision" value={revision} />
    <fieldset disabled={disabled || pending}>
      <label htmlFor={field + "-date"}>Due date (optional)</label>
      <TextInput id={field + "-date"} name="due_date" type="date" min="1900-01-01" max="2100-12-31" value={dueDate} onChange={event => setDueDate(event.target.value)} />
      <label htmlFor={field + "-priority"}>Priority</label>
      <Select id={field + "-priority"} name="priority" value={priority} onChange={event => setPriority(event.target.value as TaskPriority)}>{Object.entries(TASK_PRIORITIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <p className="muted">Leave these blank/default when you just need to capture a task. A date is a planning cue, not a calendar event or reminder.</p>
      <div className="task-plan-controls"><Button variant="primary" type="submit" disabled={!changed} pending={pending} pendingLabel="Saving...">Save task plan</Button>
        <Button variant="text" disabled={!changed} onClick={() => { setDueDate(confirmed.dueDate); setPriority(confirmed.priority); }}>Cancel changes</Button>
        <Button variant="text" onClick={() => { setDueDate(""); setPriority("none"); }}>Clear date &amp; priority</Button></div>
    </fieldset>
    <FormFeedback error={state.error} message={!changed ? state.message : undefined} />
  </form></details>;
}
