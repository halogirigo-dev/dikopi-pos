import { cn } from "@/lib/utils";

export function Spinner({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn("spinner", className)}
      style={{ width: size, height: size }}
    />
  );
}
