"use client";
import { useEffect, useLayoutEffect, useState, useRef } from "react";

type Props = {
  target: string;
  title: string;
  description: string;
  icon?: string;
  step: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  center?: boolean;
};

export function OnboardingTooltip({ target, title, description, icon, step, total, onNext, onPrev, onSkip, isFirst, isLast, center }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: "top" | "bottom" }>({ top: 0, left: 0, placement: "bottom" });
  const [ready, setReady] = useState(false);
  const [fallbackCenter, setFallbackCenter] = useState(false);

  useLayoutEffect(() => {
    if (center) {
      setPos({ top: window.innerHeight / 2, left: window.innerWidth / 2, placement: "bottom" });
      setReady(true);
      return;
    }
    function compute() {
      const el = document.querySelector(target) as HTMLElement | null;
      const tip = ref.current;
      if (!el || !tip) {
        // fallback to bottom sheet/center if target missing (e.g. form not open)
        if (!el) {
          setFallbackCenter(true);
          setReady(true);
        }
        return;
      }
      const r = el.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      const gap = 16;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // default bottom
      let top = r.bottom + gap;
      let placement: "top" | "bottom" = "bottom";
      if (top + tr.height + 20 > vh && r.top - tr.height - gap > 20) {
        top = r.top - tr.height - gap;
        placement = "top";
      }
      // horizontal centering clamped
      let left = r.left + r.width / 2 - tr.width / 2;
      left = Math.max(12, Math.min(vw - tr.width - 12, left));
      // mobile: if tooltip too wide, ensure fits
      setPos({ top, left, placement });
      setReady(true);
    }
    // delay to ensure spotlight positioned
    const t = setTimeout(compute, 350);
    window.addEventListener("resize", compute);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", compute);
    };
  }, [target, center]);

  // fallback to bottom sheet if target not found
  if (fallbackCenter) {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          borderRadius: "24px 24px 0 0",
          opacity: ready ? 1 : 0,
          transition: "opacity .2s",
        }}
        className="card"
      >
        <div className="sheet-handle" style={{ marginTop: 10 }} />
        <div style={{ padding: "0 20px 20px" }}>
          <TooltipContent icon={icon} title={title} description={description} step={step} total={total} onNext={onNext} onPrev={onPrev} onSkip={onSkip} isFirst={isFirst} isLast={isLast} />
        </div>
      </div>
    );
  }

  // mobile fallback: bottom sheet style if target near bottom and large tooltip
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  if (center) {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 60,
          width: "min(420px, calc(100vw - 24px))",
          opacity: ready ? 1 : 0,
          transition: "opacity .2s",
        }}
        className="card"
      >
        <div style={{ padding: 20 }}>
          <TooltipContent icon={icon} title={title} description={description} step={step} total={total} onNext={onNext} onPrev={onPrev} onSkip={onSkip} isFirst={isFirst} isLast={isLast} />
        </div>
      </div>
    );
  }

  // Bottom sheet on mobile when tooltip would overflow
  if (isMobile && pos.placement === "bottom" && pos.top > window.innerHeight - 220) {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          borderRadius: "24px 24px 0 0",
          opacity: ready ? 1 : 0,
          transition: "opacity .2s",
        }}
        className="card"
      >
        <div className="sheet-handle" style={{ marginTop: 10 }} />
        <div style={{ padding: "0 20px 20px" }}>
          <TooltipContent icon={icon} title={title} description={description} step={step} total={total} onNext={onNext} onPrev={onPrev} onSkip={onSkip} isFirst={isFirst} isLast={isLast} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 60,
        width: "min(360px, calc(100vw - 24px))",
        opacity: ready ? 1 : 0,
        transition: "opacity .2s, top .3s, left .3s",
      }}
      className="card"
    >
      <div style={{ padding: 16 }}>
        <TooltipContent icon={icon} title={title} description={description} step={step} total={total} onNext={onNext} onPrev={onPrev} onSkip={onSkip} isFirst={isFirst} isLast={isLast} />
      </div>
      {/* arrow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: 12,
          height: 12,
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          borderTop: "1px solid var(--border)",
          rotate: pos.placement === "bottom" ? "-45deg" : "135deg",
          top: pos.placement === "bottom" ? -6 : "auto",
          bottom: pos.placement === "top" ? -6 : "auto",
        }}
      />
    </div>
  );
}

function TooltipContent({ icon, title, description, step, total, onNext, onPrev, onSkip, isFirst, isLast }: { icon?: string; title: string; description: string; step: number; total: number; onNext: () => void; onPrev: () => void; onSkip: () => void; isFirst: boolean; isLast: boolean }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {icon && <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: 16 }}>{icon}</span>}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: ".06em", textTransform: "uppercase" }}>{step} dari {total}</div>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: "20px", marginTop: 2 }}>{title}</div>
          </div>
        </div>
        <button
          aria-label="Lewati"
          onClick={onSkip}
          style={{ fontSize: 12, color: "var(--muted)", background: "transparent", border: 0, padding: 4, whiteSpace: "nowrap" }}
        >
          Lewati
        </button>
      </div>
      <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: "18px", margin: "10px 0 0" }}>{description}</p>
      {/* progress dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 14, alignItems: "center" }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{ width: i + 1 === step ? 18 : 6, height: 6, borderRadius: 999, background: i + 1 === step ? "var(--accent)" : "var(--border)", transition: "all .2s" }} />
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>{step}/{total}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {!isFirst && (
          <button className="btn" style={{ flex: 1, minHeight: 44 }} onClick={onPrev}>
            Kembali
          </button>
        )}
        <button className="btn accent" style={{ flex: 1, minHeight: 44 }} onClick={onNext} autoFocus>
          {isLast ? "Selesai ✓" : "Berikutnya →"}
        </button>
      </div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button onClick={onSkip} style={{ fontSize: 12, color: "var(--muted)", background: "transparent", border: 0 }}>
          Jangan tampilkan lagi
        </button>
      </div>
    </>
  );
}
