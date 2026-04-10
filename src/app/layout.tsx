import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "NCC CMS - Developed by SUO Aditya Singh",
  description: "A role-based Cadet Management System for the National Cadet Corps, developed by SUO Aditya Singh (https://github.com/CaptainCheetah978).",
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
import { Watermark } from "@/components/watermark";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-background text-primary overflow-x-hidden">
        <Providers>{children}</Providers>
        <PWARegistration />
        <Analytics />
        <SpeedInsights />
        <Watermark />
      </body>
    </html>
  );
}
