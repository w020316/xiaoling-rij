"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import {
  CheckSquare, Droplets, Dumbbell, Smile,
  Calendar, Sparkles, Heart, CloudSun
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const dailyQuotes = [
  "心存温柔，山河浪漫。",
  "每一天都值得被温柔以待。",
  "你笑起来真好看，像春天的花一样。",
  "生活明朗，万物可爱。",
  "慢慢来，比较快。",
  "愿你的每一天都闪闪发光。",
  "今天也要好好爱自己呀。",
  "世界很大，幸福很小。",
];

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dailyQuotes[dayOfYear % dailyQuotes.length];
}

export default function Home() {
  const { theme, setTheme } = useTheme();
  const today = new Date();
  const coupleStart = new Date("2025-05-12");
  const coupleDays = differenceInDays(today, coupleStart);
  const quote = getDailyQuote();

  const themes = [
    { key: "theme-kuromi" as const, label: "库洛米", color: "bg-purple-900", emoji: "💜" },
    { key: "theme-melody" as const, label: "美乐蒂", color: "bg-pink-300", emoji: "🎀" },
    { key: "theme-cinnamoroll" as const, label: "玉桂狗", color: "bg-blue-200", emoji: "☁️" },
    { key: "theme-dark" as const, label: "暗黑", color: "bg-gray-800", emoji: "🌙" },
  ];

  return (
    <main className="min-h-screen p-5 flex flex-col gap-5 pb-28">
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl float-animation">
            🐱
          </div>
          <div>
            <h1 className="text-lg font-bold">小林</h1>
            <p className="text-xs text-muted-foreground">连续打卡 11 天 🔥</p>
          </div>
        </div>
        <div className="glass-card px-3 py-1.5 flex items-center gap-1.5 text-sm">
          <CloudSun size={16} className="text-primary" />
          <span>26°C 晴</span>
        </div>
      </header>

      <div className="glass-card p-4 text-center relative overflow-hidden">
        <div className="absolute top-2 right-3 text-primary/40 text-2xl emoji-bounce">💖</div>
        <p className="text-sm text-muted-foreground mb-1">在一起</p>
        <h2 className="text-4xl font-bold text-primary flex items-end justify-center gap-1">
          第 <span className="text-5xl">{coupleDays}</span> 天
        </h2>
        <p className="text-xs text-muted-foreground mt-2">
          {format(coupleStart, "yyyy年MM月dd日")} 至今
        </p>
      </div>

      <div className="glass-card p-4 text-center">
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          &ldquo; {quote} &rdquo;
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/todo" className="glass-card p-4 flex flex-col items-center gap-2">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
            <CheckSquare size={22} />
          </div>
          <span className="font-medium text-sm">今日待办</span>
          <span className="text-xs text-muted-foreground">3 项待完成</span>
        </Link>

        <Link href="/diary" className="glass-card p-4 flex flex-col items-center gap-2">
          <div className="p-2.5 bg-pink-500/10 text-pink-500 rounded-xl">
            <Heart size={22} />
          </div>
          <span className="font-medium text-sm">今日日记</span>
          <span className="text-xs text-muted-foreground">记录心情</span>
        </Link>

        <Link href="/calorie" className="glass-card p-4 flex flex-col items-center gap-2">
          <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
            <Droplets size={22} />
          </div>
          <span className="font-medium text-sm">喝水提醒</span>
          <span className="text-xs text-muted-foreground">4/8 杯</span>
        </Link>

        <Link href="/health" className="glass-card p-4 flex flex-col items-center gap-2">
          <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
            <Dumbbell size={22} />
          </div>
          <span className="font-medium text-sm">运动提醒</span>
          <span className="text-xs text-muted-foreground">今日 30 分钟</span>
        </Link>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Smile size={16} className="text-primary" /> 今日心情
          </h3>
        </div>
        <div className="flex justify-around">
          {["😊", "😌", "🥰", "😢", "😤"].map((emoji, i) => (
            <button
              key={i}
              className="text-2xl hover:scale-125 transition-transform active:scale-95 p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> 今日课程
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground text-xs w-20">08:30-10:10</span>
            <span className="glass-card px-3 py-1 text-xs">高等数学</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground text-xs w-20">14:00-15:40</span>
            <span className="glass-card px-3 py-1 text-xs">大学英语</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary" /> 主题切换
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={`flex-shrink-0 w-18 h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all ${
                theme === t.key
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-transparent bg-muted/50"
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-sm`}>
                {t.emoji}
              </div>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
