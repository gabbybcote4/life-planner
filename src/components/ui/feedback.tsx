import type { ReactNode } from "react";

export function FormFeedback({ error, message, pending = false, pendingLabel = "Saving...",
  className = "", panel = false }: {
  error?: string; message?: ReactNode; pending?: boolean; pendingLabel?: string; className?: string; panel?: boolean;
}) {
  return <div className={`form-feedback ${className}`.trim()} aria-live="polite" aria-atomic="true">
    {pending ? <p className="muted">{pendingLabel}</p> : error ?
      <p className="form-error" role="alert">{error}</p> : message ?
        <p className={panel ? "form-message" : "save-message"}>{message}</p> : null}
  </div>;
}
