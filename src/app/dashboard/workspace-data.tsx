import {connection} from "next/server";
import {getAccountContext} from "@/lib/auth/account";
import {SpaceCards,ConnectionMap,UpcomingEvents,type GraphDocument} from "./workspace-previews";
export async function DashboardSpaces(){
 const account=await getAccountContext();if(!account)return null;
 const {data,error}=await account.supabase.from("spaces").select("id,title").eq("user_id",account.userId).order("created_at").order("id").limit(4);
 return <SpaceCards spaces={(data??[]).slice(0,3)} more={(data?.length??0)>3} error={Boolean(error)}/>;
}
export async function DashboardConnections(){
 const account=await getAccountContext();if(!account)return null;
 const {data,error}=await account.supabase.rpc("planner_link_documents").order("title").order("kind").order("id").range(0,12);
 return <ConnectionMap documents={(data??[]).slice(0,12) as GraphDocument[]} more={(data?.length??0)>12} error={Boolean(error)}/>;
}
export async function DashboardUpcoming(){
 await connection();
 const account=await getAccountContext();if(!account)return null;
 const today=new Date().toISOString().slice(0,10);
 const {data,error}=await account.supabase.from("calendar_events").select("id,title,event_date").eq("user_id",account.userId).gte("event_date",today).order("event_date").order("id").limit(6);
 return <UpcomingEvents today={today} events={(data??[]).slice(0,5)} more={(data?.length??0)>5} error={Boolean(error)}/>;
}
