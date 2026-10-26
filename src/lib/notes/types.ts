export type Note = { id: string; title: string; body: string; revision: number };
export type NoteState = { error?: string; message?: string; id?: string; revision?: number };
export const NOTE_TITLE_LIMIT = 200;
export const NOTE_BODY_LIMIT = 20000;

export function parseNote(title: FormDataEntryValue | null, body: FormDataEntryValue | null) {
  if (typeof title !== "string" || typeof body !== "string") return null;
  const trimmed = title.trim();
  if (!trimmed || Array.from(trimmed).length > NOTE_TITLE_LIMIT || Array.from(body).length > NOTE_BODY_LIMIT) return null;
  // Preserve line breaks, spaces, and literal markup in the body as plain text.
  return { title: trimmed, body };
}

export function parseRevision(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^[1-9]\d{0,8}$/.test(value)) return null;
  return Number(value);
}

export function parseNotesPage(value: unknown) {
  if (typeof value !== "string" || !/^[1-9]\d{0,3}$/.test(value)) return 1;
  return Number(value);
}
