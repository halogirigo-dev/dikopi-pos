"use client";
import { useEffect, useState, useCallback } from "react";
import { Spotlight } from "./Spotlight";
import { OnboardingTooltip } from "./Tooltip";
import { TourDef } from "./types";

export function OnboardingTour({
  tour,
  onComplete,
  onSkip,
}: {
  tour: TourDef;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const step = tour.steps[idx];

  const handleNext = useCallback(() => {
    if (idx >= tour.steps.length - 1) {
      onComplete();
    } else {
      setIdx((i) => i + 1);
    }
  }, [idx, tour.steps.length, onComplete]);

  const handlePrev = useCallback(() => {
    setIdx((i) => Math.max(0, i - 1));
  }, []);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  // keyboard a11y
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleSkip();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft" && idx > 0) handlePrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev, handleSkip, idx]);

  // lock scroll when center modal? keep scroll but overlay blocks
  return (
    <>
      {!step.center && <Spotlight target={step.target} onClose={handleSkip} />}
      {step.center && <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:45 }} onClick={handleSkip} />}
      <OnboardingTooltip
        key={step.id}
        target={step.target}
        title={step.title}
        description={step.description}
        icon={step.icon}
        step={idx + 1}
        total={tour.steps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        isFirst={idx === 0}
        isLast={idx === tour.steps.length - 1}
        center={!!step.center}
      />
    </>
  );
}
