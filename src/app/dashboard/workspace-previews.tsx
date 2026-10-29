import {MiniMonth} from "./mini-month";
import {DateLabel} from "@/app/components/planning-preferences";
import Link from "next/link";
import {DesktopWindow} from "@/components/ui/desktop-window";
import {SpaceVisual} from "@/components/ui/space-visual";
import type {SpaceAppearance} from "@/lib/spaces/appearance";
import {extractLinks,targetHref,type LinkTarget} from "@/lib/knowledge/links";
export type GraphDocument=LinkTarget & {body:string};
export function SpaceCards({spaces,more,error,embedded=false}:{embedded?:boolean;spaces:({id:string;title:string}&Partial<SpaceAppearance>)[];more:boolean;error:boolean}) {
 return <DesktopWindow embedded={embedded} title="Your spaces" className="spaces-desktop-window" action={<Link href="/spaces">Open all →</Link>}>{error?<p role="alert">Spaces could not be loaded. <Link href="/spaces">Try Spaces</Link></p>:<><div className="desktop-space-cards">{spaces.map(space=><Link key={space.id} className="desktop-space-card" href={"/spaces?space="+space.id}><SpaceVisual space={space}/></Link>)}</div>{!spaces.length&&<p className="muted">Your own corners of life start here. <Link href="/spaces">Create a space →</Link></p>}{more&&<p className="muted">Showing your first three spaces. Open all to see the rest.</p>}</>}</DesktopWindow>;
}
export function ConnectionMap({documents,more,error,embedded=false}:{embedded?:boolean;documents:GraphDocument[];more:boolean;error:boolean}) {
 // The same saved-text parser drives inline links and this bounded preview.
 const nodes=documents.slice(0,12), visible=new Map(nodes.map((node,index)=>[node.kind+":"+node.id.toLowerCase(),index]));
 const points=nodes.map((_,index)=>({x:350+Math.cos(index*2*Math.PI/Math.max(nodes.length,1))*245,y:145+Math.sin(index*2*Math.PI/Math.max(nodes.length,1))*95}));
 const edges=nodes.flatMap((node,index)=>extractLinks(node.body).flatMap(ref=>{const target=visible.get(ref.kind+":"+ref.id);return target===undefined?[]:[{from:index,to:target}];}));
 return <DesktopWindow embedded={embedded} title="Your connected ideas" className="connections-desktop-window" action={<Link href="/notes">Open notes →</Link>}>{error?<p role="alert">Connections could not be loaded. Your saved notes are unchanged.</p>:nodes.length?<>
 <svg className="desktop-graph" viewBox="0 0 700 290" role="img" aria-label={"Saved connections between "+nodes.length+" notes and pages"}><title>Saved note and page connections</title>
 {edges.map((edge,index)=><line key={index} x1={points[edge.from].x} y1={points[edge.from].y} x2={points[edge.to].x} y2={points[edge.to].y} stroke="var(--focus)" strokeWidth="1.5"/>)}
 {nodes.map((node,index)=><a key={node.kind+node.id} href={targetHref(node)} aria-label={"Open "+node.title}><circle cx={points[index].x} cy={points[index].y} r="9" fill={index%2?"var(--primary)":"var(--focus)"}/><text x={points[index].x} y={points[index].y+27} textAnchor="middle" fill="var(--foreground)" fontSize="12">{Array.from(node.title).slice(0,19).join("")}{Array.from(node.title).length>19?"…":""}</text></a>)}</svg>
 <details className="compact-map-links"><summary>Open a linked note or page</summary><ul className="graph-open-links" aria-label="Open a note or page from the map">{nodes.map(node=><li key={node.kind+node.id}><Link href={targetHref(node)}>{node.title}</Link></li>)}</ul></details>
 <p className="muted">{more||documents.length>12?"Previewing the first 12 notes and pages; only links between these items are drawn. ":""}{edges.length?"Lines come from your saved links.":"Insert and save links between these items to draw connections."}</p>
 </>:<p className="muted">Your ideas can grow together. Create notes or pages, then insert links to connect them.</p>}</DesktopWindow>;
}
export function UpcomingEvents({events,more,error,today,embedded=false}:{embedded?:boolean;today:string;events:{id:string;title:string;event_date:string}[];more:boolean;error:boolean}) {
 return <DesktopWindow embedded={embedded} title="Coming up" className="upcoming-desktop-window" action={<Link href="/calendar">Calendar →</Link>}>{error?<p role="alert">Events could not be loaded. <Link href="/calendar">Open Calendar</Link></p>:<><details className="compact-month"><summary>Month view (UTC)</summary><MiniMonth today={today}/></details><p className="muted">All-day events · from today (UTC)</p><ul className="upcoming-event-list">{events.map(event=><li key={event.id}><time dateTime={event.event_date}><DateLabel date={event.event_date}/></time><Link href={"/calendar?date="+event.event_date}>{event.title}</Link></li>)}</ul>{!events.length&&<p className="muted">A little breathing room. <Link href="/calendar">Plan an event →</Link></p>}{more&&<p className="muted">Showing the next three events.</p>}</>}</DesktopWindow>;
}
