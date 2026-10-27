import type { ComponentProps } from "react";

export function TextInput({ className = "", type = "text", ...props }: ComponentProps<"input">) {
  return <input {...props} type={type} className={`form-control ${className}`.trim()} />;
}

export function TextArea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={`form-control ${className}`.trim()} />;
}

// Use for standard dropdowns so input styling and keyboard focus stay consistent.
// Specialized widget-toolbar selects keep their compact native styling.
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`form-control ${className}`.trim()} />;
}
