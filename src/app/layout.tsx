import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import PWA from "@/components/PWA";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "DIKOPI POS - Financial Monitoring",
    template: "%s | DIKOPI",
  },
  description: "DIKOPI POS & Financial Monitoring System - Kasir dan monitoring keuangan, optimal untuk mobile",
  manifest: "/manifest.json",
  applicationName: "DIKOPI POS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DIKOPI POS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "DIKOPI POS",
    description: "POS & Financial Monitoring - cepat, ringan, bisa di-install di HP",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1F2933",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className + " antialiased bg-zinc-50"}>
        <Providers>{children}</Providers>
        <PWA />
      </body>
    </html>
  );
}
