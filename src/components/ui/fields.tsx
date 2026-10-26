import type { ComponentProps } from "react";

export function TextInput({ className = "", type = "text", ...props }: ComponentProps<"input">) {
  return <input {...props} type={type} className={`form-control ${className}`.trim()} />;
}

export function TextArea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={`form-control ${className}`.trim()} />;
}
