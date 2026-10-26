import Link from "next/link";
import { splitLinkedText, targetHref, type LinkTarget } from "@/lib/knowledge/links";
export function LinkedText({body,targets}:{body:string;targets:LinkTarget[]}) {
 const owned = new Map(targets.map(target=>[target.kind+":"+target.id.toLowerCase(),target]));
 return <div className="linked-text">{splitLinkedText(body).map((part,index)=>{
  if ("text" in part) return <span key={index}>{part.text}</span>;
  const target = owned.get(part.kind+":"+part.id);
  return target ? <Link key={index} href={targetHref(target)} style={{ color: "var(--primary)", textDecoration: "underline", textUnderlineOffset: "3px" }}>{target.title}</Link> : <span key={index} className="muted" title="This item is unavailable or its link could not be checked.">{part.label} (unavailable)</span>;
 })}</div>;
}
