"use client";
import { useEffect, useState } from "react";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingTour } from "./Tour";
import { TourDef } from "./types";

export function FeatureTourClient({ tour }: { tour: TourDef }) {
  const { state, isCompleted, markCompleted } = useOnboarding();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!state.tipsEnabled || !state.welcome) return;
    if (isCompleted(tour.id)) return;
    const t = setTimeout(() => {
      // ensure targets exist
      const el = document.querySelector(tour.steps[0].target);
      if (el) setShow(true);
      else {
        // retry
        setTimeout(() => {
          if (document.querySelector(tour.steps[0].target)) setShow(true);
        }, 400);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [state.tipsEnabled, state.welcome, isCompleted, tour]);
  if (!show) return null;
  return <OnboardingTour tour={tour} onComplete={()=>{ markCompleted(tour.id); setShow(false); }} onSkip={()=>{ markCompleted(tour.id); setShow(false); }} />;
}
