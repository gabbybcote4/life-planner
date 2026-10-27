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
