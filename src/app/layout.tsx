import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DIKOPI POS - Financial Monitoring",
  description: "Dikopi POS & Financial Monitoring System",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className + " antialiased bg-zinc-50"}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
