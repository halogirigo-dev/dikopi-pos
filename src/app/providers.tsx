"use client";
import { SessionProvider } from "next-auth/react";
import { OnboardingProvider } from "@/components/onboarding/OnboardingContext";
import { AppOnboarding } from "@/components/onboarding/AppOnboarding";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OnboardingProvider>
        {children}
        <AppOnboarding />
      </OnboardingProvider>
    </SessionProvider>
  );
}
