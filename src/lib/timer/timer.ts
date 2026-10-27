export const TIMER_MODES = {
  focus: { label: "Focus", minutes: 25 },
  short: { label: "Short break", minutes: 5 },
  long: { label: "Long break", minutes: 15 },
} as const;
export type TimerMode = keyof typeof TIMER_MODES;
export type TimerState = {
  mode: TimerMode; durationMs: number; remainingMs: number;
  status: "ready" | "running" | "paused" | "complete"; endsAt: number | null;
};
export type TimerAction =
  | { type: "start" | "pause" | "tick"; now: number }
  | { type: "reset" }
  | { type: "mode"; mode: TimerMode }
  | { type: "duration"; minutes: number };
export function createTimer(mode: TimerMode = "focus", minutes: number = TIMER_MODES[mode].minutes): TimerState {
  const durationMs = minutes * 60000;
  return { mode, durationMs, remainingMs: durationMs, status: "ready", endsAt: null };
}
export function parseTimerMinutes(value: unknown): number | null {
  return typeof value === "string" && /^(?:[1-9]|[1-9]\d|1[0-7]\d|180)$/.test(value) ? Number(value) : null;
}
export function timerRemaining(state: TimerState, now: number): number {
  return state.status === "running" && state.endsAt !== null ? Math.max(0, Math.min(state.durationMs, state.endsAt - now)) : state.remainingMs;
}
// Time is supplied by effects/events, never read during rendering or prerendering.
export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  if (action.type === "reset") return createTimer(state.mode, state.durationMs / 60000);
  if (action.type === "mode") return state.status === "running" ? state : createTimer(action.mode);
  if (action.type === "duration") return state.status === "running" || !Number.isInteger(action.minutes) || action.minutes < 1 || action.minutes > 180 ? state : createTimer(state.mode, action.minutes);
  if (!Number.isFinite(action.now)) return state;
  if (action.type === "start") {
    if (state.status === "running") return state;
    const remainingMs = state.status === "complete" ? state.durationMs : state.remainingMs;
    return { ...state, status: "running", remainingMs, endsAt: action.now + remainingMs };
  }
  if (state.status !== "running") return state;
  const remainingMs = timerRemaining(state, action.now);
  if (remainingMs === 0) return { ...state, remainingMs: 0, endsAt: null, status: "complete" };
  return { ...state, remainingMs, ...(action.type === "pause" ? { status: "paused" as const, endsAt: null } : {}) };
}
export function formatTimer(milliseconds: number): string {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}
