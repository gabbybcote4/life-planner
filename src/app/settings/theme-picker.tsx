"use client";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import {FormFeedback} from "@/components/ui/feedback";
import {Button} from "@/components/ui/button";
import {WindowDots} from "@/components/ui/desktop-window";
import type {CSSProperties} from "react";
import {useActionState,useState} from "react";
import {saveTheme} from "./actions";
import {THEMES,parseTheme,themeVariables,type Theme,type ThemeState} from "@/lib/themes/themes";
export function ThemePicker({savedTheme}:{savedTheme:Theme}) {
 const [choice,setChoice]=useState<Theme>(savedTheme),[confirmed,setConfirmed]=useState<Theme>(savedTheme);
 const [state,action,pending]=useActionState<ThemeState,FormData>(async(previous,data)=>{const result=await runAction(()=>saveTheme(previous,data),UNCONFIRMED_SAVE);if(!result.error)setConfirmed(choice);return result;},{});
 return <form action={action} className="theme-form" aria-busy={pending}>
 <section className="theme-live-preview" aria-label={"Preview of "+THEMES[choice].label} style={themeVariables(choice) as CSSProperties}>
 <div className="window-titlebar"><WindowDots/><strong>{THEMES[choice].label}</strong><span>{THEMES[choice].mode} palette</span></div>
 <div className="theme-preview-desktop" aria-hidden="true"><div className="theme-preview-navigation">▧ My desktop<br/>✓ Tasks<br/>▤ Notes</div><div className="theme-preview-widgets"><div>✦ A little room for your day.<div className="theme-preview-line"/></div><div>✓ Small steps count.<div className="theme-preview-line"/></div><div>✧ Ideas connect.<div className="theme-preview-line"/></div></div></div>
 <p className="muted" aria-live="polite">{choice===confirmed?"Your saved theme.":"Preview only — Save theme to apply across your planner."}</p>
 </section>
 <fieldset disabled={pending}><legend>Choose your planner theme</legend>
 {(["light","dark"] as const).map(mode=><section key={mode} className="theme-library-group" aria-label={mode+" themes"}><h2>{mode==="light"?"Light desktops":"Dark desktops"}</h2><p className="muted">{mode==="light"?"Paper, pastels, and bright windows.":"Cozy dark panels with clear, gentle accents."}</p>
 <div className="theme-options">{(Object.keys(THEMES) as Theme[]).filter(theme=>THEMES[theme].mode===mode).map(theme=><label key={theme} className={`theme-option${choice===theme?" is-chosen":""}`}>
 <span className="theme-swatch" style={themeVariables(theme) as CSSProperties} aria-hidden="true"><span className="theme-swatch-paper"><span className="theme-swatch-heading"/><span className="theme-swatch-line"/><span className="theme-swatch-line short"/><span className="theme-swatch-button"/></span><span className="theme-accent-dots">{["pink","mint","blue","yellow","lilac"].map(color=><i key={color} style={{background:`var(--accent-${color})`}}/>)}</span></span>
 <span className="theme-option-name"><input type="radio" name="theme" value={theme} checked={choice===theme} onChange={event=>{const value=parseTheme(event.target.value);if(value)setChoice(value);}}/>{THEMES[theme].label}</span><span className="theme-description">{THEMES[theme].description}</span>
 </label>)}</div></section>)}
 </fieldset>
 <p className="muted theme-save-hint">Your saved theme follows your account across the planner. Choosing a preview does not change the saved theme.</p>
 <Button variant="primary" type="submit" disabled={pending||choice===confirmed} pending={pending} pendingLabel="Saving...">Save theme</Button>
 <FormFeedback error={state.error} message={choice===confirmed?state.message:undefined}/>
 </form>;
}
