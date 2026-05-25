import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { StaticInit } from "@/components/StaticInit";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#a855f7",
};

export const metadata: Metadata = {
  title: {
    default: "恋爱日常 | Love Daily AI",
    template: "%s | 恋爱日常",
  },
  description: "治愈系 AI 日常管理应用 - 管理学习与生活，记录情绪和成长，AI 驱动的智能伴侣体验",
  keywords: ["恋爱", "日常管理", "AI助手", "日记", "待办", "情侣", "健康管理"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "恋爱日常",
  },
  openGraph: {
    title: "恋爱日常 | Love Daily AI",
    description: "治愈系 AI 日常管理应用 - 记录每一天的甜蜜与成长",
    type: "website",
    locale: "zh_CN",
    siteName: "恋爱日常",
  },
  twitter: {
    card: "summary_large_image",
    title: "恋爱日常 | Love Daily AI",
    description: "治愈系 AI 日常管理应用",
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
        <link rel="preconnect" href="https://wttr.in" />
        <link rel="preconnect" href="https://api.deepseek.com" />
      </head>
      <body className={`${inter.className} min-h-screen relative overflow-x-hidden`}>
        <StaticInit />
        <ThemeProvider>
          <ResponsiveLayout>
            {children}
          </ResponsiveLayout>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
