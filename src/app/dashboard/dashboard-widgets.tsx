"use client";

import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";

import {WindowTitleBar} from "@/components/ui/desktop-window";
import { EmptyState } from "@/components/ui/empty-state";
import { FormFeedback } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { saveDashboardLayout } from "./actions";
import { withGuidanceFirst, WIDGET_ACCENTS, setWidgetAccent,clearWidgetAccents,DEFAULT_LAYOUT, addWorkspaceWidgets, WIDGETS, moveWidget, type Widget, type WidgetId, type LayoutState } from "@/lib/dashboard/layout";

export function DashboardWidgets({ savedLayout, savedRevision, canCustomize, slots }: {
  savedLayout: Widget[]; savedRevision: number; canCustomize: boolean; slots: Record<WidgetId, ReactNode>;
}) {
  const [editing, setEditing] = useState(false);
  // Phone-only disclosures are temporary UI state, not saved layout changes.
  const [mobileOpen,setMobileOpen] = useState<WidgetId[]>(() => Array.from(new Set<WidgetId>([...(savedLayout[0] ? [savedLayout[0].id] : []),"guidance","capture","recent"])));
  const [draft, setDraft] = useState<Widget[]>(savedLayout);
  const [saved, setSaved] = useState<Widget[]>(savedLayout);
  const [revision, setRevision] = useState(savedRevision);
  const [announcement, setAnnouncement] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const [state, action, pending] = useActionState<LayoutState, FormData>(async (previous, data) => {
    data.set("layout", JSON.stringify(draft));
    data.set("revision", String(revision));
    const result = await runAction(() => saveDashboardLayout(previous, data), UNCONFIRMED_SAVE);
    if (!result.error && result.revision) {
      setSaved(draft);
      setRevision(result.revision);
      setEditing(false);
      setAnnouncement("Dashboard layout saved.");
    }
    return result;
  }, {});
  const missing = (Object.keys(WIDGETS) as WidgetId[]).filter((id) => !draft.some((widget) => widget.id === id));
  const change = (next: Widget[], message: string) => { setDraft(next); setAnnouncement(message); };

  return <div className="dashboard-customization">
    <div className="dashboard-customize-heading">
      <p className="muted">{editing && dirty ? "Unsaved layout changes" : "Your dashboard, arranged your way"}</p>
      {!editing && <Button variant="secondary" type="button" disabled={!canCustomize}
        onClick={() => { setEditing(true); setAnnouncement(""); }}>Customize dashboard</Button>}
    {!editing && draft[0]?.id!=="guidance" && <Button className="add-guidance-shortcut" variant="secondary" disabled={!canCustomize} onClick={()=>{setDraft(withGuidanceFirst(draft));setEditing(true);setMobileOpen(current=>Array.from(new Set<WidgetId>([...current,"guidance"])));setAnnouncement("Your next step is at the top of your draft. Save layout to keep it.");}}>{missing.includes("guidance")?"Add Your next step at the top":"Move Your next step to the top"}</Button>}
    </div>
    {editing && <section className="widget-library" aria-labelledby="widget-library-heading">
      <h2 id="widget-library-heading">Arrange your dashboard</h2>
      <p className="muted">Add a widget, move it up or down, and choose half or full width. Removing a widget keeps your tasks, events, spaces, notes, and links safe.</p>
      <div className="widget-library-options">{missing.length === 0 ? <p className="muted">All available widgets are on your dashboard.</p> :
        missing.map((id) => <Button variant="secondary" key={id} type="button" disabled={pending || !canCustomize}
          onClick={() => change([...draft, { id, width: "half" }], `${WIDGETS[id].label} added.`)}>
          Add {WIDGETS[id].label}
        </Button>)}</div>
      {missing.some(id=>["spaces","calendar","connections"].includes(id))&&<Button variant="secondary" disabled={pending||!canCustomize} onClick={()=>change(addWorkspaceWidgets(draft),"Workspace widgets added to your draft. Save to keep them.")}>Add workspace widgets</Button>}
      <div className="layout-save-controls">
        <form action={action}>
          <Button variant="primary" type="submit" disabled={pending || !dirty || !canCustomize} pending={pending} pendingLabel="Saving...">Save layout</Button>
        </form>
        <Button variant="text" type="button" disabled={pending || !canCustomize}
          onClick={() => { setDraft(saved); setEditing(false); setAnnouncement("Saved layout restored."); }}>Cancel</Button>
        <Button variant="text" type="button" disabled={pending || !canCustomize}
          onClick={() => change(DEFAULT_LAYOUT.map((widget) => ({ ...widget })), "Default layout restored. Save to keep it.")}>Restore default layout</Button>
      </div>
      <Button variant="text" disabled={pending||!canCustomize||!draft.some(widget=>widget.accent)} onClick={()=>change(clearWidgetAccents(draft),"Widget colors reset in your draft. Save to keep them.")}>Reset widget colors</Button>
      <p className="muted">Colors follow your current theme. Save before leaving this page. Layout changes are not saved automatically.</p>
      <FormFeedback error={state.error} />
    </section>}
    <p className="layout-announcement" role="status" aria-live="polite">{pending ? "Saving your layout..." : announcement}</p>
    {draft.length === 0 && <EmptyState title="A little breathing room.">Use Customize dashboard to add widgets. Your saved tasks are still on the Tasks page.</EmptyState>}
    <div className="custom-widget-grid">{draft.map((widget, index) => <article key={widget.id}
      data-accent={widget.accent} className={`dashboard-widget widget-${widget.width} widget-type-${widget.id}`} aria-label={WIDGETS[widget.id].label}>
      <WindowTitleBar className="widget-titlebar"><span>{WIDGETS[widget.id].label}</span><Button className="mobile-widget-toggle" aria-label={(editing || mobileOpen.includes(widget.id)?"Close ":"Open ")+WIDGETS[widget.id].label} aria-expanded={editing || mobileOpen.includes(widget.id)} aria-controls={"widget-body-"+widget.id} disabled={editing} onClick={()=>setMobileOpen(current=>current.includes(widget.id)?current.filter(id=>id!==widget.id):[...current,widget.id])}>{editing || mobileOpen.includes(widget.id)?"Close":"Open"}</Button></WindowTitleBar>
      {editing && <div className="widget-controls">
        <span className="widget-control-title">{WIDGETS[widget.id].label}</span>
        <Button type="button" disabled={pending || !canCustomize || index === 0} aria-label={`Move ${WIDGETS[widget.id].label} up`}
          onClick={() => change(moveWidget(draft, widget.id, -1), `${WIDGETS[widget.id].label} moved up.`)}>↑</Button>
        <Button type="button" disabled={pending || !canCustomize || index === draft.length - 1} aria-label={`Move ${WIDGETS[widget.id].label} down`}
          onClick={() => change(moveWidget(draft, widget.id, 1), `${WIDGETS[widget.id].label} moved down.`)}>↓</Button>
        <label className="widget-size-label">Width
          <select value={widget.width} disabled={pending || !canCustomize} aria-label={`Width of ${WIDGETS[widget.id].label}`}
            onChange={(event) => { const width = event.target.value === "full" ? "full" : "half";
              change(draft.map((item) => item.id === widget.id ? { ...item, width } : item), `${WIDGETS[widget.id].label} set to ${width} width.`); }}>
            <option value="half">Half</option><option value="full">Full</option>
          </select>
        </label>
        <label className="widget-size-label">Color
          <select value={widget.accent??"auto"} disabled={pending||!canCustomize} aria-label={"Color of "+WIDGETS[widget.id].label} onChange={event=>change(setWidgetAccent(draft,widget.id,event.target.value),WIDGETS[widget.id].label+" color changed. Save to keep it.")}>
            <option value="auto">Theme default</option>{Object.entries(WIDGET_ACCENTS).map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <Button type="button" disabled={pending || !canCustomize} aria-label={`Remove ${WIDGETS[widget.id].label} widget`}
          onClick={() => change(draft.filter((item) => item.id !== widget.id), `${WIDGETS[widget.id].label} removed from the dashboard.`)}>Remove</Button>
      </div>}
      <div className="widget-body" id={"widget-body-"+widget.id} data-mobile-collapsed={!editing && !mobileOpen.includes(widget.id)}>{slots[widget.id]}</div>
    </article>)}</div>
  </div>;
}
