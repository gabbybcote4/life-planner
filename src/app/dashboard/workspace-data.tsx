import {GuidanceWidget} from "./guidance-widget";
import {connection} from "next/server";
import {getAccountContext} from "@/lib/auth/account";
import {SpaceCards,ConnectionMap,UpcomingEvents,type GraphDocument} from "./workspace-previews";
export async function DashboardSpaces(){
 const account=await getAccountContext();if(!account)return null;
 const {data,error}=await account.supabase.from("spaces").select("id,title,icon,cover,accent").eq("user_id",account.userId).order("created_at").order("id").limit(4);
 return <SpaceCards embedded spaces={(data??[]).slice(0,3)} more={(data?.length??0)>3} error={Boolean(error)}/>;
}
export async function DashboardConnections(){
 const account=await getAccountContext();if(!account)return null;
 const {data,error}=await account.supabase.rpc("planner_link_documents").order("title").order("kind").order("id").range(0,12);
 return <ConnectionMap embedded documents={(data??[]).slice(0,12) as GraphDocument[]} more={(data?.length??0)>12} error={Boolean(error)}/>;
}
export async function DashboardUpcoming(){
 await connection();
 const account=await getAccountContext();if(!account)return null;
 const today=new Date().toISOString().slice(0,10);
 const {data,error}=await account.supabase.from("calendar_events").select("id,title,event_date").eq("user_id",account.userId).gte("event_date",today).order("event_date").order("id").limit(4);
 return <UpcomingEvents embedded today={today} events={(data??[]).slice(0,3)} more={(data?.length??0)>3} error={Boolean(error)}/>;
}

// Latest owner-scoped source timestamps refresh guidance after changes anywhere.
export async function DashboardGuidance(){
 const account=await getAccountContext();if(!account)return null;
 const [tasks,events]=await Promise.all([
  account.supabase.from("tasks").select("id,updated_at").eq("user_id",account.userId).order("updated_at",{ascending:false}).order("id").limit(1),
  account.supabase.from("calendar_events").select("id,updated_at").eq("user_id",account.userId).order("updated_at",{ascending:false}).order("id").limit(1)
 ]);
 return <GuidanceWidget key={account.userId} refreshKey={JSON.stringify([tasks.data,events.data,tasks.error?.code,events.error?.code])}/>;
}
