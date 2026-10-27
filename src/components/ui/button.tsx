import type { ComponentProps } from "react";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "text" | "plain";
  pending?: boolean;
  pendingLabel?: string;
};

const variants = { primary: "primary-button", secondary: "secondary-button", text: "task-edit-button", plain: "" };

export function Button({ variant = "plain", type = "button", pending = false,
  pendingLabel = "Saving...", disabled, className = "", children, ...props }: ButtonProps) {
  return <button {...props} type={type} disabled={Boolean(disabled || pending)}
    aria-busy={pending || undefined} className={["ui-button", variants[variant], className].filter(Boolean).join(" ")}>
    {pending ? pendingLabel : children}
  </button>;
}
