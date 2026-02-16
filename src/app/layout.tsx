import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NCC Royal Global University",
  description: "Official Cadet Management System for NCC RGU Unit",
  icons: {
    icon: "/ncc-logo.png",
  },
};

import { Providers } from "@/components/providers";

import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-background text-primary`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
