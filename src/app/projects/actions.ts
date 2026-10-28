"use server";
import {revalidatePath} from "next/cache";
import {getAccountContext} from "@/lib/auth/account";
import {isRecordId} from "@/lib/shared/validation";
import {parseProject,parseProjectRevision,PROJECT_KINDS,type ProjectState} from "@/lib/projects/types";
function refresh(){for(const p of ["/projects","/tasks","/notes","/spaces","/today"])revalidatePath(p);}
export async function saveProject(_previous:ProjectState,form:FormData):Promise<ProjectState>{
 const settings=parseProject(form),id=form.get("id"),revision=parseProjectRevision(form.get("revision"));
 if(!settings||!isRecordId(id)||revision===null)return {error:"Check the project name and settings."};
 const account=await getAccountContext();if(!account)return {error:"Sign in again before saving."};
 const {data,error}=await account.supabase.rpc("planner_save_project",{p_id:id,p_revision:revision,p_settings:settings});
 if(error||data?.id!==id||!Number.isSafeInteger(data?.revision)||data.revision<1)return {error:"Project save not confirmed. Keep your draft; reload this page if another tab changed it, or check setup and connection."};
 refresh();return {id,revision:data.revision,message:"Project saved."};
}
export async function setProjectItem(_previous:ProjectState,form:FormData):Promise<ProjectState>{
 const project=form.get("project"),kind=form.get("kind"),target=form.get("target"),active=form.get("active"),revision=parseProjectRevision(form.get("revision"));
 if(!isRecordId(project)||!isRecordId(target)||typeof kind!=="string"||!Object.hasOwn(PROJECT_KINDS,kind)||!["true","false"].includes(String(active))||revision===null)return {error:"Choose a valid project item."};
 const account=await getAccountContext();if(!account)return {error:"Sign in again before linking."};
 const {data,error}=await account.supabase.rpc("planner_set_project_item",{p_project:project,p_kind:kind,p_target:target,p_active:active==="true",p_revision:revision});
 if(error||!Number.isSafeInteger(data?.revision)||data.revision<1)return {error:"Link change not confirmed. Reload this page if the relation changed elsewhere. Previously unlinked items can be restored from their row; source items stay saved."};
 refresh();return {revision:data.revision,message:active==="true"?"Linked to project.":"Unlinked. Original item kept."};
}