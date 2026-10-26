"use server";
import { getAccountContext } from "@/lib/auth/account";
import { isRecordId } from "@/lib/shared/validation";
import { extractLinks, EMPTY_LINK_RESULTS, LINK_PAGE_SIZE, isLinkKind, parseLinkOffset, type LinkResults, type LinkTarget } from "@/lib/knowledge/links";
function results(data: LinkTarget[] | null, offset: number, query?: string): LinkResults {
  const items = data ?? [];
  return {items:items.slice(0,LINK_PAGE_SIZE), more:items.length>LINK_PAGE_SIZE, offset, query};
}
export async function searchLinkTargets(_previous: LinkResults, form: FormData): Promise<LinkResults> {
  const value = form.get("query");
  if (typeof value !== "string" || Array.from(value).length > 100) return {...EMPTY_LINK_RESULTS,error:"Search with up to 100 characters."};
  const query = value.trim(), offset = parseLinkOffset(form.get("offset"));
  try {
    const account = await getAccountContext();
    if (!account) return {...EMPTY_LINK_RESULTS,error:"Sign in again to browse your links."};
    const {data,error} = await account.supabase.rpc("planner_link_catalog",{p_query:query,p_offset:offset});
    if (error) return {...EMPTY_LINK_RESULTS,error:"Your link choices could not be loaded. Try again after the links setup is applied."};
    return results(data,offset,query);
  } catch { return {...EMPTY_LINK_RESULTS,error:"We could not reach your links. Your writing is still here."}; }
}
export async function loadConnections(_previous: LinkResults, form: FormData): Promise<LinkResults> {
  const kind = form.get("kind"), id = form.get("id"), direction = form.get("direction");
  const offset = parseLinkOffset(form.get("offset"));
  if (!isLinkKind(kind) || !isRecordId(id) || (direction!=="outgoing" && direction!=="backlinks")) return {...EMPTY_LINK_RESULTS,error:"Open a saved note or page to view its links."};
  try {
    const account = await getAccountContext();
    if (!account) return {...EMPTY_LINK_RESULTS,error:"Sign in again to view your links."};
    const {data,error} = await account.supabase.rpc("planner_link_connections",{p_kind:kind,p_id:id,p_direction:direction,p_offset:offset});
    if(error) return {...EMPTY_LINK_RESULTS,error:"Saved links could not be loaded. Try again after the links setup is applied."};
    return results(data,offset);
  } catch { return {...EMPTY_LINK_RESULTS,error:"We could not reach your saved links. Please try again."}; }
}

// Resolve only owned targets; draft text stays plain text and is never rendered as HTML.
export async function resolveLinkPreview(form: FormData): Promise<import("@/lib/knowledge/links").LinkPreview> {
 const body = form.get("body");
 if (typeof body !== "string" || Array.from(body).length > 20000) return {items:[],error:"Text preview is unavailable. Keep the draft within the text limit."};
 try {
  const account = await getAccountContext();
  if (!account) return {items:[],error:"Sign in again to open links in this text."};
  const refs = extractLinks(body), items: LinkTarget[] = [];
  for (const kind of ["note","page"] as const) {
   const ids = refs.filter(ref=>ref.kind===kind).map(ref=>ref.id);
   for(let offset=0;offset<ids.length;offset+=50) {
    const {data,error} = await account.supabase.from(kind==="note"?"notes":"space_pages")
     .select(kind==="note"?"id,title":"id,title,space_id").eq("user_id",account.userId).in("id",ids.slice(offset,offset+50));
    if (error) return {items:[],error:"The text is ready, but its links could not be checked. Try Read again."};
    for (const row of (data ?? []) as unknown as {id:string;title:string;space_id?:string}[]) items.push({kind,id:row.id,title:row.title,space_id:row.space_id??null,space_title:null});
   }
  }
  return {items};
 } catch {return {items:[],error:"We could not check links. Your text has not changed. Try Read again."};}
}
