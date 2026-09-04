"use client";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Check for updates periodically
        setInterval(() => reg.update(), 60 * 60 * 1000);

        // Listen for new SW waiting
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content available, prompt to reload
                console.log("[PWA] New content available - please refresh");
                // Dispatch custom event for InstallPrompt to show update button
                window.dispatchEvent(new CustomEvent("pwa:update-available"));
              }
            });
          }
        });

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // Could auto-reload once
        });

        console.log("[PWA] Service Worker registered", reg.scope);
      } catch (err) {
        console.warn("[PWA] SW registration failed", err);
      }
    };

    // Register after page load
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);

    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const updateHandler = () => setHasUpdate(true);
    window.addEventListener("pwa:update-available", updateHandler);

    // Check if dismissed recently (localStorage)
    try {
      const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
      if (dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    } catch {}

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("pwa:update-available", updateHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] Install outcome:", outcome);
    setDeferredPrompt(null);
    if (outcome === "dismissed") {
      try {
        localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
      } catch {}
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setHasUpdate(false);
    if (deferredPrompt) {
      try {
        localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
      } catch {}
    }
  };

  const handleUpdate = () => {
    // Tell SW to skip waiting and reload
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });
    }
    window.location.reload();
  };

  // Don't show if already installed as standalone (except update)
  if (isStandalone && !hasUpdate) return null;

  // Update available banner (highest priority)
  if (hasUpdate) {
    return (
      <div style={{ position: "fixed", bottom: "calc(12px + env(safe-area-inset-bottom))", left: 12, right: 12, zIndex: 45 }}>
        <div className="card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", background: "#1F2933", color: "#fff", border: "none" }}>
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>Update tersedia</div>
            <div style={{ opacity: 0.8, fontSize: 12 }}>Versi baru DIKOPI siap digunakan</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDismiss} className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.3)", minHeight: 36, padding: "6px 12px", fontSize: 13 }}>
              Nanti
            </button>
            <button onClick={handleUpdate} className="btn" style={{ background: "#A66A3F", color: "#fff", borderColor: "#A66A3F", minHeight: 36, padding: "6px 14px", fontSize: 13 }}>
              Update
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS install hint (no beforeinstallprompt on iOS)
  if (isIOS && !isStandalone && !isDismissed) {
    return (
      <div style={{ position: "fixed", bottom: "calc(72px + env(safe-area-inset-bottom))", left: 12, right: 12, zIndex: 44 }}>
        <div className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ fontSize: 22, lineHeight: 1 }}>📲</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Install DIKOPI di iPhone</div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: "16px" }}>
              Tap <span style={{ fontWeight: 700, color: "var(--text)" }}>Bagikan</span> <span style={{ fontSize: 12 }}>⎙</span> lalu pilih <span style={{ fontWeight: 700, color: "var(--text)" }}>Tambah ke Layar Utama</span>
            </div>
          </div>
          <button onClick={handleDismiss} style={{ border: 0, background: "transparent", fontSize: 18, lineHeight: 1, padding: 4, color: "var(--muted)" }}>
            ×
          </button>
        </div>
      </div>
    );
  }

  // Android/desktop install prompt
  if (!deferredPrompt || isDismissed) return null;

  return (
    <div style={{ position: "fixed", bottom: "calc(72px + env(safe-area-inset-bottom))", left: 12, right: 12, zIndex: 44 }}>
      <div className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#1F2933", display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
          D<span style={{ color: "#A66A3F" }}>K</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Install DIKOPI</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Akses lebih cepat & bisa offline</div>
        </div>
        <button onClick={handleDismiss} style={{ border: 0, background: "transparent", fontSize: 18, padding: 4, color: "var(--muted)" }}>
          ×
        </button>
        <button onClick={handleInstall} className="btn accent" style={{ minHeight: 36, padding: "8px 14px", fontSize: 13, whiteSpace: "nowrap" }}>
          Install
        </button>
      </div>
    </div>
  );
}

export default function PWA() {
  return (
    <>
      <ServiceWorkerRegister />
      <PWAInstallPrompt />
    </>
  );
}
