"use client";
import Link from "next/link";
import { useId, useRef, useState, useEffect } from "react";
import { PLANNER_ROUTES, MOBILE_PRIMARY_ROUTES, type PlannerSection } from "@/lib/navigation";
import { DeskIcon } from "@/components/ui/desk-icon";
import { Button } from "@/components/ui/button";

// One route registry serves the full desktop menu and compact phone shortcuts.
export function PlannerNavigation({ active }: { active: PlannerSection }) {
  const [open, setOpen] = useState(false);
  const menuId = useId(), sidebar = useRef<HTMLElement>(null), toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !sidebar.current?.contains(event.target)) setOpen(false);
    };
    const dismissKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismissKey);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", dismissKey); };
  }, [open]);
  const current = PLANNER_ROUTES.find(route => route.id === active)?.label;
  const secondary = !MOBILE_PRIMARY_ROUTES.some(route => route.id === active);
  return <aside ref={sidebar} className="desktop-sidebar" data-menu-open={open}>
    <Link className="desktop-brand" href="/"><DeskIcon name="save" /><span>Life<br />Planner</span></Link>
    <p className="desktop-sidebar-label">YOUR DESKTOP</p>
    <div className="mobile-nav-bar" aria-label="Quick navigation">
      {MOBILE_PRIMARY_ROUTES.map(route => <Link key={route.id} href={route.href} aria-current={active === route.id ? "page" : undefined} onClick={() => setOpen(false)}><DeskIcon name={route.id} /><span>{route.label}</span></Link>)}
      <Button ref={toggle} type="button" className={"nav-menu-toggle" + (secondary ? " is-active" : "")} aria-expanded={open} aria-controls={menuId} aria-label={"More navigation" + (secondary ? ", current section " + current : "")} onClick={() => setOpen(!open)}><span className="nav-more-icon" aria-hidden="true">•••</span><span>More</span></Button>
    </div>
    <nav id={menuId} className="planner-route-menu" aria-label="Planner">
      {PLANNER_ROUTES.map(route => <Link key={route.id} href={route.href} aria-current={active === route.id ? "page" : undefined} onClick={() => setOpen(false)}><DeskIcon name={route.id} /><span>{route.label}</span></Link>)}
      <Button className="mobile-menu-close" variant="text" onClick={() => { setOpen(false); toggle.current?.focus(); }}>Close menu</Button>
    </nav>
    <div className="desktop-sidebar-bottom"><span aria-hidden="true">✧ · ✦ · ✧</span><p>A little space.<br />A brighter day.</p><Link href="/settings">Make it yours →</Link></div>
  </aside>;
}
