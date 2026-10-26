"use client";

import { useActionState, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createRequestId } from "@/lib/shared/request-id";
import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";
import { FormFeedback } from "@/components/ui/feedback";
import { TextInput, TextArea } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { LinkPicker } from "@/app/knowledge/link-picker";
import { LinkedText } from "@/app/knowledge/linked-text";
import { resolveLinkPreview } from "@/app/knowledge/actions";
import { insertLink, linkMarker, type LinkTarget, type LinkPreview } from "@/lib/knowledge/links";
import { NOTE_TITLE_LIMIT, NOTE_BODY_LIMIT, type Note, type NoteState } from "@/lib/notes/types";

type EditorProps = { note: Note | null; saveAction: (previous: NoteState, data: FormData) => Promise<NoteState>; destination: string; spaceId?: string; initialPreview?: LinkPreview };
export function PlainTextEditor({ note, saveAction, destination, spaceId, initialPreview = {items:[]} }: EditorProps) {
  const fieldId = useId(), router = useRouter();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [linkNotice, setLinkNotice] = useState<{error?:string;message?:string}>({});
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [saved, setSaved] = useState({ title: note?.title ?? "", body: note?.body ?? "" });
  const [revision, setRevision] = useState(note?.revision ?? 1);
  const [reading, setReading] = useState(Boolean(note));
  const [preview, setPreview] = useState<LinkPreview>(initialPreview);
  const requestId = useRef<string | null>(null);
  const dirty = title !== saved.title || body !== saved.body;
  const [previewState, readAction, previewPending] = useActionState<LinkPreview,FormData>(async (_previous,data)=>{
    const result = await runAction(()=>resolveLinkPreview(data),{items:[],error:"We could not check these links. Your text is still here. Try Read again."});
    setPreview(result);setReading(true);return result;
  },initialPreview);
  const [state, action, pending] = useActionState<NoteState, FormData>(async (previous, data) => {
    const result = await runAction(async () => {
      requestId.current ??= note?.id ?? createRequestId();
      data.set("id", requestId.current);
      data.set("revision", String(revision));
      if (spaceId) data.set("space_id", spaceId);
      return saveAction(previous, data);
    }, UNCONFIRMED_SAVE);
    if (!result.error && result.id && result.revision) {
      setSaved({ title, body });setRevision(result.revision);
      const form = new FormData();form.set("body",body);
      const resolved = await runAction(()=>resolveLinkPreview(form),{items:[],error:"Your text was saved, but its links could not be checked. Try Read again."});
      setPreview(resolved);setReading(true);setLinkNotice({});
      router.replace(`${destination}${result.id}`);
    }
    return result;
  }, {});
  const busy = pending || previewPending;
  function addLink(target: LinkTarget) {
    const textarea = textRef.current;
    const result = insertLink(body, linkMarker(target), textarea?.selectionStart ?? body.length, textarea?.selectionEnd ?? body.length);
    if (!result) { setLinkNotice({error:"This link would exceed the text limit. Shorten your draft first."}); return; }
    setBody(result.text);setLinkNotice({message:"Link inserted. Save to see and follow it in Read view."});
    requestAnimationFrame(() => { textarea?.focus(); textarea?.setSelectionRange(result.caret,result.caret); });
  }
  return <section className="note-editor" aria-labelledby="note-editor-heading">
    <div className="notes-editor-heading"><h2 id="note-editor-heading">{note ? (spaceId ? "Your page" : "Your note") : "A fresh page"}</h2>
      <span className="muted">{pending ? "Saving..." : dirty ? "Unsaved changes" : note || state.id ? "Saved" : "Not saved yet"}</span>
    </div>
    <form action={readAction} className="text-view-controls" aria-label="Text view">
      <input type="hidden" name="body" value={body}/>
      <Button type="submit" variant="secondary" disabled={pending} pending={previewPending} pendingLabel="Opening..." aria-pressed={reading}>Read</Button>
      <Button variant="secondary" disabled={busy} aria-pressed={!reading} onClick={()=>setReading(false)}>Edit</Button>
    </form>
    {reading && <section aria-label="Readable text" className="text-reading-view">
      <h3>{title || "Untitled"}</h3>
      {dirty && <p className="muted">This is your unsaved draft. Save before following links.</p>}
      <FormFeedback error={preview.error}/>
      {body ? <LinkedText body={body} targets={preview.items}/> : <p className="muted">This page is empty. Choose Edit to start writing.</p>}
      {dirty && <Button variant="text" disabled={busy} onClick={()=>setReading(false)}>Return to editing to save</Button>}
    </section>}
    <form action={action} className="note-form" aria-busy={pending} hidden={reading}>
      <input type="hidden" name="mode" value={note ? "edit" : "create"} />
      <label htmlFor={`${fieldId}-title`}>Title</label>
      <TextInput id={`${fieldId}-title`} name="title" value={title} onChange={(event) => setTitle(Array.from(event.target.value).slice(0, NOTE_TITLE_LIMIT).join(""))}
        required maxLength={NOTE_TITLE_LIMIT * 2} readOnly={busy} placeholder="Give this thought a name..." autoComplete="off" />
      <label htmlFor={`${fieldId}-body`}>Text</label>
      <TextArea ref={textRef} id={`${fieldId}-body`} name="body" value={body} onChange={(event) => { setBody(Array.from(event.target.value).slice(0, NOTE_BODY_LIMIT).join("")); setLinkNotice({}); }}
        maxLength={NOTE_BODY_LIMIT * 2} readOnly={busy} rows={16} placeholder="Ideas, plans, little reminders. This space is yours." />
      <p className="muted note-save-hint">Save before opening another page or leaving this screen. Drafts are not saved automatically. Inserted links appear as reference markers while editing; Read shows them as clickable text.</p>
      <Button variant="primary" type="submit" disabled={busy || !title.trim() || (Boolean(note) && !dirty)} pending={pending} pendingLabel="Saving...">{spaceId ? "Save page" : "Save note"}</Button>
    </form>
    <FormFeedback error={state.error} message={!dirty ? state.message : undefined}/>
    <div hidden={reading}><LinkPicker onInsert={addLink} disabled={busy}/><FormFeedback error={linkNotice.error} message={linkNotice.message}/></div>
    {!reading && <FormFeedback error={previewState.error}/>}
  </section>;
}
