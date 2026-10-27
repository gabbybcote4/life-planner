import type { ReactNode } from "react";

// Decorative dots are shared by windows, dashboard widgets, and theme previews.
export function WindowDots() {
  return <span className="window-dots" aria-hidden="true"><i /><i /><i /></span>;
}

// Only the chrome lives here. Callers keep their own title/heading and actions.
export function WindowTitleBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <header className={`window-titlebar ${className}`.trim()}><WindowDots />{children}</header>;
}

export function DesktopWindow({ title, children, className = "", action, embedded = false }: {
  title: string; children: ReactNode; className?: string; action?: ReactNode; embedded?: boolean;
}) {
  return <section className={(embedded ? "embedded-window " : "desktop-window ") + className} aria-label={title}>
    {embedded
      ? <header className="embedded-panel-heading"><h2>{title}</h2>{action}</header>
      : <WindowTitleBar><h2>{title}</h2>{action}</WindowTitleBar>}
    <div className="window-content">{children}</div>
  </section>;
}
