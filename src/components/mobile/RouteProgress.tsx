"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  if (!loading) return null;
  return (
    <div
      className="route-progress"
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99 }}
      role="progressbar"
      aria-label="Loading"
    />
  );
}
