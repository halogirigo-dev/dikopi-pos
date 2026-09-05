"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { DEFAULT_STATE, OnboardingState, TourId } from "./types";

const STORAGE_KEY = "dikopi_onboarding_v1";

type Ctx = {
  state: OnboardingState;
  loaded: boolean;
  isCompleted: (id: TourId) => boolean;
  markCompleted: (id: TourId) => void;
  resetAll: () => void;
  resetTour: (id: TourId) => void;
  setTipsEnabled: (v: boolean) => void;
  restartTour: (id: TourId) => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

function loadState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(s: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveState(state);
  }, [state, loaded]);

  const isCompleted = useCallback((id: TourId) => !!state[id], [state]);
  const markCompleted = useCallback((id: TourId) => {
    setState((s) => ({ ...s, [id]: true }));
  }, []);
  const resetTour = useCallback((id: TourId) => {
    setState((s) => ({ ...s, [id]: false }));
  }, []);
  const resetAll = useCallback(() => {
    setState({ ...DEFAULT_STATE });
    // also clear storage
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    // set back to default with tipsEnabled true
    setState({ ...DEFAULT_STATE });
  }, []);
  const restartTour = useCallback((id: TourId) => {
    setState((s) => ({ ...s, [id]: false }));
    // small delay to allow component to re-trigger
    setTimeout(() => {
      // trigger re-render by toggling
    }, 50);
  }, []);
  const setTipsEnabled = useCallback((v: boolean) => {
    setState((s) => ({ ...s, tipsEnabled: v }));
  }, []);

  return (
    <OnboardingContext.Provider value={{ state, loaded, isCompleted, markCompleted, resetAll, resetTour, setTipsEnabled, restartTour }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
