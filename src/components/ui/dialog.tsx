"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

const DialogContext = React.createContext<DialogProps | null>(null);

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    // lock scroll subtly — keep width stable
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open) return null;
  return <DialogContext.Provider value={{ open, onOpenChange, children }}>{children}</DialogContext.Provider>;
}

export function DialogOverlay({ className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DialogContext);
  return (
    <div
      className={cn("modal-overlay", className)}
      onClick={(e) => {
        onClick?.(e);
        ctx?.onOpenChange(false);
      }}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  onClose,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
  const ctx = React.useContext(DialogContext);
  return (
    <DialogOverlay>
      <div
        role="dialog"
        aria-modal="true"
        className={cn("modal-card w-full max-w-[560px] p-0", className)}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* focus trap hint — first element */}
        <div tabIndex={0} aria-hidden="true" className="sr-only" />
        {children}
        <button
          aria-label="Close dialog"
          onClick={() => {
            onClose?.();
            ctx?.onOpenChange(false);
          }}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-transparent bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors duration-[var(--duration-fast)]"
        >
          <span aria-hidden>×</span>
        </button>
      </div>
    </DialogOverlay>
  );
}

// Bottom sheet variant — slides from bottom, same overlay
export function BottomSheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  children: React.ReactNode;
}) {
  const [closing, setClosing] = React.useState(false);
  const [render, setRender] = React.useState(open);

  React.useEffect(() => {
    if (open) {
      setRender(true);
      setClosing(false);
      document.body.style.overflow = "hidden";
    } else if (render) {
      setClosing(true);
      const t = setTimeout(() => {
        setRender(false);
        setClosing(false);
        document.body.style.overflow = "";
      }, 220);
      return () => clearTimeout(t);
    }
  }, [open, render]);

  React.useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [render, onOpenChange]);

  if (!render) return null;
  return (
    <div className={cn("bottom-sheet", closing && "closing")} onClick={() => onOpenChange(false)} role="dialog" aria-modal="true">
      <div className="bottom-sheet-card w-full" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden />
        {children}
      </div>
    </div>
  );
}
