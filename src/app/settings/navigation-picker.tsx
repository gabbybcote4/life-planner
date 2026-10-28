"use client";
import { useActionState, useState } from "react";
import { NAV_POSITIONS, DEFAULT_NAV_POSITION, type NavPosition } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/feedback";
import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";
import { saveNavigation, type NavigationState } from "./navigation-actions";
export function NavigationPicker({ saved, revision }: { saved: NavPosition; revision: number }) {
  const [choice, setChoice] = useState(saved), [confirmed, setConfirmed] = useState(saved), [baseline, setBaseline] = useState(revision);
  const [state, action, pending] = useActionState<NavigationState, FormData>(async (previous, data) => {
    const result = await runAction(() => saveNavigation(previous, data), UNCONFIRMED_SAVE);
    if (!result.error && result.revision) { setConfirmed(choice); setBaseline(result.revision); }
    return result;
  }, {});
  const changed = choice !== confirmed;
  return <form className="navigation-form" action={action} aria-busy={pending}>
    <h2>Navigation position</h2><p className="muted">Choose where your planner menu lives.</p>
    <div className="navigation-preview" data-position={choice} role="img" aria-label={NAV_POSITIONS[choice] + " navigation preview"}>
      <div className="navigation-preview-bar" aria-hidden="true">•••</div><div className="navigation-preview-page" aria-hidden="true"><span /><span /><span /></div>
    </div>
    <input type="hidden" name="revision" value={baseline} />
    <fieldset key={baseline} disabled={pending}><legend>Place navigation</legend><div className="navigation-options">{(Object.keys(NAV_POSITIONS) as NavPosition[]).map(position => <label key={position}><input name="position" type="radio" value={position} checked={choice === position} onChange={() => setChoice(position)} />{NAV_POSITIONS[position]}</label>)}</div>
      <div className="form-actions"><Button variant="secondary" onClick={() => setChoice(DEFAULT_NAV_POSITION)}>Preview default</Button><Button variant="text" disabled={!changed} onClick={() => setChoice(confirmed)}>Cancel changes</Button></div>
    </fieldset>
    <p className="muted">In narrow windows and on phones, Left/Right use a compact side rail. Top/Bottom use the chosen edge. More opens the full menu.</p>
    <p className="muted">{changed ? "Preview only — save to move navigation across your planner." : "Your saved navigation position."}</p>
    <Button variant="primary" type="submit" pending={pending} pendingLabel="Saving..." disabled={!changed || pending}>Save navigation</Button><FormFeedback error={state.error} message={!changed ? state.message : undefined} />
  </form>;
}
