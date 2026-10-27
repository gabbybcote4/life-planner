import Link from "next/link";
import {requireAccount} from "@/lib/auth/account";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {parseNotesPage} from "@/lib/notes/types";
import type {Capture} from "@/lib/inbox/types";
import {PlannerPage,PlannerHeading,SetupNotice,LoadError} from "@/app/components/planner-page";
import {CaptureCard} from "./capture-card";
type Search=Promise<{page?:string;view?:string}>;
async function InboxContent({searchParams}:{searchParams:Search}){
 if(!isSupabaseConfigured())return <SetupNotice/>;
 const {supabase,userId,email}=await requireAccount(),params=await searchParams;
 const reviewed=params.view==="reviewed",page=parseNotesPage(params.page),size=20;
 const {data,error,count}=await supabase.from("inbox_captures").select("id,kind,title,body,space_id,reviewed,revision,created_at,space:spaces(title)",{count:"exact"}).eq("user_id",userId).eq("reviewed",reviewed).order("created_at",{ascending:false}).order("id").range((page-1)*size,page*size-1);
 const base=reviewed?"/inbox?view=reviewed":"/inbox?";
 return <><PlannerHeading eyebrow="Capture first · sort later" title="Your Inbox." description="Task · Note · Review" email={email}/>
 <nav className="inbox-tabs" aria-label="Inbox views"><Link href="/inbox" aria-current={!reviewed?"page":undefined}>Inbox</Link><Link href="/inbox?view=reviewed" aria-current={reviewed?"page":undefined}>Reviewed</Link></nav>
 {error?<LoadError title="Inbox unavailable." description="Apply Inbox setup if needed, then retry. Saved items are unchanged." action="/inbox"/>:<>
 <p className="muted">{count??0} {reviewed?"reviewed":"to review"} · original captures</p>
 <ul className="inbox-grid">{(data??[]).map(item=><CaptureCard key={userId+item.id} item={item as unknown as Capture}/>)}</ul>
 {!data?.length&&<div className="inbox-empty"><span aria-hidden="true">✦</span><h2>{reviewed?"No reviewed captures":"Room for your next idea"}</h2><p className="muted">Use ＋ Capture above.</p></div>}
 <nav className="notes-pagination" aria-label="Inbox pages">{page>1&&<Link className="text-link" href={base+(reviewed?"&":"")+"page="+(page-1)}>Previous</Link>}{(count??0)>page*size&&page<9999&&<Link className="text-link" href={base+(reviewed?"&":"")+"page="+(page+1)}>Next</Link>}</nav>
 <details className="inbox-help"><summary>How Inbox works</summary><ul><li>Captures are already saved as tasks, notes, or space pages.</li><li>Plan / move / complete opens the existing task controls.</li><li>Reviewed clears this Inbox queue only. Source items stay saved.</li><li>Original captures stay available under Reviewed.</li><li>Voice and AI sorting come later.</li></ul></details>
 </>}
 </>;
}
export default function InboxPage({searchParams}:{searchParams:Search}){return <PlannerPage active="inbox" loading="Opening Inbox..."><InboxContent searchParams={searchParams}/></PlannerPage>;}
