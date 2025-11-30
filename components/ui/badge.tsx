import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border border-slate-200/70",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-100",
  error: "bg-rose-50 text-rose-700 border border-rose-100",
  info: "bg-blue-50 text-blue-700 border border-blue-100",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  children,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        badgeStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
