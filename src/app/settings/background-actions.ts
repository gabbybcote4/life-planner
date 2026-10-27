"use server";
import {revalidatePath} from "next/cache";
import {getAccountContext} from "@/lib/auth/account";
import {parseBackground} from "@/lib/themes/background";
export type BackgroundState={error?:string;message?:string;revision?:number};
export async function saveBackground(_previous:BackgroundState,data:FormData):Promise<BackgroundState>{
 const choice=parseBackground(data.get("pattern"),data.get("intensity")),raw=data.get("revision");
 if(!choice||typeof raw!=="string"||!/^[1-9]\d{0,8}$/.test(raw))return {error:"Choose an available background and reload settings if needed."};
 const revision=Number(raw);
 try{
 const account=await getAccountContext();if(!account)return {error:"Sign in again before saving your background."};
 const {supabase,userId}=account;
 const update=()=>supabase.from("planner_preferences").update({background_pattern:choice.pattern,background_intensity:choice.intensity}).eq("user_id",userId).eq("background_revision",revision).select("background_revision").maybeSingle();
 let result=await update();
 if(result.error)return {error:"We couldn't save your background. Keep your choices and try again."};
 if(!result.data){
 const existing=await supabase.from("planner_preferences").select("background_revision").eq("user_id",userId).maybeSingle();
 if(existing.error)return {error:"We couldn't check your settings. Try again."};
 if(existing.data||revision!==1)return {error:"Your background changed in another tab. Your preview is retained; reload settings before saving again."};
 const inserted=await supabase.from("planner_preferences").insert({user_id:userId,background_pattern:choice.pattern,background_intensity:choice.intensity}).select("background_revision").single();
 if(inserted.error?.code==="23505")result=await update();else result=inserted;
 if(result.error||!result.data)return {error:"We couldn't confirm your background. Reload settings to check before retrying."};
 }
 revalidatePath("/","layout");return {message:"Desktop background saved to your account.",revision:result.data.background_revision};
 }catch{return {error:"We couldn't reach your settings. Your preview is retained."};}
}

