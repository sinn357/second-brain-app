import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { FloatingNav } from "@/components/FloatingNav";
import { CommandPalette } from "@/components/CommandPalette";
import { Toaster } from "sonner";
import { ShortcutManager } from "@/components/ShortcutManager";

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
        <Providers>
          <FloatingNav />
          <CommandPalette />
          <ShortcutManager />
          <Toaster position="top-right" richColors />
          {children}
        </Providers>
      </body>
    </html>
  );
}
