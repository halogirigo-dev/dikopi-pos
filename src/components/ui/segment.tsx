"use client";
import { useLayoutEffect, useRef, useState } from "react";

type Item = { id: string; label: string };

export function Segment({
  items,
  active,
  onChange,
  className,
  style,
}: {
  items: Item[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [bubble, setBubble] = useState({ left: 0, width: 0, scale: 1 });
  const [ready, setReady] = useState(false);
  const prevActive = useRef(active);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isFirstMount = useRef(true);

  const measure = (animateStretch = false) => {
    const el = tabRefs.current[active];
    const container = containerRef.current;
    if (!el || !container) return;
    const cRect = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const left = r.left - cRect.left;
    const width = r.width;
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (animateStretch && prevActive.current !== active && !prefersReduced) {
      // liquid stretch: briefly elongate along travel direction
      setBubble({ left, width, scale: 1.04 });
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setBubble((s) => ({ ...s, scale: 1 }));
      }, 180) as unknown as number;
    } else {
      setBubble({ left, width, scale: 1 });
    }
    prevActive.current = active;
  };

  useLayoutEffect(() => {
    const isChange = !isFirstMount.current && prevActive.current !== active;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      measure(isChange);
      if (isFirstMount.current) {
        // enable transition after first paint
        requestAnimationFrame(() => setReady(true));
        isFirstMount.current = false;
      }
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, items]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const el = tabRefs.current[active];
      if (!el || !container) return;
      const cRect = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setBubble({ left: r.left - cRect.left, width: r.width, scale: 1 });
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    // observe each tab for width changes
    items.forEach((it) => {
      const el = tabRefs.current[it.id];
      if (el) ro.observe(el);
    });
    window.addEventListener("resize", handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", handleResize);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [active, items]);

  return (
    <div ref={containerRef} className={["segment", className].filter(Boolean).join(" ")} style={style}>
      {/* single physical bubble */}
      <div
        className="segment-bubble"
        aria-hidden="true"
        style={{
          transform: `translateX(${bubble.left}px) scaleX(${bubble.scale})`,
          width: bubble.width,
          transition: ready ? undefined : "none",
        }}
      />
      {items.map((item) => (
        <button
          key={item.id}
          ref={(el) => {
            tabRefs.current[item.id] = el;
          }}
          className={active === item.id ? "active" : ""}
          onClick={() => onChange(item.id)}
          aria-selected={active === item.id}
          role="tab"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
