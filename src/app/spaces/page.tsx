import {ProjectBacklinks} from "@/app/projects/project-backlinks";
import {EditDialog} from "@/components/ui/edit-dialog";
import {MobileSection} from "@/components/ui/mobile-section";
import { KnowledgeConnections } from "@/app/knowledge/connections";
import {AddTaskForm,TaskList} from "@/app/tasks/task-board";
import {TASK_SELECT,type Task} from "@/lib/tasks/types";
import {SPACE_SELECT} from "@/lib/spaces/appearance";
import {SpaceMark,SpaceVisual} from "@/components/ui/space-visual";
import Link from "next/link";
import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isRecordId } from "@/lib/shared/validation";
import { parseNotesPage, type Note } from "@/lib/notes/types";
import { type SpaceTemplate } from "@/lib/templates/types";
import { type Space } from "@/lib/spaces/types";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";
import { TextDocumentEditor } from "@/app/components/text-document-editor";
import { SpaceForm } from "./space-form";
import { saveSpacePage } from "./page-actions";
type Search = Promise<{space?:string; entry?:string; spacesPage?:string; pagesPage?:string;tasksPage?:string}>;
const SIZE=20;
async function SpacesContent({searchParams}:{searchParams:Search}) {
 if(!isSupabaseConfigured()) return <SetupNotice/>;
 const {supabase,userId,email}=await requireAccount();
 let templates:SpaceTemplate[]=[];let templatesError:string|undefined;
 try {const catalog=await supabase.rpc("planner_space_templates");if(catalog.error)throw new Error("catalog");templates=catalog.data??[];}
 catch {templatesError="Starters could not be loaded. Apply the template setup if needed, then reopen Spaces. Existing spaces remain available.";}
 const params=await searchParams, spacesPage=parseNotesPage(params.spacesPage), pagesPage=parseNotesPage(params.pagesPage);
 const list=await supabase.from("spaces").select(SPACE_SELECT,{count:"exact"}).eq("user_id",userId).order("created_at").order("id").range((spacesPage-1)*SIZE,spacesPage*SIZE-1);
 const requested=params.space ?? list.data?.[0]?.id;
 let space:Space|null=null;
 let unavailable=false;
 if(requested){
  if(!isRecordId(requested)) unavailable=true;
  else {const result=await supabase.from("spaces").select(SPACE_SELECT).eq("id",requested).eq("user_id",userId).maybeSingle();space=result.data;unavailable=Boolean(result.error||!space);}
 }
 const pages=space ? await supabase.from("space_pages").select("id,title",{count:"exact"}).eq("user_id",userId).eq("space_id",space.id).order("updated_at",{ascending:false}).order("id").range((pagesPage-1)*SIZE,pagesPage*SIZE-1) : null;
 const entry=params.entry === "new" ? null : params.entry ?? pages?.data?.[0]?.id ?? null;
 let selected:Note|null=null, entryError=false;
 if(space && entry!==null){
  if(!isRecordId(entry)) entryError=true;
  else {const result=await supabase.from("space_pages").select("id,title,body,revision").eq("id",entry).eq("space_id",space.id).eq("user_id",userId).maybeSingle();selected=result.data;entryError=Boolean(result.error||!selected);}
 }
 const tasksPage=parseNotesPage(params.tasksPage);
 const tasks=space?await supabase.from("tasks").select(TASK_SELECT,{count:"exact"}).eq("user_id",userId).eq("space_id",space.id).order("created_at",{ascending:false}).order("id").range((tasksPage-1)*20,tasksPage*20-1):null;
 const base=space ? '/spaces?space='+space.id+'&spacesPage='+spacesPage : '/spaces';
 return <>
 <PlannerHeading eyebrow="Room for your life" captureSpace={space&&!unavailable?{id:space.id,title:space.title}:undefined} title="Spaces of your own." description="Gather simple text pages by life area, project, or whatever makes sense to you." email={email}/>
 <p className="muted">Private to your account. Save drafts before changing spaces or pages.</p>
 {list.error ? <LoadError title="Your spaces could not be loaded." description="Apply the spaces setup if this is your first visit, then try again." action="/spaces"/> : <>
 <MobileSection className="spaces-library" title="Browse & create spaces"><h2 id="spaces-heading">Your spaces</h2>
 <ul className="space-links">{list.data?.map(item=><li key={item.id}><Link href={'/spaces?space='+item.id+'&spacesPage='+spacesPage} data-space-accent={item.accent} className="space-identity-link" aria-current={space?.id===item.id?'page':undefined}><SpaceMark icon={item.icon}/>{item.title}</Link></li>)}</ul>
 {!list.data?.length && <p className="muted">Create your first space below.</p>}
 <nav className="notes-pagination" aria-label="Space list pages">{spacesPage>1&&<Link href={'/spaces?spacesPage='+(spacesPage-1)}>Previous spaces</Link>}{(list.count??0)>spacesPage*SIZE&&spacesPage<9999&&<Link href={'/spaces?spacesPage='+(spacesPage+1)}>Next spaces</Link>}</nav>
 <SpaceForm key={userId} templates={templates} templatesError={templatesError}/></MobileSection>
 {unavailable ? <LoadError title="This space is unavailable." description="Choose a space from your list." action="/spaces"/> : space ? <>
 <MobileSection className="spaces-library" title="Space appearance and name"><div className="space-hero"><SpaceVisual space={space} description="Your pages, tasks, and ideas — together."/></div><EditDialog key={userId+space.id} title={"Edit space: "+space.title}><SpaceForm space={space}/></EditDialog></MobileSection>
 <MobileSection className="space-task-panel" title={"Tasks in "+space.title}><h2>Tasks in {space.title}</h2>
 <AddTaskForm key={userId+space.id} spaceId={space.id}/>
 {tasks?.error?<LoadError title="Space tasks could not be loaded." description="Check the task-space setup and try again. Saved tasks have not changed." action={base}/>:<><p className="muted">{tasks?.count??0} saved tasks · newest first</p><TaskList tasks={(tasks?.data??[]) as unknown as Task[]}/>{!tasks?.data?.length&&<p className="muted">No tasks here yet. Add one above or assign an existing task from Tasks.</p>}
 <nav className="notes-pagination" aria-label="Tasks in this space">{tasksPage>1&&<Link href={base+'&tasksPage='+(tasksPage-1)+'&pagesPage='+pagesPage+(selected?'&entry='+selected.id:params.entry==='new'?'&entry=new':'')}>Previous tasks</Link>}{(tasks?.count??0)>tasksPage*20&&tasksPage<9999&&<Link href={base+'&tasksPage='+(tasksPage+1)+'&pagesPage='+pagesPage+(selected?'&entry='+selected.id:params.entry==='new'?'&entry=new':'')}>Next tasks</Link>}</nav></>}
 </MobileSection>
 {pages?.error ? <LoadError title="Pages could not be loaded." description="Try again; saved pages have not changed." action={base}/> : <div className="notes-layout">
 <MobileSection className="notes-library" title="Browse pages"><div className="notes-library-heading"><h2>{space.title}</h2><Link className="text-link" href={base+'&entry=new'}>New page</Link></div>
 <p className="muted">{pages?.count??0} saved pages</p>
 <ul className="notes-list">{pages?.data?.map(page=><li key={page.id}><Link href={base+'&pagesPage='+pagesPage+'&entry='+page.id} aria-current={selected?.id===page.id?'page':undefined}>{page.title}</Link></li>)}</ul>
 {!pages?.data?.length&&<p className="muted">Start with a fresh page.</p>}
 <nav className="notes-pagination" aria-label="Pages in this space">{pagesPage>1&&<Link href={base+'&pagesPage='+(pagesPage-1)}>Previous</Link>}{(pages?.count??0)>pagesPage*SIZE&&pagesPage<9999&&<Link href={base+'&pagesPage='+(pagesPage+1)}>Next</Link>}</nav></MobileSection>
 {entryError ? <LoadError title="This page is unavailable." description="Choose a page from this space." action={base}/> : <div><TextDocumentEditor key={userId+space.id+(selected?.id??'new')} note={selected} spaceId={space.id} saveAction={saveSpacePage} destination={base+'&entry='}/>{selected && <><KnowledgeConnections kind="page" id={selected.id}/><ProjectBacklinks kind="page" id={selected.id}/></>}</div>}
 </div>}</> : null}
 </>}
 </>;
}
export default function SpacesPage({searchParams}:{searchParams:Search}) {return <PlannerPage active="spaces" loading="Opening your spaces..."><SpacesContent searchParams={searchParams}/></PlannerPage>;}
