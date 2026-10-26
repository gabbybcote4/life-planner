"use client";

import { createRequestId } from "@/lib/shared/request-id";

import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";

import { FormFeedback } from "@/components/ui/feedback";
import { TextInput, TextArea } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { useActionState, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { NOTE_TITLE_LIMIT, NOTE_BODY_LIMIT, type Note, type NoteState } from "@/lib/notes/types";

type EditorProps = { note: Note | null; saveAction: (previous: NoteState, data: FormData) => Promise<NoteState>; destination: string; spaceId?: string };
export function PlainTextEditor({ note, saveAction, destination, spaceId }: EditorProps) {
  const fieldId = useId();
  const router = useRouter();
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [saved, setSaved] = useState({ title: note?.title ?? "", body: note?.body ?? "" });
  const [revision, setRevision] = useState(note?.revision ?? 1);
  const requestId = useRef<string | null>(null);
  const dirty = title !== saved.title || body !== saved.body;
  const [state, action, pending] = useActionState<NoteState, FormData>(async (previous, data) => {
    const result = await runAction(async () => {
      requestId.current ??= note?.id ?? createRequestId();
      data.set("id", requestId.current);
      data.set("revision", String(revision));
      if (spaceId) data.set("space_id", spaceId);
      return saveAction(previous, data);
    }, UNCONFIRMED_SAVE);
    if (!result.error && result.id && result.revision) {
      setSaved({ title, body });
      setRevision(result.revision);
      router.replace(`${destination}${result.id}`);
    }
    return result;
  }, {});

  return <section className="note-editor" aria-labelledby="note-editor-heading">
    <div className="notes-editor-heading"><h2 id="note-editor-heading">{note ? (spaceId ? "Your page" : "Your note") : "A fresh page"}</h2>
      <span className="muted">{pending ? "Saving..." : dirty ? "Unsaved changes" : note || state.id ? "Saved" : "Not saved yet"}</span>
    </div>
    <form action={action} className="note-form" aria-busy={pending}>
      <input type="hidden" name="mode" value={note ? "edit" : "create"} />
      <label htmlFor={`${fieldId}-title`}>Title</label>
      <TextInput id={`${fieldId}-title`} name="title" value={title} onChange={(event) => setTitle(Array.from(event.target.value).slice(0, NOTE_TITLE_LIMIT).join(""))}
        required maxLength={NOTE_TITLE_LIMIT * 2} readOnly={pending} placeholder="Give this thought a name..." autoComplete="off" />
      <label htmlFor={`${fieldId}-body`}>Text</label>
      <TextArea id={`${fieldId}-body`} name="body" value={body} onChange={(event) => setBody(Array.from(event.target.value).slice(0, NOTE_BODY_LIMIT).join(""))}
        maxLength={NOTE_BODY_LIMIT * 2} readOnly={pending} rows={16} placeholder="Ideas, plans, little reminders. This space is yours." />
      <p className="muted note-save-hint">Save before opening another page or leaving this screen. Drafts are not saved automatically.</p>
      <Button variant="primary" type="submit" disabled={pending || !title.trim() || (Boolean(note) && !dirty)} pending={pending} pendingLabel="Saving...">{spaceId ? "Save page" : "Save note"}</Button>
      <FormFeedback error={state.error} message={!dirty ? state.message : undefined} />
    </form>
  </section>;
}
