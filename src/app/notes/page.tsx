import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isTaskId as isNoteId } from "@/lib/tasks/types";
import { parseNotesPage, type Note } from "@/lib/notes/types";
import { PlannerNavigation } from "../components/planner-navigation";
import { SignOutButton } from "../sign-out-button";
import { NoteEditor } from "./note-editor";

type NotesSearch = Promise<{ note?: string | string[]; page?: string | string[] }>;
const PAGE_SIZE = 20;

async function NotesContent({ searchParams }: { searchParams: NotesSearch }) {
  if (!isSupabaseConfigured()) return <p className="form-message">Your planner is being set up. Sign-in will be available soon.</p>;
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) redirect("/login");
  const params = await searchParams;
  const page = parseNotesPage(params.page);
  const { data: summaries, error: listError, count } = await supabase.from("notes")
    .select("id,title", { count: "exact" }).eq("user_id", auth.claims.sub)
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
        .eq("id", selectedId).eq("user_id", auth.claims.sub).maybeSingle();
      selected = data;
      selectedError = Boolean(error || !data);
    }
  }

  return <>
    <div className="planner-intro">
      <div><p className="eyebrow">Thoughts worth keeping</p><h1>A little space to write.</h1>
        <p className="intro">Collect your ideas, make a plan, or simply get a thought onto the page.</p></div>
      <div className="planner-account"><p className="muted">{String(auth.claims.email ?? "Your account")}</p><SignOutButton /></div>
    </div>
    {listError ? <section className="task-load-error" aria-labelledby="notes-error-heading">
      <h2 id="notes-error-heading">Your notes couldn’t be loaded.</h2>
      <p className="muted">Try again. Your saved notes have not been changed.</p>
      <form action="/notes" method="get"><button className="secondary-button" type="submit">Try again</button></form>
    </section> : <div className="notes-layout">
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
        <NoteEditor key={`${auth.claims.sub}:${selected?.id ?? "new"}`} note={selected} />}
    </div>}
  </>;
}

export default function NotesPage({ searchParams }: { searchParams: NotesSearch }) {
  return <main className="planner-shell"><section className="paper-card notes-card" aria-label="Your Life Planner notes">
    <PlannerNavigation active="notes" />
    <Suspense fallback={<p role="status">Loading your notes...</p>}><NotesContent searchParams={searchParams} /></Suspense>
  </section></main>;
}
