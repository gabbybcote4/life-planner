const sage = {
  background: "#f4efe5", foreground: "#343b35", surface: "#fffcf7", input: "#fffefa",
  panel: "#f5f2e8", tint: "#edf0e4", selected: "#dfe8d2", muted: "#596057",
  primary: "#42583e", "on-primary": "#fffdf7", "primary-hover": "#32442e",
  focus: "#6d7b51", border: "#c7cebb", "input-border": "#87927e",
  error: "#852e23", "error-surface": "#f9ebe5", "error-border": "#c48a7a",
  success: "#344d31", "success-surface": "#edf1e5", shadow: "#343b351f", pattern: "#64745b18",
};
const rose: typeof sage = {
  background: "#f5eaec", foreground: "#48333b", surface: "#fff9f8", input: "#fffcfb",
  panel: "#f5ecee", tint: "#f2e4e8", selected: "#ead0da", muted: "#70535e",
  primary: "#7e4b60", "on-primary": "#fff9f8", "primary-hover": "#65394c",
  focus: "#98637a", border: "#d5bec7", "input-border": "#a17c8b",
  error: "#8d302b", "error-surface": "#fce9e6", "error-border": "#c88c83",
  success: "#405638", "success-surface": "#eaf0e4", shadow: "#48333b1f", pattern: "#8b596d18",
};
const midnight: typeof sage = {
  background: "#171e24", foreground: "#eeeae0", surface: "#222c33", input: "#1b252c",
  panel: "#29343b", tint: "#2d3c3c", selected: "#3c5044", muted: "#c2c7bd",
  primary: "#b4c6a0", "on-primary": "#182219", "primary-hover": "#ceddbc",
  focus: "#d7c18c", border: "#59675f", "input-border": "#94a28f",
  error: "#ffc2b6", "error-surface": "#492c2c", "error-border": "#be8276",
  success: "#c9ddba", "success-surface": "#2c4030", shadow: "#00000040", pattern: "#d5dbce12",
};

export const THEMES = {
  sage: { label: "Sage", description: "Warm paper, soft greens, and a little breathing room.", colors: sage },
  rose: { label: "Rose", description: "Soft rose, warm ink, and a gentle touch of colour.", colors: rose },
  midnight: { label: "Midnight", description: "Deep ink, muted greens, and a calmer evening glow.", colors: midnight },
};
export type Theme = keyof typeof THEMES;
export type ThemeState = { error?: string; message?: string };
export const DEFAULT_THEME: Theme = "sage";

export function parseTheme(value: unknown): Theme | null {
  return typeof value === "string" && Object.hasOwn(THEMES, value) ? value as Theme : null;
}

export function themeVariables(theme: Theme): Record<string, string> {
  return {
    ...Object.fromEntries(Object.entries(THEMES[theme].colors).map(([name, color]) => [`--${name}`, color])),
    colorScheme: theme === "midnight" ? "dark" : "light",
  };
}
