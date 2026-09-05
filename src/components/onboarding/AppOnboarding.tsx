"use client";
import { useEffect, useState } from "react";
import { useOnboarding } from "./OnboardingContext";
import { WelcomeModal } from "./WelcomeModal";
import { OnboardingTour } from "./Tour";
import { NAV_TOUR } from "./data";
import { usePathname } from "next/navigation";

export function AppOnboarding() {
  const { state, loaded, isCompleted, markCompleted } = useOnboarding();
  const pathname = usePathname();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showNav, setShowNav] = useState(false);

  // Welcome: show once on first load if not completed and tips enabled (skip /login)
  useEffect(() => {
    if (!loaded) return;
    if (!state.tipsEnabled) return;
    if (pathname.startsWith("/login")) return;
    if (!isCompleted("welcome")) {
      const t = setTimeout(() => setShowWelcome(true), 600);
      return () => clearTimeout(t);
    }
  }, [loaded, state.tipsEnabled, isCompleted, pathname]);

  // After welcome completed, show nav tour once (only on dashboard or any page)
  useEffect(() => {
    if (!loaded) return;
    if (!state.tipsEnabled) return;
    if (isCompleted("welcome") && !isCompleted("nav") && !showWelcome) {
      // only show nav tour on first visit to dashboard or pos
      const isRelevant = pathname === "/dashboard" || pathname === "/pos" || pathname === "/";
      if (!isRelevant) return;
      const t = setTimeout(() => setShowNav(true), 800);
      return () => clearTimeout(t);
    }
  }, [loaded, state.tipsEnabled, isCompleted, showWelcome, pathname]);

  if (!loaded || !state.tipsEnabled) return null;

  if (showWelcome) {
    return (
      <WelcomeModal
        onSkip={() => {
          markCompleted("welcome");
          setShowWelcome(false);
        }}
        onFinish={() => {
          markCompleted("welcome");
          setShowWelcome(false);
          // trigger nav tour next
          setTimeout(() => {
            if (!isCompleted("nav")) setShowNav(true);
          }, 400);
        }}
      />
    );
  }

  if (showNav) {
    return (
      <OnboardingTour
        tour={NAV_TOUR}
        onComplete={() => {
          markCompleted("nav");
          setShowNav(false);
        }}
        onSkip={() => {
          markCompleted("nav");
          setShowNav(false);
        }}
      />
    );
  }

  return null;
}
