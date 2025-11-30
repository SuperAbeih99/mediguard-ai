import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-100/80 bg-white/95 p-6 shadow-[0_30px_60px_rgba(15,23,42,0.05)] backdrop-blur",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
