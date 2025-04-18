"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SonnerProvider } from "@/components/sonner-provider";
import Navbar from "@/components/navbar";
import SplashScreen from "@/components/splash-screen";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en">
      <body className={`${inter.className} relative`}>
        {/* <SplashScreen isVisible={showSplash} /> */}

        {!showSplash && (
          <>
            <Navbar />
            <main className="min-h-screen bg-white">{children}</main>
            <SonnerProvider />
          </>
        )}
      </body>
    </html>
  );
}
