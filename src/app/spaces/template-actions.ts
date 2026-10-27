"use server";
import {revalidatePath} from "next/cache";
import {getAccountContext} from "@/lib/auth/account";
import {isRecordId} from "@/lib/shared/validation";
import {parseSpaceTitle} from "@/lib/spaces/types";
import {isTemplateKey,type SpaceCreationState} from "@/lib/templates/types";
export async function createSpaceFromTemplate(_previous:SpaceCreationState,form:FormData):Promise<SpaceCreationState> {
 const id=form.get("id"), title=parseSpaceTitle(form.get("title")), key=form.get("template");
 if(!isRecordId(id)||!title||!isTemplateKey(key))return {error:"Choose a starter and use a space name of 1–100 characters."};
 try {
  const account=await getAccountContext();
  if(!account)return {error:"Your session expired. Keep your space name before signing in again."};
  const {data,error}=await account.supabase.rpc("create_planner_space",{p_request_id:id,p_title:title,p_template_key:key}).single<{space_id:string;first_page_id:string|null}>();
  if(error?.code==='23505')return {error:"An earlier attempt may have created this space. Use the original name and starter to retry, or check your spaces before starting another."};
  if(error||!data||data.space_id!==id||(key!=="blank"&&data.first_page_id===null)||(data.first_page_id!==null&&!isRecordId(data.first_page_id)))return {error:"We could not confirm creation. Keep the same name and starter to retry safely, or check your spaces."};
  revalidatePath("/spaces");revalidatePath("/search");
  return {id:data.space_id,pageId:data.first_page_id??undefined,revision:1,message:"Your space is ready."};
 } catch {return {error:"We could not reach your spaces. Keep the same name and starter to retry safely."};}
}
