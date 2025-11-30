import { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn("text-sm font-medium text-slate-700", className)}
      {...props}
    >
      {children}
    </label>
  );
}
