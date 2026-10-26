"use client";

import { useActionState, useId, useRef, useState } from "react";
import { addTask, renameTask, setTaskCompleted } from "./actions";
import { TASK_TITLE_LIMIT, type Task, type TaskActionState } from "@/lib/tasks/types";

export function TaskBoard({ tasks, hasMore }: { tasks: Task[]; hasMore: boolean }) {
  const remaining = tasks.filter((task) => !task.completed).length;
  return <section className="task-board" aria-labelledby="tasks-heading">
    <header className="tasks-heading">
      <div><p className="eyebrow">One thing at a time</p><h2 id="tasks-heading">Your tasks</h2></div>
      <span className="task-count">{remaining} to do{hasMore ? " shown" : ""}</span>
    </header>
    <AddTaskForm />
    {tasks.length === 0 ? <div className="task-empty">
      <p className="empty-title">A little room to begin.</p>
      <p className="muted">Add your first task above. Small steps count.</p>
    </div> : <ul className="task-list" aria-label="Saved tasks">
      {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
    </ul>}
    {hasMore && <p className="muted">Showing your 200 most recent tasks. Older tasks remain saved.</p>}
  </section>;
}

function AddTaskForm() {
  const inputId = useId();
  const [title, setTitle] = useState("");
  const requestId = useRef<string | null>(null);
  const [state, action, pending] = useActionState<TaskActionState, FormData>(async (previous, data) => {
    requestId.current ??= crypto.randomUUID();
    data.set("id", requestId.current);
    const result = await addTask(previous, data);
    if (!result.error) {
      setTitle("");
      requestId.current = null;
    }
    return result;
  }, {});

  return <form action={action} className="add-task-form" aria-busy={pending}>
    <label htmlFor={inputId}>What would you like to get done?</label>
    <div className="add-task-controls">
      <input id={inputId} name="title" value={title} onChange={(event) => setTitle(event.target.value)}
        placeholder="A small step for today..." required maxLength={TASK_TITLE_LIMIT}
        readOnly={pending} autoComplete="off" />
      <button className="primary-button" type="submit" disabled={pending || !title.trim()}>
        {pending ? "Saving..." : "Add task"}
      </button>
    </div>
    <TaskFeedback state={state} pending={pending} />
  </form>;
}

function TaskRow({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [state, action, pending] = useActionState<TaskActionState, FormData>(setTaskCompleted, {});

  return <li className={`task-row${task.completed ? " is-complete" : ""}`}>
    <div className="task-main">
      <form action={action} aria-busy={pending} onSubmit={() => setEditMessage("")}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="completed" value={String(!task.completed)} />
        <button type="submit" role="checkbox" aria-checked={task.completed}
          aria-label={`${task.completed ? "Reopen" : "Complete"} task: ${task.title}`}
          className="task-checkbox" disabled={pending || editing}>
          <span aria-hidden="true">{pending ? "…" : task.completed ? "✓" : ""}</span>
        </button>
      </form>
      {editing ? <EditTaskForm task={task} onCancel={() => setEditing(false)}
        onSaved={() => { setEditing(false); setEditMessage("Changes saved."); }} /> : <>
        <span className="task-title">{task.title}</span>
        <button className="task-edit-button" type="button" disabled={pending}
          aria-label={`Edit task: ${task.title}`}
          onClick={() => { setEditMessage(""); setEditing(true); }}>Edit</button>
      </>}
    </div>
    {!editing && <TaskFeedback state={editMessage ? { message: editMessage } : state} pending={pending} />}
  </li>;
}

function EditTaskForm({ task, onCancel, onSaved }: {
  task: Task; onCancel: () => void; onSaved: () => void;
}) {
  const inputId = useId();
  const [title, setTitle] = useState(task.title);
  const [state, action, pending] = useActionState<TaskActionState, FormData>(async (previous, data) => {
    const result = await renameTask(previous, data);
    if (!result.error) onSaved();
    return result;
  }, {});

  return <form action={action} className="edit-task-form" aria-busy={pending}>
    <input type="hidden" name="id" value={task.id} />
    <label htmlFor={inputId}>Edit task</label>
    <input id={inputId} name="title" value={title} onChange={(event) => setTitle(event.target.value)}
      required maxLength={TASK_TITLE_LIMIT} readOnly={pending} autoFocus />
    <div className="edit-task-controls">
      <button type="submit" className="primary-button" disabled={pending || !title.trim()}>{pending ? "Saving..." : "Save changes"}</button>
      <button type="button" className="task-edit-button" disabled={pending} onClick={onCancel}>Cancel</button>
    </div>
    <TaskFeedback state={state} pending={pending} />
  </form>;
}

function TaskFeedback({ state, pending }: { state: TaskActionState; pending: boolean }) {
  return <div className="task-feedback" aria-live="polite" aria-atomic="true">
    {pending ? <p className="muted">Saving...</p> : state.error ?
      <p className="form-error" role="alert">{state.error}</p> : state.message ?
        <p className="save-message">{state.message}</p> : null}
  </div>;
}

