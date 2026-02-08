import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppMenuSheet } from "@/components/AppMenuSheet";
import { CommandPalette } from "@/components/CommandPalette";
import { Toaster } from "sonner";
import { ShortcutManager } from "@/components/ShortcutManager";
import { PWARegister } from "@/components/PWARegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus - Second Brain",
  description: "개인 지식 관리 앱 - 노트, 위키링크, 그래프 뷰",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexus",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWARegister />
        <Providers>
          <CommandPalette />
          <ShortcutManager />
          <Toaster position="top-right" richColors />
          <div className="min-h-screen flex flex-col">
            <div className="fixed right-4 top-4 z-50">
              <AppMenuSheet />
            </div>
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
