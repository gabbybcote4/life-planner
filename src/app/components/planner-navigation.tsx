import Link from "next/link";
import {PLANNER_ROUTES,type PlannerSection} from "@/lib/navigation";
import {DeskIcon} from "@/components/ui/desk-icon";
export function PlannerNavigation({active}:{active:PlannerSection}) {
 return <aside className="desktop-sidebar"><Link className="desktop-brand" href="/"><DeskIcon name="save"/><span>Life<br/>Planner</span></Link><p className="desktop-sidebar-label">YOUR DESKTOP</p>
 <nav aria-label="Planner">{PLANNER_ROUTES.map(route=><Link key={route.id} href={route.href} aria-current={active===route.id?"page":undefined}><DeskIcon name={route.id}/><span>{route.label}</span></Link>)}</nav>
 <div className="desktop-sidebar-bottom"><span aria-hidden="true">✧ · ✦ · ✧</span><p>A little space.<br/>A brighter day.</p><Link href="/settings">Make it yours →</Link></div></aside>;
}
