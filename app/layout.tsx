import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import "../styles/globals.css";
import "../styles/navbar.css";
import "../styles/search-bar.css";
import "../styles/components.css";
import "../styles/dashboard.css";
import "../styles/landing.css";
import "../styles/explore.css";

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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0b0f19" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
