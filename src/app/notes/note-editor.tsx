
import { TextDocumentEditor } from "@/app/components/text-document-editor";
import { type Note } from "@/lib/notes/types";
import { saveNote } from "./actions";
export function NoteEditor({note}:{note:Note|null}) {return <TextDocumentEditor note={note} saveAction={saveNote} destination="/notes?note="/>;}
