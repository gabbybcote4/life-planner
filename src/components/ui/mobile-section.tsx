"use client";
import { useId, useState, type ReactNode } from "react";
import { Button } from "./button";

// A temporary phone disclosure; desktop content remains visible via responsive.css.
// Keep children mounted so closing a panel never discards an unsaved form draft.
export function MobileSection({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false), id = useId();
  return <section className={"mobile-section " + className} aria-label={title}>
    <Button className="mobile-section-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{title}<span aria-hidden="true">{open ? "−" : "+"}</span></Button>
    <div id={id} className="mobile-section-body" data-collapsed={!open}>{children}</div>
  </section>;
}
