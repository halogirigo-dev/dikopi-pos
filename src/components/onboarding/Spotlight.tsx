"use client";
import { useEffect, useState } from "react";

type Rect = { top: number; left: number; width: number; height: number };

export function Spotlight({ target, onClose }: { target: string; onClose: () => void }) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    function update() {
      const el = document.querySelector(target) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      // add small padding
      setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const t = setTimeout(update, 300);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      clearTimeout(t);
    };
  }, [target]);

  if (!rect) {
    return (
      <div
        aria-hidden
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 45, background: "rgba(0,0,0,.45)" }}
      />
    );
  }

  // Overlay with hole using box-shadow technique
  return (
    <div
      aria-hidden
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        background: "rgba(0,0,0,.45)",
      }}
    >
      {/* highlight box */}
      <div
        style={{
          position: "absolute",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: 12,
          boxShadow: "0 0 0 9999px rgba(0,0,0,.45)",
          border: "2px solid rgba(255,255,255,.9)",
          background: "transparent",
          pointerEvents: "none",
          transition: "all .3s ease",
        }}
      />
    </div>
  );
}
