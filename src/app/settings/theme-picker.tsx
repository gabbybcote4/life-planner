"use client";

import { FormFeedback } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import type { CSSProperties } from "react";
import { useActionState, useState } from "react";
import { saveTheme } from "./actions";
import { THEMES, parseTheme, themeVariables, type Theme, type ThemeState } from "@/lib/themes/themes";

export function ThemePicker({ savedTheme }: { savedTheme: Theme }) {
  const [choice, setChoice] = useState<Theme>(savedTheme);
  const [confirmed, setConfirmed] = useState<Theme>(savedTheme);
  const [state, action, pending] = useActionState<ThemeState, FormData>(async (previous, data) => {
    const result = await saveTheme(previous, data);
    if (!result.error) setConfirmed(choice);
    return result;
  }, {});
  return <form action={action} className="theme-form" aria-busy={pending}>
    <fieldset disabled={pending}>
      <legend>Choose your planner theme</legend>
      <div className="theme-options">{(Object.keys(THEMES) as Theme[]).map((theme) => <label key={theme}
        className={`theme-option${choice === theme ? " is-chosen" : ""}`}>
        <span className="theme-swatch" style={themeVariables(theme) as CSSProperties} aria-hidden="true">
          <span className="theme-swatch-paper"><span className="theme-swatch-heading" /><span className="theme-swatch-line" />
            <span className="theme-swatch-line short" /><span className="theme-swatch-button" /></span>
        </span>
        <span className="theme-option-name"><input type="radio" name="theme" value={theme} checked={choice === theme}
          onChange={(event) => { const value = parseTheme(event.target.value); if (value) setChoice(value); }} />{THEMES[theme].label}</span>
        <span className="theme-description">{THEMES[theme].description}</span>
      </label>)}</div>
    </fieldset>
    <p className="muted theme-save-hint">Your choice applies across the planner after saving and follows your account when you sign in again.</p>
    <Button variant="primary" type="submit" disabled={pending || choice === confirmed} pending={pending} pendingLabel="Saving...">Save theme</Button>
    <FormFeedback error={state.error} message={choice === confirmed ? state.message : undefined} />
  </form>;
}
