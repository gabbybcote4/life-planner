import { type LinkKind, EMPTY_LINK_RESULTS } from "@/lib/knowledge/links";
import { loadConnections } from "./actions";
import { ConnectionList } from "./connection-list";
export async function KnowledgeConnections({kind,id}:{kind:LinkKind;id:string}) {
 const directions=["outgoing","backlinks"] as const;
 const lists=await Promise.all(directions.map(async direction=>{
  const form=new FormData();form.set("kind",kind);form.set("id",id);form.set("direction",direction);
  return {direction,result:await loadConnections(EMPTY_LINK_RESULTS,form)};
 }));
 return <aside className="knowledge-connections" aria-label="Saved connections"><h2>Connections</h2>
 <p className="muted">These reflect saved text. Save drafts before following a link. Unavailable or private items are omitted.</p>
 {lists.map(({direction,result})=><ConnectionList key={kind+id+direction+JSON.stringify(result)} kind={kind} id={id} direction={direction} initial={result}/>)}</aside>;
}
