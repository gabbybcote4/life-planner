export const SEARCH_KINDS = ["all", "task", "event", "note", "space", "page"] as const;
export type SearchKind = typeof SEARCH_KINDS[number];
export type SearchItem = { kind: Exclude<SearchKind,"all">; id: string; title: string; space_id: string|null; space_title: string|null; event_date: string|null; completed: boolean|null };
export type SearchState = { items:SearchItem[]; query:string; kind:SearchKind; offset:number; more:boolean; searched:boolean; error?:string };
export const EMPTY_SEARCH:SearchState = {items:[],query:"",kind:"all",offset:0,more:false,searched:false};
export const SEARCH_PAGE_SIZE = 20;
export const SEARCH_LABELS:Record<SearchKind,string> = {all:"Everything",task:"Tasks",event:"Calendar events",note:"Notes",space:"Spaces",page:"Pages"};
export function parseSearch(query:unknown,kind:unknown,offset:unknown) {
 if(typeof query!=="string" || Array.from(query).length>100 || typeof kind!=="string" || !SEARCH_KINDS.some(value=>value===kind)) return null;
 const pageOffset = typeof offset==="string" && /^(0|[1-9]\d{0,5})$/.test(offset) ? Math.min(Number(offset),999980) : 0;
 return {query:query.trim(),kind:kind as SearchKind,offset:pageOffset};
}
export function searchHref(item:SearchItem) {
 switch(item.kind) {
  case "task":return "/tasks?task="+item.id;
  case "event":return "/calendar?date="+item.event_date;
  case "note":return "/notes?note="+item.id;
  case "space":return "/spaces?space="+item.id;
  case "page":return "/spaces?space="+item.space_id+"&entry="+item.id;
 }
}
