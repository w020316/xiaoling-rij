"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  Palette, Heart, Bell, Shield, HelpCircle,
  ChevronRight, Settings
} from "lucide-react";
import Link from "next/link";

interface UserStats {
  diaryCount: number;
  photoCount: number;
  checkInDays: number;
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetch("/api/user/stats").then((r) => r.json()).then(setStats);
  }, []);

  const themes = [
    { key: "theme-kuromi" as const, label: "库洛米", emoji: "💜", color: "bg-purple-900" },
    { key: "theme-melody" as const, label: "美乐蒂", emoji: "🎀", color: "bg-pink-300" },
    { key: "theme-cinnamoroll" as const, label: "玉桂狗", emoji: "☁️", color: "bg-blue-200" },
    { key: "theme-dark" as const, label: "暗黑", emoji: "🌙", color: "bg-gray-800" },
  ];

  const menuItems = [
    { icon: Heart, label: "情侣空间", href: "/couple", color: "text-pink-500" },
    { icon: Settings, label: "管理后台", href: "/admin", color: "text-gray-500" },
    { icon: Bell, label: "提醒设置", href: "#notifications", color: "text-blue-500" },
    { icon: Shield, label: "隐私设置", href: "#privacy", color: "text-green-500" },
    { icon: HelpCircle, label: "帮助与反馈", href: "#help", color: "text-orange-500" },
  ];

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex flex-col items-center pt-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-4xl mb-3 float-animation">
          🐱
        </div>
        <h1 className="text-xl font-bold">小林</h1>
        <p className="text-sm text-muted-foreground">连续打卡 {stats?.checkInDays || 0} 天 🔥</p>
      </header>

      <div className="glass-card p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{stats?.diaryCount || 0}</p>
            <p className="text-xs text-muted-foreground">日记</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{stats?.photoCount || 0}</p>
            <p className="text-xs text-muted-foreground">照片</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{stats?.checkInDays || 0}</p>
            <p className="text-xs text-muted-foreground">打卡</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 mb-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Palette size={16} className="text-primary" /> 主题切换
        </h3>
        <div className="flex gap-3">
          {themes.map((t) => (
            <button key={t.key} onClick={() => setTheme(t.key)}
              className={`flex-1 h-16 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${theme === t.key ? "border-primary bg-primary/10" : "border-transparent bg-muted/50"}`}>
              <span className="text-lg">{t.emoji}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href} className="glass-card p-4 flex items-center gap-3">
            <item.icon size={20} className={item.color} />
            <span className="flex-1 font-medium text-sm">{item.label}</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">恋爱日常 v1.1.0</p>
        <p className="text-xs text-muted-foreground mt-1">Made with 💕</p>
      </div>
    </main>
  );
}
