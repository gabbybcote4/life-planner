import Link from "next/link";
import {getAccountContext} from "@/lib/auth/account";
import {isRecordId} from "@/lib/shared/validation";
import {PROJECT_STATUSES,type ProjectKind} from "@/lib/projects/types";
export async function ProjectBacklinks({kind,id}:{kind:ProjectKind;id:string}){
 if(!isRecordId(id))return null;const account=await getAccountContext();if(!account)return null;
 const result=await account.supabase.from("project_items").select("project_id,project:projects(id,title,status)",{count:"exact"}).eq("user_id",account.userId).eq("kind",kind).eq("target_id",id).eq("active",true).order("project_id").limit(6);
 if(result.error)return <p className="muted">Project connections are unavailable. Check project setup, then refresh.</p>;
 const items=(result.data??[]) as unknown as {project_id:string;project:{id:string;title:string;status:string}|null}[];
 const valid=items.filter(i=>i.project&&isRecordId(i.project.id)&&i.project.id===i.project_id&&typeof i.project.title==="string"&&Object.hasOwn(PROJECT_STATUSES,i.project.status));
 if(valid.length!==items.length)return <p role="alert">Project connections could not be read. Refresh to try again.</p>;
 return <section className="project-backlinks" aria-label="Linked projects"><h3>Projects</h3>{valid.length?<ul>{valid.map(i=><li key={i.project_id}><Link href={"/projects?project="+i.project_id}>{i.project!.title}</Link></li>)}</ul>:<p className="muted">No linked projects yet. Link this item from Projects.</p>}{(result.count??0)>6&&<p className="muted">Showing {valid.length} of {result.count} project links.</p>}</section>;
}