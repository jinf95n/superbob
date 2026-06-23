import { ReactNode } from "react";

type BadgeVariant = "success" | "error" | "warning" | "info" | "neutral";

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-sb-success/10 text-sb-success",
  error: "bg-sb-error/10 text-sb-error",
  warning: "bg-sb-warning/10 text-sb-warning",
  info: "bg-sb-info/10 text-sb-info",
  neutral: "bg-sb-muted/10 text-sb-muted",
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-medium ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
