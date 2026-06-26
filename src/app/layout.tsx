import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { StaticInit } from "@/components/StaticInit";
import MusicPlayer from "@/components/MusicPlayer";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#a855f7",
};

export const metadata: Metadata = {
  title: {
    default: "小林日记 | XiaoLin Diary",
    template: "%s | 小林日记",
  },
  description: "小林日记是一款治愈系日常记录应用，支持待办、日记、相册、情侣空间、健康管理与 AI 陪伴。",
  keywords: ["小林日记", "日常管理", "AI助手", "日记", "待办", "情侣", "健康管理"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "小林日记",
  },
  openGraph: {
    title: "小林日记 | XiaoLin Diary",
    description: "治愈系日常记录应用，记录每一天的甜蜜、成长与生活片段。",
    type: "website",
    locale: "zh_CN",
    siteName: "小林日记",
  },
  twitter: {
    card: "summary_large_image",
    title: "小林日记 | XiaoLin Diary",
    description: "治愈系日常记录应用",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 内联阻塞脚本：在 React hydrate 前从 localStorage 读取主题并写入 <html> className，
  // 彻底消除首屏 FOUC（Flash of Unstyled Content）闪烁。
  const themeInitScript = `(function(){try{var t=localStorage.getItem('xiaolin-diary-theme')||'theme-kuromi';document.documentElement.className=t;}catch(e){document.documentElement.className='theme-kuromi';}})();`;

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://wttr.in" />
        <link rel="preconnect" href="https://api.deepseek.com" />
        <link rel="preconnect" href="https://geocoding-api.open-meteo.com" />
        <link rel="preconnect" href="https://api.open-meteo.com" />
      </head>
      <body className={`${inter.className} min-h-screen relative overflow-x-hidden`}>
        <StaticInit />
        <ThemeProvider>
          <ResponsiveLayout>
            {children}
          </ResponsiveLayout>
          <MusicPlayer />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
