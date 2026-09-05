"use client";
import { useEffect, useState } from "react";
import { useOnboarding } from "./OnboardingContext";
import { TourId } from "./types";
import { usePathname } from "next/navigation";

export function useFeatureTour(tourId: TourId, opts?: { delay?: number; skipIfCompleted?: boolean; extraCheck?: () => boolean }) {
  const { state, loaded, isCompleted, markCompleted } = useOnboarding();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    if (!state.tipsEnabled) return;
    if (opts?.skipIfCompleted !== false && isCompleted(tourId)) return;
    if (opts?.extraCheck && !opts.extraCheck()) return;
    // only show if target elements exist
    const t = setTimeout(() => {
      // check if any target exists in DOM
      const hasTarget = !!document.querySelector(`[data-onboarding]`);
      if (hasTarget) setShow(true);
      else {
        // retry once
        setTimeout(() => {
          if (document.querySelector(`[data-onboarding]`)) setShow(true);
        }, 500);
      }
    }, opts?.delay ?? 800);
    return () => clearTimeout(t);
  }, [loaded, state.tipsEnabled, isCompleted, tourId, opts]);

  const complete = () => {
    markCompleted(tourId);
    setShow(false);
  };
  const skip = () => {
    markCompleted(tourId);
    setShow(false);
  };

  return { show, complete, skip, setShow };
}
