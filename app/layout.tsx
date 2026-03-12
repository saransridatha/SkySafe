import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import { CrtOverlay } from "@/components/CrtOverlay";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "SkySafe – Flight Risk Intelligence",
  description:
    "Comprehensive flight risk assessment. Aircraft safety, airline reliability, route analysis, live threat intelligence, and AI-powered scoring.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#030509" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <CrtOverlay />
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
