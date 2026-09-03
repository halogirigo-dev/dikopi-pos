import { cn } from "@/lib/utils";
import React from "react";

export function Button({ className, variant = "default", size="default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"outline"|"ghost"|"destructive", size?: "default"|"sm"|"lg"|"icon" }) {
  const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string,string> = {
    default: "bg-zinc-900 text-white hover:bg-zinc-800",
    outline: "border border-zinc-200 bg-white hover:bg-zinc-50",
    ghost: "hover:bg-zinc-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes: Record<string,string> = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
