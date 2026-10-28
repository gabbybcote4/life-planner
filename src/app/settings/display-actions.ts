"use server";
import {revalidatePath} from "next/cache";
import {getAccountContext} from "@/lib/auth/account";
import {parseDisplayForm,type DisplayState} from "@/lib/themes/display";
export async function saveDisplay(_previous:DisplayState,form:FormData):Promise<DisplayState>{
 const parsed=parseDisplayForm(form);if(!parsed)return {error:"Choose an available option and reload if needed."};
 try{const account=await getAccountContext();if(!account)return {error:"Sign in again before saving settings."};const {supabase,userId}=account,revisionKey=parsed.group+"_revision";
 const update=()=>supabase.from("planner_preferences").update(parsed.values).eq("user_id",userId).eq(revisionKey,parsed.revision).select(revisionKey).maybeSingle();
 let result=await update();if(result.error)return {error:"Settings could not be saved. Check the display setup and connection; your draft is kept."};
 if(!result.data){const existing=await supabase.from("planner_preferences").select(revisionKey).eq("user_id",userId).maybeSingle();if(existing.error)return {error:"Could not check your saved settings."};if(existing.data||parsed.revision!==1)return {error:"These settings changed elsewhere. Keep your draft and reload before retrying."};
 const inserted=await supabase.from("planner_preferences").insert({user_id:userId,...parsed.values}).select(revisionKey).single();result=inserted.error?.code==="23505"?await update():inserted;}
 const revision=(result.data as unknown as Record<string,unknown>|null)?.[revisionKey];if(result.error||!Number.isSafeInteger(revision)||Number(revision)<1)return {error:"Save not confirmed. Keep your draft and reload to check."};revalidatePath("/","layout");return {revision:Number(revision),message:"Saved to your account."};
 }catch{return {error:"Could not reach your settings. Your draft is kept."};}
}
