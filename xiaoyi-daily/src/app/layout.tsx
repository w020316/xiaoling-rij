import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "恋爱日常 | Love Daily AI",
  description: "治愈系 AI 日常管理应用 - 管理学习与生活，记录情绪和成长",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen max-w-md mx-auto relative shadow-2xl overflow-x-hidden`}>
        <ThemeProvider>
          {children}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
