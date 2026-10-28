import type {Task} from "@/lib/tasks/types";
import {withTaskProjects} from "@/lib/projects/task-projects";
import {redirect} from "next/navigation";
import Link from "next/link";
import {requireAccount} from "@/lib/auth/account";
import {isRecordId} from "@/lib/shared/validation";
import {parseNotesPage} from "@/lib/notes/types";
import {PROJECT_STATUSES,isProjectCatalog,isProjectDetail} from "@/lib/projects/types";
import {PlannerPage,PlannerHeading,LoadError} from "@/app/components/planner-page";
import {ProjectEditor,ProjectRefreshButton} from "./project-form";
import {ProjectDetail} from "./project-detail";
type Search=Promise<{project?:string;page?:string;itemsPage?:string}>;
async function Content({searchParams}:{searchParams:Search}){
 const {supabase,userId,email}=await requireAccount(),params=await searchParams,page=parseNotesPage(params.page),itemsPage=parseNotesPage(params.itemsPage);
 const catalogResult=await supabase.rpc("planner_projects",{p_offset:(page-1)*12});
 const catalog=!catalogResult.error&&isProjectCatalog(catalogResult.data)?catalogResult.data:null;
 if(params.project===undefined&&catalog?.items[0])redirect("/projects?project="+catalog.items[0].id+"&page="+page+"&itemsPage="+itemsPage);
 const selected=params.project===undefined?catalog?.items[0]?.id:params.project;
 const detailResult=isRecordId(selected)?await supabase.rpc("planner_project_detail",{p_id:selected,p_offset:(itemsPage-1)*20}):null;
 const detail=detailResult&&!detailResult.error&&isProjectDetail(detailResult.data)&&detailResult.data.project.id===selected?detailResult.data:null;
 if(detail){const linkedTasks=await withTaskProjects(supabase,detail.items.filter(i=>i.kind==="task").map(i=>i.target as Task));const map=new Map(linkedTasks.map(t=>[t.id,t]));detail.items=detail.items.map(i=>i.kind==="task"?{...i,target:{...i.target,...map.get(i.target_id)}}:i);}
 return <><PlannerHeading eyebrow="Ideas into action" title="Projects, connected." description="Tasks · notes · pages · progress" email={email} captureSpace={detail?.project.space_id?{id:detail.project.space_id,title:detail.project.space_title??"Space"}:undefined}/>
 <div className="projects-toolbar"><h2>Your projects</h2><ProjectEditor key={userId}/><ProjectRefreshButton/></div>
 {!catalog?<LoadError title="Projects could not be loaded." description="Apply the projects setup if needed, then refresh. Your saved source items have not changed." action="/projects"/>:<>
 <ul className="project-catalog">{catalog.items.map(p=><li key={p.id}><Link href={"/projects?project="+p.id+"&page="+page} aria-current={selected===p.id?"page":undefined}><span className="project-status">{PROJECT_STATUSES[p.status]}</span><strong>{p.title}</strong><span>{p.done_count} / {p.task_count} tasks · {p.note_count+p.page_count} notes/pages</span>{p.space_title&&<small>{p.space_title}</small>}</Link></li>)}</ul>
 {!catalog.items.length&&<p className="muted">Add a project, then link items you already have.</p>}
 <nav className="notes-pagination" aria-label="Project pages">{page>1&&<Link href={"/projects?page="+(page-1)}>Previous projects</Link>}{catalog.total>page*12&&page<9999&&<Link href={"/projects?page="+(page+1)}>Next projects</Link>}</nav>
 {selected!==undefined&&(!detail?<LoadError title="This project is unavailable." description="Choose an owned project from the list, or refresh." action="/projects"/>:<><ProjectDetail key={userId+detail.project.id} data={detail}/><nav className="notes-pagination" aria-label="Project item pages">{itemsPage>1&&<Link href={"/projects?project="+selected+"&page="+page+"&itemsPage="+(itemsPage-1)}>Previous items</Link>}{detail.total_links>itemsPage*20&&itemsPage<9999&&<Link href={"/projects?project="+selected+"&page="+page+"&itemsPage="+(itemsPage+1)}>Next items</Link>}</nav></>)}
 </>}
 </>;
}
export default function ProjectsPage({searchParams}:{searchParams:Search}){return <PlannerPage active="projects" loading="Opening your projects…"><Content searchParams={searchParams}/></PlannerPage>;}