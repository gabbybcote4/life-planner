"use server";
import {revalidatePath} from "next/cache";
import {getAccountContext} from "@/lib/auth/account";
import {isRecordId} from "@/lib/shared/validation";
import {parseRevision} from "@/lib/notes/types";
import {parseCapture,captureHref,type CaptureState,type CaptureKind} from "@/lib/inbox/types";
function refreshCaptureViews(){for(const path of ["/inbox","/tasks","/notes","/spaces","/"])revalidatePath(path);}
export async function captureItem(_previous:CaptureState,form:FormData):Promise<CaptureState>{
 const values=parseCapture(form);
 if(!values)return {error:"Task: 1–200 characters. Note: up to 20,000. Choose a valid space."};
 try{
  const account=await getAccountContext();if(!account)return {error:"Session expired. Copy your draft before signing in."};
  const {data,error}=await account.supabase.rpc("planner_quick_capture",{p_id:values.id,p_kind:values.kind,p_space_id:values.space_id,p_title:values.title,p_body:values.body});
  if(error)return {error:error.code==="23505"?"An earlier capture used these choices. Check Inbox before starting another.":"Capture not confirmed. Keep your draft, check setup/connection, then retry."};
  const kind:CaptureKind=values.kind==="note"&&values.space_id?"page":values.kind;
  if(!data||data.id!==values.id||data.kind!==kind||data.space_id!==values.space_id)return {error:"Capture not confirmed. Check Inbox before starting another."};
  refreshCaptureViews();return {message:"Captured",href:captureHref({id:values.id,kind,space_id:values.space_id})};
 }catch{return {error:"Could not reach your Inbox. Your draft is still here."};}
}
export async function reviewCapture(_previous:CaptureState,form:FormData):Promise<CaptureState>{
 const id=form.get("id"),revision=parseRevision(form.get("revision")),reviewed=form.get("reviewed");
 if(!isRecordId(id)||!revision||(reviewed!=="true"&&reviewed!=="false"))return {error:"Reload Inbox before reviewing this capture."};
 try{
  const account=await getAccountContext();if(!account)return {error:"Sign in again before reviewing."};
  const {data,error}=await account.supabase.from("inbox_captures").update({reviewed:reviewed==="true"}).eq("id",id).eq("user_id",account.userId).eq("revision",revision).select("id").maybeSingle();
  if(error)return {error:"Review not confirmed. Check Inbox before retrying."};
  if(!data)return {error:"This capture changed elsewhere. Reload Inbox; nothing was overwritten."};
  revalidatePath("/inbox");return {message:reviewed==="true"?"Reviewed":"Back in Inbox"};
 }catch{return {error:"Could not reach Inbox. Try again when connected."};}
}
