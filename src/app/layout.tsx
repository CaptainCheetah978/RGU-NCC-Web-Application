import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "NCC Royal Global University",
  description: "Official Cadet Management System for NCC RGU Unit",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

import { Providers } from "@/components/providers";
import { PWARegistration } from "@/components/pwa-registration";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-background text-primary overflow-x-hidden`}>
        <Providers>{children}</Providers>
        <PWARegistration />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
