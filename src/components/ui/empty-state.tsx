import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="task-empty"><p className="empty-title">{title}</p><p className="muted">{children}</p></div>;
}
