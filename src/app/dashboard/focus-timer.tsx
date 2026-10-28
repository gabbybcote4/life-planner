"use client";
import { createContext, useContext, useEffect, useReducer, useState, type ReactNode, type Dispatch, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import {EditDialog} from "@/components/ui/edit-dialog";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/fields";
import { FormFeedback } from "@/components/ui/feedback";
import { TIMER_MODES, createTimer, timerReducer, formatTimer, parseTimerMinutes, type TimerState, type TimerAction, type TimerMode } from "@/lib/timer/timer";

const TimerContext = createContext<{ state: TimerState; dispatch: Dispatch<TimerAction> } | null>(null);
export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(timerReducer, undefined, () => createTimer());
  useEffect(() => {
    if (state.status !== "running") return;
    const tick = () => dispatch({ type: "tick", now: Date.now() });
    const interval = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("pageshow", tick);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", tick); window.removeEventListener("pageshow", tick); };
  }, [state.status]);
  return <TimerContext value={{ state, dispatch }}>{children}<p className="visually-hidden" role="status" aria-live="polite">{state.status === "complete" ? TIMER_MODES[state.mode].label + " finished. Take a moment before starting another session." : ""}</p></TimerContext>;
}
function useFocusTimer() {
  const value = useContext(TimerContext);
  if (!value) throw new Error("Focus timer requires its account-scoped provider.");
  return value;
}
function TimerControls({ compact = false }: { compact?: boolean }) {
  const { state, dispatch } = useFocusTimer();
  return <div className="focus-timer-controls">
    <Button variant="primary" onClick={() => dispatch({ type: state.status === "running" ? "pause" : "start", now: Date.now() })}>{state.status === "running" ? "Pause" : state.status === "paused" ? "Resume" : state.status === "complete" ? "Start again" : "Start"}</Button>
    <Button variant={compact ? "text" : "secondary"} onClick={() => dispatch({ type: "reset" })} disabled={state.status === "ready"}>Reset</Button>
  </div>;
}
function TimerDuration() {
  const { state, dispatch } = useFocusTimer(), [error, setError] = useState<string>();
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = parseTimerMinutes(new FormData(event.currentTarget).get("minutes"));
    if (minutes === null) { setError("Choose a whole number from 1 to 180 minutes."); return; }
    if (state.status === "running") return;
    dispatch({ type: "duration", minutes }); setError(undefined);
  }
  return <EditDialog title="Edit timer session length"><form onSubmit={apply}>
    <label htmlFor="focus-minutes">Minutes (1–180)</label><div className="focus-duration-fields"><TextInput key={state.mode + state.durationMs} id="focus-minutes" name="minutes" type="number" min={1} max={180} step={1} required defaultValue={state.durationMs / 60000} disabled={state.status === "running"} /><Button type="submit" variant="secondary" disabled={state.status === "running"}>Set &amp; reset</Button></div>
    <p className="muted">Changing the session or length resets the countdown. Pause first.</p><FormFeedback error={error} />
  </form></EditDialog>;
}
export function FocusTimerWidget() {
  const { state, dispatch } = useFocusTimer();
  const progress = 100 * (state.durationMs - state.remainingMs) / state.durationMs;
  return <section className="focus-timer" id="focus-timer" aria-labelledby="focus-timer-heading">
    <h2 id="focus-timer-heading">One thing at a time.</h2>
    <div className="focus-timer-modes" role="group" aria-label="Timer session">{(Object.keys(TIMER_MODES) as TimerMode[]).map(mode => <Button key={mode} variant="secondary" aria-pressed={state.mode === mode} disabled={state.status === "running"} onClick={() => dispatch({ type: "mode", mode })}>{TIMER_MODES[mode].label}</Button>)}</div>
    <div className="focus-timer-dial" style={{ "--timer-progress": progress + "%" } as CSSProperties}><div><span className="muted">{TIMER_MODES[state.mode].label}</span><output aria-label="Time remaining" aria-live="off">{formatTimer(state.remainingMs)}</output><span className="muted">{state.status === "complete" ? "Session complete" : state.status === "running" ? "In progress" : state.status === "paused" ? "Paused" : "Ready when you are"}</span></div></div>
    <progress className="visually-hidden" value={state.durationMs - state.remainingMs} max={state.durationMs} aria-label="Session progress" />
    <TimerControls /><TimerDuration />
    <p className="muted focus-timer-note">Keeps time while you browse this tab. Refreshing or closing it resets the session. No sound or notifications.</p>
  </section>;
}
export function FocusTimerStatus() {
  const { state } = useFocusTimer();
  if (state.status === "ready") return null;
  return <details className="focus-timer-status"><summary>{TIMER_MODES[state.mode].label} · <span aria-live="off">{formatTimer(state.remainingMs)}</span>{state.status === "paused" ? " · paused" : state.status === "complete" ? " · done" : ""}</summary><div><TimerControls compact /><Link className="text-link" href="/#focus-timer">Open dashboard timer</Link><p className="muted">In this tab only. Reset ends this session. If the widget is hidden, add Focus timer through Customize dashboard.</p></div></details>;
}

// A guidance suggestion never replaces an existing running or paused session.
export function StartGuidedFocus(){
 const {state,dispatch}=useFocusTimer(),busy=state.status==="running"||state.status==="paused";
 return <Button variant="secondary" disabled={busy} onClick={()=>{
  dispatch({type:"mode",mode:"focus"});dispatch({type:"start",now:Date.now()});
 }}>{busy?"Use your active timer above":"Start "+TIMER_MODES.focus.minutes+"-min focus"}</Button>;
}
