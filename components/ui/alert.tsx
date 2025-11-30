import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const alertStyles: Record<
  AlertVariant,
  { container: string; accent: string; text: string }
> = {
  info: {
    container: "bg-blue-50/80 border border-blue-100",
    accent: "bg-blue-500",
    text: "text-blue-800",
  },
  success: {
    container: "bg-emerald-50/80 border border-emerald-100",
    accent: "bg-emerald-500",
    text: "text-emerald-800",
  },
  warning: {
    container: "bg-amber-50/80 border border-amber-100",
    accent: "bg-amber-500",
    text: "text-amber-800",
  },
  error: {
    container: "bg-rose-50/80 border border-rose-100",
    accent: "bg-rose-500",
    text: "text-rose-800",
  },
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  variant?: AlertVariant;
}

export function Alert({
  className,
  title,
  children,
  variant = "info",
  ...props
}: AlertProps) {
  const styles = alertStyles[variant];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]",
        styles.container,
        className
      )}
      {...props}
    >
      <span className={cn("mt-1 h-2 w-2 rounded-full", styles.accent)} />
      <div className="space-y-1">
        <p className={cn("text-sm font-semibold", styles.text)}>{title}</p>
        {children ? (
          <p className={cn("text-sm text-slate-600", styles.text)}>{children}</p>
        ) : null}
      </div>
    </div>
  );
}
