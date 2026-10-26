"use client";
import { PlainTextEditor } from "@/app/components/plain-text-editor";
import { type Note } from "@/lib/notes/types";
import { saveNote } from "./actions";
export function NoteEditor({note}:{note:Note|null}) {return <PlainTextEditor note={note} saveAction={saveNote} destination="/notes?note="/>;}
