"use client";

import { createRequestId } from "@/lib/shared/request-id";

import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";

import Link from "next/link";
import {TaskSpaceAssignment} from "./task-space-assignment";
import { EmptyState } from "@/components/ui/empty-state";
import { FormFeedback } from "@/components/ui/feedback";
import { TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
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
    {tasks.length === 0 ? <EmptyState title="A little room to begin.">Add your first task above. Small steps count.</EmptyState> : <TaskList tasks={tasks} />}
    {hasMore && <p className="muted">Showing your 200 most recent tasks. Older tasks remain saved.</p>}
  </section>;
}

export function AddTaskForm({spaceId}:{spaceId?:string} = {}) {
  const inputId = useId();
  const [title, setTitle] = useState("");
  const requestId = useRef<string | null>(null);
  const [state, action, pending] = useActionState<TaskActionState, FormData>(async (previous, data) => {
    const result = await runAction(async () => {
      requestId.current ??= createRequestId();
      data.set("id", requestId.current);
      return addTask(previous, data);
    }, UNCONFIRMED_SAVE);
    if (!result.error) {
      setTitle("");
      requestId.current = null;
    }
    return result;
  }, {});

  return <form action={action} className="add-task-form" aria-busy={pending}>
    {spaceId && <input type="hidden" name="space_id" value={spaceId}/>}
    <label htmlFor={inputId}>What would you like to get done?</label>
    <div className="add-task-controls">
      <TextInput id={inputId} name="title" value={title} onChange={(event) => setTitle(event.target.value)}
        placeholder="A small step for today..." required maxLength={TASK_TITLE_LIMIT}
        readOnly={pending} autoComplete="off" />
      <Button variant="primary" type="submit" disabled={pending || !title.trim()} pending={pending} pendingLabel="Saving...">Add task</Button>
    </div>
    <FormFeedback {...state} pending={pending} className="task-feedback" />
  </form>;
}

function TaskRow({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [state, action, pending] = useActionState<TaskActionState, FormData>((previous, data) => runAction(() => setTaskCompleted(previous, data), { error: "We could not confirm this change. Check your connection and try again." }), {});

  return <li className={`task-row${task.completed ? " is-complete" : ""}`}>
    <div className="task-main">
      <form action={action} aria-busy={pending} onSubmit={() => setEditMessage("")}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="completed" value={String(!task.completed)} />
        <Button type="submit" role="checkbox" aria-checked={task.completed}
          aria-label={`${task.completed ? "Reopen" : "Complete"} task: ${task.title}`}
          className="task-checkbox" disabled={pending || editing}>
          <span aria-hidden="true">{pending ? "…" : task.completed ? "✓" : ""}</span>
        </Button>
      </form>
      {editing ? <EditTaskForm task={task} onCancel={() => setEditing(false)}
        onSaved={() => { setEditing(false); setEditMessage("Changes saved."); }} /> : <>
        <span className="task-title">{task.title}</span>
        <Button variant="text" type="button" disabled={pending}
          aria-label={`Edit task: ${task.title}`}
          onClick={() => { setEditMessage(""); setEditing(true); }}>Edit</Button>
      </>}
    </div>
    {task.space_id && task.space && <p className="muted">Space: <Link className="text-link" href={"/spaces?space="+task.space_id}>{task.space.title}</Link></p>}
    <TaskSpaceAssignment task={task} disabled={pending||editing}/>
    {!editing && <FormFeedback {...(editMessage ? { message: editMessage } : state)} pending={pending} className="task-feedback" />}
  </li>;
}

function EditTaskForm({ task, onCancel, onSaved }: {
  task: Task; onCancel: () => void; onSaved: () => void;
}) {
  const inputId = useId();
  const [title, setTitle] = useState(task.title);
  const [state, action, pending] = useActionState<TaskActionState, FormData>(async (previous, data) => {
    const result = await runAction(() => renameTask(previous, data), UNCONFIRMED_SAVE);
    if (!result.error) onSaved();
    return result;
  }, {});

  return <form action={action} className="edit-task-form" aria-busy={pending}>
    <input type="hidden" name="id" value={task.id} />
    <label htmlFor={inputId}>Edit task</label>
    <TextInput id={inputId} name="title" value={title} onChange={(event) => setTitle(event.target.value)}
      required maxLength={TASK_TITLE_LIMIT} readOnly={pending} autoFocus />
    <div className="edit-task-controls">
      <Button type="submit" variant="primary" disabled={pending || !title.trim()} pending={pending} pendingLabel="Saving...">Save changes</Button>
      <Button type="button" variant="text" disabled={pending} onClick={onCancel}>Cancel</Button>
    </div>
    <FormFeedback {...state} pending={pending} className="task-feedback" />
  </form>;
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return <ul className="task-list" aria-label="Saved tasks">
    {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
  </ul>;
}
