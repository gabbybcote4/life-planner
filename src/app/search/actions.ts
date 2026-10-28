"use server";
import {getAccountContext} from "@/lib/auth/account";
import {EMPTY_SEARCH,SEARCH_PAGE_SIZE,parseSearch,type SearchState,type SearchItem} from "@/lib/search/types";
export async function searchPlanner(_previous:SearchState,form:FormData):Promise<SearchState> {
 const parsed = parseSearch(form.get("query"),form.get("kind"),form.get("offset"));
 if(!parsed) return {...EMPTY_SEARCH,error:"Use up to 100 characters and choose a search category."};
 try {
  const account=await getAccountContext();
  if(!account) return {...EMPTY_SEARCH,error:"Your session expired. Sign in again to search your planner."};
  if(!parsed.query) return {...EMPTY_SEARCH,kind:parsed.kind};
  const {data,error}=await account.supabase.rpc("planner_search",{p_query:parsed.query,p_kind:parsed.kind,p_offset:parsed.offset});
  if(error) return {...EMPTY_SEARCH,...parsed,error:"Search could not be loaded. Try again after the search setup is applied."};
  const items=(data??[]) as SearchItem[];
  return {...parsed,items:items.slice(0,SEARCH_PAGE_SIZE),more:items.length>SEARCH_PAGE_SIZE,searched:true};
 } catch {return {...EMPTY_SEARCH,...parsed,error:"We could not reach search. Check your connection and try again."};}
}

// Browse only known picker kinds; normal global search still requires a term.
export async function browsePlanner(previous:SearchState,form:FormData):Promise<SearchState>{
 const parsed=parseSearch(form.get("query"),form.get("kind"),form.get("offset"));
 if(!parsed||!["task","note","page","space"].includes(parsed.kind)||parsed.offset%20!==0)return {...EMPTY_SEARCH,error:"Choose a valid item type and page."};
 if(parsed.query)return searchPlanner(previous,form);
 try{
  const account=await getAccountContext();if(!account)return {...EMPTY_SEARCH,...parsed,error:"Sign in again to browse your items."};
  const table={task:"tasks",note:"notes",page:"space_pages",space:"spaces"}[parsed.kind as "task"|"note"|"page"|"space"];
  const related=parsed.kind==="task"||parsed.kind==="page";
  const projection="id,title"+(related?",space_id,space:spaces(title)":"")+(parsed.kind==="task"?",completed":"");
  const {data,error}=await account.supabase.from(table).select(projection).eq("user_id",account.userId).order("title").order("id").range(parsed.offset,parsed.offset+SEARCH_PAGE_SIZE);
  if(error||!Array.isArray(data))return {...EMPTY_SEARCH,...parsed,error:"Items could not be loaded. Try refresh."};
  const rows=data as unknown as {id:string;title:string;space_id?:string|null;space?:{title:string}|null;completed?:boolean}[];
  if(rows.length>21||rows.some(r=>!r||typeof r.id!=="string"||typeof r.title!=="string"))return {...EMPTY_SEARCH,...parsed,error:"Item list unavailable. Try refresh."};
  const items=rows.slice(0,SEARCH_PAGE_SIZE).map(r=>({kind:parsed.kind as SearchItem["kind"],id:r.id,title:r.title,space_id:r.space_id??null,space_title:r.space?.title??null,event_date:null,completed:r.completed??null}));
  return {...parsed,items,more:rows.length>SEARCH_PAGE_SIZE,searched:true};
 }catch{return {...EMPTY_SEARCH,...parsed,error:"Could not reach your items. Try refresh."};}
}
