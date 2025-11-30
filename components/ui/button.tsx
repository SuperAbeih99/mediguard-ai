'use client';

import Link from "next/link";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "default" | "sm" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white shadow-[0_20px_45px_rgba(37,99,235,0.35)] hover:bg-blue-500 focus-visible:ring-blue-200",
  secondary:
    "bg-white text-slate-900 border border-slate-200 shadow-sm hover:border-blue-200 hover:text-blue-700 focus-visible:ring-blue-100",
  ghost:
    "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-6 text-sm",
  sm: "h-9 px-4 text-sm",
  lg: "h-12 px-8 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", href, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {props.children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props} />
    );
  }
);

Button.displayName = "Button";
