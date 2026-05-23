import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#a855f7",
};

export const metadata: Metadata = {
  title: "恋爱日常 | Love Daily AI",
  description: "治愈系 AI 日常管理应用 - 管理学习与生活，记录情绪和成长",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "恋爱日常",
  },
  openGraph: {
    title: "恋爱日常 | Love Daily AI",
    description: "治愈系 AI 日常管理应用",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={`${inter.className} min-h-screen max-w-md mx-auto relative shadow-2xl overflow-x-hidden`}>
        <ThemeProvider>
          {children}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
