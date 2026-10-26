import Link from "next/link";
import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isRecordId } from "@/lib/shared/validation";
import { parseNotesPage, type Note } from "@/lib/notes/types";
import { type Space } from "@/lib/spaces/types";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";
import { PlainTextEditor } from "@/app/components/plain-text-editor";
import { SpaceForm } from "./space-form";
import { saveSpacePage } from "./page-actions";
type Search = Promise<{space?:string; entry?:string; spacesPage?:string; pagesPage?:string}>;
const SIZE=20;
async function SpacesContent({searchParams}:{searchParams:Search}) {
 if(!isSupabaseConfigured()) return <SetupNotice/>;
 const {supabase,userId,email}=await requireAccount();
 const params=await searchParams, spacesPage=parseNotesPage(params.spacesPage), pagesPage=parseNotesPage(params.pagesPage);
 const list=await supabase.from("spaces").select("id,title,revision",{count:"exact"}).eq("user_id",userId).order("created_at").order("id").range((spacesPage-1)*SIZE,spacesPage*SIZE-1);
 const requested=params.space ?? list.data?.[0]?.id;
 let space:Space|null=null;
 let unavailable=false;
 if(requested){
  if(!isRecordId(requested)) unavailable=true;
  else {const result=await supabase.from("spaces").select("id,title,revision").eq("id",requested).eq("user_id",userId).maybeSingle();space=result.data;unavailable=Boolean(result.error||!space);}
 }
 const pages=space ? await supabase.from("space_pages").select("id,title",{count:"exact"}).eq("user_id",userId).eq("space_id",space.id).order("updated_at",{ascending:false}).order("id").range((pagesPage-1)*SIZE,pagesPage*SIZE-1) : null;
 const entry=params.entry === "new" ? null : params.entry ?? pages?.data?.[0]?.id ?? null;
 let selected:Note|null=null, entryError=false;
 if(space && entry!==null){
  if(!isRecordId(entry)) entryError=true;
  else {const result=await supabase.from("space_pages").select("id,title,body,revision").eq("id",entry).eq("space_id",space.id).eq("user_id",userId).maybeSingle();selected=result.data;entryError=Boolean(result.error||!selected);}
 }
 const base=space ? '/spaces?space='+space.id+'&spacesPage='+spacesPage : '/spaces';
 return <>
 <PlannerHeading eyebrow="Room for your life" title="Spaces of your own." description="Gather simple text pages by life area, project, or whatever makes sense to you." email={email}/>
 <p className="muted">Private to your account. Save drafts before changing spaces or pages.</p>
 {list.error ? <LoadError title="Your spaces could not be loaded." description="Apply the spaces setup if this is your first visit, then try again." action="/spaces"/> : <>
 <section className="spaces-library" aria-labelledby="spaces-heading"><h2 id="spaces-heading">Your spaces</h2>
 <ul className="space-links">{list.data?.map(item=><li key={item.id}><Link href={'/spaces?space='+item.id+'&spacesPage='+spacesPage} aria-current={space?.id===item.id?'page':undefined}>{item.title}</Link></li>)}</ul>
 {!list.data?.length && <p className="muted">Create your first space below.</p>}
 <nav className="notes-pagination" aria-label="Space list pages">{spacesPage>1&&<Link href={'/spaces?spacesPage='+(spacesPage-1)}>Previous spaces</Link>}{(list.count??0)>spacesPage*SIZE&&spacesPage<9999&&<Link href={'/spaces?spacesPage='+(spacesPage+1)}>Next spaces</Link>}</nav>
 <SpaceForm key={userId}/></section>
 {unavailable ? <LoadError title="This space is unavailable." description="Choose a space from your list." action="/spaces"/> : space ? <>
 <section className="spaces-library"><SpaceForm key={userId+space.id} space={space}/></section>
 {pages?.error ? <LoadError title="Pages could not be loaded." description="Try again; saved pages have not changed." action={base}/> : <div className="notes-layout">
 <aside className="notes-library"><div className="notes-library-heading"><h2>{space.title}</h2><Link className="text-link" href={base+'&entry=new'}>New page</Link></div>
 <p className="muted">{pages?.count??0} saved pages</p>
 <ul className="notes-list">{pages?.data?.map(page=><li key={page.id}><Link href={base+'&pagesPage='+pagesPage+'&entry='+page.id} aria-current={selected?.id===page.id?'page':undefined}>{page.title}</Link></li>)}</ul>
 {!pages?.data?.length&&<p className="muted">Start with a fresh page.</p>}
 <nav className="notes-pagination" aria-label="Pages in this space">{pagesPage>1&&<Link href={base+'&pagesPage='+(pagesPage-1)}>Previous</Link>}{(pages?.count??0)>pagesPage*SIZE&&pagesPage<9999&&<Link href={base+'&pagesPage='+(pagesPage+1)}>Next</Link>}</nav></aside>
 {entryError ? <LoadError title="This page is unavailable." description="Choose a page from this space." action={base}/> : <PlainTextEditor key={userId+space.id+(selected?.id??'new')} note={selected} spaceId={space.id} saveAction={saveSpacePage} destination={base+'&entry='}/>}
 </div>}</> : null}
 </>}
 </>;
}
export default function SpacesPage({searchParams}:{searchParams:Search}) {return <PlannerPage active="spaces" loading="Opening your spaces..."><SpacesContent searchParams={searchParams}/></PlannerPage>;}
