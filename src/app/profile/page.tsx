"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  Palette, Heart, Bell, Shield, HelpCircle,
  ChevronRight, Settings, Calendar, BarChart3,
  Moon, User
} from "lucide-react";
import Link from "next/link";

interface UserStats {
  diaryCount: number;
  photoCount: number;
  checkInDays: number;
  todoCount: number;
  pendingTodoCount: number;
}

interface UserData {
  nickname: string;
  avatar?: string;
}

function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [nickname, setNickname] = useState("小林");
  const [avatar, setAvatar] = useState("🐱");
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    const storedAvatar = localStorage.getItem("user-avatar");
    if (storedAvatar) setAvatar(storedAvatar);

    fetch("/api/user")
      .then((r) => r.json())
      .then((data: UserData) => {
        if (data.nickname) setNickname(data.nickname);
        if (data.avatar) {
          setAvatar(data.avatar);
          localStorage.setItem("user-avatar", data.avatar);
        }
      })
      .catch(() => {});

    fetch("/api/user/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const themes = [
    { key: "theme-kuromi" as const, label: "库洛米", emoji: "💜", color: "bg-purple-900" },
    { key: "theme-melody" as const, label: "美乐蒂", emoji: "🎀", color: "bg-pink-300" },
    { key: "theme-cinnamoroll" as const, label: "玉桂狗", emoji: "☁️", color: "bg-blue-200" },
    { key: "theme-dark" as const, label: "暗黑", emoji: "🌙", color: "bg-gray-800" },
  ];

  const menuItems = [
    { emoji: "📅", label: "课程表", href: "/schedule", color: "text-blue-500" },
    { emoji: "📊", label: "成长报告", href: "/ai/weekly", color: "text-green-500" },
    { emoji: "🌙", label: "晚安总结", href: "/ai/goodnight", color: "text-purple-500" },
    { emoji: "🔔", label: "提醒设置", href: "/settings#notifications", color: "text-yellow-500" },
    { emoji: "💕", label: "情侣空间", href: "/couple", color: "text-pink-500" },
    { emoji: "🛡️", label: "隐私设置", href: "/settings", color: "text-green-600" },
    { emoji: "❓", label: "帮助与反馈", href: "#", color: "text-orange-500" },
    { emoji: "⚙️", label: "管理后台", href: "/admin", color: "text-gray-500" },
  ];

  const statItems = [
    { label: "日记", value: stats?.diaryCount || 0, emoji: "📝" },
    { label: "照片", value: stats?.photoCount || 0, emoji: "📸" },
    { label: "打卡", value: stats?.checkInDays || 0, emoji: "🔥" },
    { label: "待办完成", value: (stats?.todoCount || 0) - (stats?.pendingTodoCount || 0), emoji: "✅" },
  ];

  async function handleCheckIn() {
    try {
      const res = await fetch("/api/checkin", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCheckedIn(true);
        setStats((prev) => prev ? { ...prev, checkInDays: prev.checkInDays + 1 } : prev);
      }
    } catch {}
  }

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex flex-col items-center pt-4 mb-6 fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-4xl mb-3 float-animation">
          {avatar}
        </div>
        <h1 className="text-xl font-bold">{nickname}</h1>
        <p className="text-sm text-muted-foreground">
          连续打卡 {stats?.checkInDays || 0} 天 🔥
        </p>
        <Link
          href="/settings"
          className="glass-badge bg-primary/15 text-primary mt-2 flex items-center gap-1"
        >
          <User size={10} /> 编辑资料
        </Link>
      </header>

      <div className="glass-card p-4 mb-4 slide-up">
        <div className="grid grid-cols-4 gap-3 text-center">
          {statItems.map((item) => (
            <div key={item.label}>
              <p className="text-2xl font-bold text-primary">
                <AnimatedCounter target={item.value} />
              </p>
              <p className="text-[10px] text-muted-foreground">
                {item.emoji} {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 mb-4 slide-up relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-lg">
              🔥
            </div>
            <div>
              <p className="text-sm font-bold">今日打卡</p>
              <p className="text-[10px] text-muted-foreground">
                {checkedIn ? "已打卡，继续加油！" : "坚持每一天，记录美好～"}
              </p>
            </div>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={checkedIn}
            className={`glass-button px-4 py-2 text-xs ${
              checkedIn ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {checkedIn ? "已打卡 ✅" : "打卡"}
          </button>
        </div>
      </div>

      <div className="glass-card p-4 mb-4 slide-up">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Palette size={16} className="text-primary" /> 主题切换
        </h3>
        <div className="flex gap-3">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={`flex-1 h-16 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                theme === t.key
                  ? "border-primary bg-primary/10"
                  : "border-transparent bg-muted/50"
              }`}
            >
              <span className="text-lg">{t.emoji}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 slide-up">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="glass-card p-4 flex items-center gap-3"
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="flex-1 font-medium text-sm">{item.label}</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center fade-in">
        <p className="text-xs text-muted-foreground">恋爱日常 v2.1.0</p>
        <p className="text-xs text-muted-foreground mt-1">Made with 💕</p>
      </div>
    </main>
  );
}
