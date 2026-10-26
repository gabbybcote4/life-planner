"use client";

import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";

import { EmptyState } from "@/components/ui/empty-state";
import { FormFeedback } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { saveDashboardLayout } from "./actions";
import { DEFAULT_LAYOUT, WIDGETS, moveWidget, type Widget, type WidgetId, type LayoutState } from "@/lib/dashboard/layout";

export function DashboardWidgets({ savedLayout, savedRevision, canCustomize, slots }: {
  savedLayout: Widget[]; savedRevision: number; canCustomize: boolean; slots: Record<WidgetId, ReactNode>;
}) {
  const [editing, setEditing] = useState(false);
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
    </div>
    {editing && <section className="widget-library" aria-labelledby="widget-library-heading">
      <h2 id="widget-library-heading">Arrange your dashboard</h2>
      <p className="muted">Add a widget, move it up or down, and choose half or full width. Removing a widget keeps your saved tasks safe.</p>
      <div className="widget-library-options">{missing.length === 0 ? <p className="muted">All available widgets are on your dashboard.</p> :
        missing.map((id) => <Button variant="secondary" key={id} type="button" disabled={pending || !canCustomize}
          onClick={() => change([...draft, { id, width: "half" }], `${WIDGETS[id].label} added.`)}>
          Add {WIDGETS[id].label}
        </Button>)}</div>
      <div className="layout-save-controls">
        <form action={action}>
          <Button variant="primary" type="submit" disabled={pending || !dirty || !canCustomize} pending={pending} pendingLabel="Saving...">Save layout</Button>
        </form>
        <Button variant="text" type="button" disabled={pending || !canCustomize}
          onClick={() => { setDraft(saved); setEditing(false); setAnnouncement("Saved layout restored."); }}>Cancel</Button>
        <Button variant="text" type="button" disabled={pending || !canCustomize}
          onClick={() => change(DEFAULT_LAYOUT.map((widget) => ({ ...widget })), "Default layout restored. Save to keep it.")}>Restore default layout</Button>
      </div>
      <p className="muted">Save before leaving this page. Layout changes are not saved automatically.</p>
      <FormFeedback error={state.error} />
    </section>}
    <p className="layout-announcement" role="status" aria-live="polite">{pending ? "Saving your layout..." : announcement}</p>
    {draft.length === 0 && <EmptyState title="A little breathing room.">Use Customize dashboard to add widgets. Your saved tasks are still on the Tasks page.</EmptyState>}
    <div className="custom-widget-grid">{draft.map((widget, index) => <article key={widget.id}
      className={`dashboard-widget widget-${widget.width}`} aria-label={WIDGETS[widget.id].label}>
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
        <Button type="button" disabled={pending || !canCustomize} aria-label={`Remove ${WIDGETS[widget.id].label} widget`}
          onClick={() => change(draft.filter((item) => item.id !== widget.id), `${WIDGETS[widget.id].label} removed from the dashboard.`)}>Remove</Button>
      </div>}
      {slots[widget.id]}
    </article>)}</div>
  </div>;
}
