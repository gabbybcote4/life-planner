import Link from "next/link";
import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isRecordId as isNoteId } from "@/lib/shared/validation";
import { parseNotesPage, type Note } from "@/lib/notes/types";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";
import { NoteEditor } from "./note-editor";

type NotesSearch = Promise<{ note?: string | string[]; page?: string | string[] }>;
const PAGE_SIZE = 20;

async function NotesContent({ searchParams }: { searchParams: NotesSearch }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { supabase, userId, email } = await requireAccount();
  const params = await searchParams;
  const page = parseNotesPage(params.page);
  const { data: summaries, error: listError, count } = await supabase.from("notes")
    .select("id,title", { count: "exact" }).eq("user_id", userId)
    .order("updated_at", { ascending: false }).order("id")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const requested = params.note;
  const selectedId = requested === "new" ? null : requested ?? summaries?.[0]?.id ?? null;
  let selected: Note | null = null;
  let selectedError = false;
  if (selectedId !== null) {
    if (!isNoteId(typeof selectedId === "string" ? selectedId : null)) selectedError = true;
    else {
      const { data, error } = await supabase.from("notes").select("id,title,body,revision")
        .eq("id", selectedId).eq("user_id", userId).maybeSingle();
      selected = data;
      selectedError = Boolean(error || !data);
    }
  }

  return <>
    <PlannerHeading eyebrow="Thoughts worth keeping" title="A little space to write." description="Collect your ideas, make a plan, or simply get a thought onto the page." email={email} />
    {listError ? <LoadError title="Your notes could not be loaded." description="Try again. Your saved notes have not been changed." action="/notes" /> : <div className="notes-layout">
      <aside className="notes-library" aria-labelledby="notes-library-heading">
        <div className="notes-library-heading"><h2 id="notes-library-heading">Your notes</h2><Link className="text-link" href="/notes?note=new">New note</Link></div>
        <p className="muted">{count ?? 0} saved · recently updated first</p>
        {(summaries?.length ?? 0) === 0 ? <p className="notes-empty muted">{page === 1 ? "Your first note starts with a fresh page." : "No notes on this page."}</p> :
          <ul className="notes-list">{summaries?.map((note) => <li key={note.id}>
            <Link href={`/notes?page=${page}&note=${note.id}`} aria-current={note.id === selected?.id ? "page" : undefined}>{note.title}</Link>
          </li>)}</ul>}
        <nav className="notes-pagination" aria-label="Note pages">
          {page > 1 && <Link className="text-link" href={`/notes?page=${page - 1}`}>Previous</Link>}
          {(count ?? 0) > page * PAGE_SIZE && page < 9999 && <Link className="text-link" href={`/notes?page=${page + 1}`}>Next</Link>}
        </nav>
      </aside>
      {selectedError ? <section className="task-load-error"><h2>This note isn’t available.</h2>
        <p className="muted">Try opening a note from your list, or start a new one.</p>
        <Link className="text-link" href="/notes?note=new">New note</Link></section> :
        <NoteEditor key={`${userId}:${selected?.id ?? "new"}`} note={selected} />}
    </div>}
  </>;
}

export default function NotesPage({ searchParams }: { searchParams: NotesSearch }) {
  return <PlannerPage active="notes" loading="Loading your notes...">
    <NotesContent searchParams={searchParams} />
  </PlannerPage>;
}
