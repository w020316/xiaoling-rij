"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import {
  CheckSquare, Droplets, Dumbbell, Smile,
  Calendar, Sparkles, Heart, CloudSun, Brain,
  TrendingUp, Plus, Minus
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface UserStats {
  diaryCount: number;
  photoCount: number;
  checkInDays: number;
  todoCount: number;
  pendingTodoCount: number;
}

interface CoupleData {
  id: string;
  startDate: string;
  inviteCode: string;
}

interface WeatherData {
  temp: string;
  desc: string;
  emoji: string;
  humidity: string;
  feelsLike: string;
}

interface ScheduleItem {
  id: string;
  timeStart: string;
  timeEnd: string;
  title: string;
  dayOfWeek: number;
}

function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function getWaterKey(): string {
  return `water-cups-${format(new Date(), "yyyy-MM-dd")}`;
}

function getWaterCups(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(getWaterKey());
  return stored ? parseInt(stored, 10) : 0;
}

function setWaterCups(count: number) {
  localStorage.setItem(getWaterKey(), String(count));
}

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [couple, setCouple] = useState<CoupleData | null>(null);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [waterCups, setWaterCupsState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [quote, setQuote] = useState("");
  const [exerciseMinutes, setExerciseMinutes] = useState(0);

  useEffect(() => {
    setWaterCupsState(getWaterCups());
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/stats").then((r) => r.json()),
      fetch("/api/couple").then((r) => r.json()),
      fetch("/api/emotion").then((r) => r.json()),
      fetch("/api/weather").then((r) => r.json()),
      fetch("/api/schedule").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/quote").then((r) => r.json()),
    ]).then(([statsData, coupleData, emotionData, weatherData, scheduleData, userData, quoteData]) => {
      setStats(statsData);
      setCouple(coupleData);
      if (emotionData) setTodayMood(emotionData.mood);
      setWeather(weatherData);
      const today = getTodayDayOfWeek();
      const todaySchedules = Array.isArray(scheduleData)
        ? scheduleData.filter((s: ScheduleItem) => s.dayOfWeek === today)
        : [];
      todaySchedules.sort((a: ScheduleItem, b: ScheduleItem) =>
        a.timeStart.localeCompare(b.timeStart)
      );
      setSchedules(todaySchedules);
      if (userData?.nickname) setNickname(userData.nickname);
      if (quoteData?.content) setQuote(quoteData.content);
      try {
        const saved = localStorage.getItem("exercise-records");
        if (saved) {
          const records = JSON.parse(saved);
          const todayStr = new Date().toISOString().slice(0, 10);
          const todayRecords = records.filter((r: any) => r.date === todayStr);
          setExerciseMinutes(todayRecords.reduce((s: number, r: any) => s + r.duration, 0));
        }
      } catch {}
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const addWater = useCallback(() => {
    const next = Math.min(waterCups + 1, 8);
    setWaterCupsState(next);
    setWaterCups(next);
  }, [waterCups]);

  const removeWater = useCallback(() => {
    const next = Math.max(waterCups - 1, 0);
    setWaterCupsState(next);
    setWaterCups(next);
  }, [waterCups]);

  async function handleCheckIn() {
    const res = await fetch("/api/checkin", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setCheckedIn(true);
      setStats((prev) => prev ? { ...prev, checkInDays: data.checkInDays } : prev);
    }
  }

  async function handleMoodSelect(mood: string, score: number) {
    setTodayMood(mood);
    await fetch("/api/emotion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, score }),
    });
  }

  const coupleDays = couple
    ? differenceInDays(new Date(), new Date(couple.startDate))
    : 0;

  const themes = [
    { key: "theme-kuromi" as const, label: "库洛米", color: "bg-purple-900", emoji: "💜" },
    { key: "theme-melody" as const, label: "美乐蒂", color: "bg-pink-300", emoji: "🎀" },
    { key: "theme-cinnamoroll" as const, label: "玉桂狗", color: "bg-blue-200", emoji: "☁️" },
    { key: "theme-dark" as const, label: "暗黑", color: "bg-gray-800", emoji: "🌙" },
  ];

  const moods = [
    { emoji: "😊", label: "开心", score: 9 },
    { emoji: "😌", label: "平静", score: 7 },
    { emoji: "🥰", label: "甜蜜", score: 10 },
    { emoji: "😢", label: "难过", score: 3 },
    { emoji: "😤", label: "生气", score: 2 },
  ];

  const todoProgress = stats
    ? stats.todoCount > 0
      ? Math.round(((stats.todoCount - stats.pendingTodoCount) / stats.todoCount) * 100)
      : 0
    : 0;

  if (loading) {
    return (
      <main className="min-h-screen p-5 flex flex-col gap-5 pb-28">
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full skeleton" />
            <div className="flex flex-col gap-2">
              <div className="w-16 h-4 skeleton" />
              <div className="w-28 h-3 skeleton" />
            </div>
          </div>
          <div className="w-20 h-8 skeleton rounded-full" />
        </header>
        <div className="glass-card p-6 skeleton h-28" />
        <div className="glass-card p-4 skeleton h-16" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 skeleton h-28" />
          ))}
        </div>
        <div className="glass-card p-4 skeleton h-24" />
        <div className="glass-card p-4 skeleton h-24" />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5 flex flex-col gap-5 pb-28">
      <header className="flex items-center justify-between pt-2 fade-in">
        <div className="flex items-center gap-3">
          <button onClick={handleCheckIn} className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl float-animation">
            🐱
          </button>
          <div>
            <h1 className="text-lg font-bold">{nickname || "小林"}</h1>
            <p className="text-xs text-muted-foreground">
              连续打卡 {stats?.checkInDays || 0} 天 🔥
              {checkedIn && <span className="text-primary ml-1">✓今日已打卡</span>}
            </p>
          </div>
        </div>
        <div className="glass-card px-3 py-1.5 flex items-center gap-1.5 text-sm">
          <CloudSun size={16} className="text-primary" />
          <span>{weather?.emoji} {weather?.temp}°C</span>
        </div>
      </header>

      <div className="glass-card p-4 text-center relative overflow-hidden fade-in">
        <div className="absolute top-2 right-3 text-primary/40 text-2xl emoji-bounce">💖</div>
        <p className="text-sm text-muted-foreground mb-1">在一起</p>
        <h2 className="text-4xl font-bold text-primary flex items-end justify-center gap-1">
          第 <span className="text-5xl">{coupleDays}</span> 天
        </h2>
        {couple && (
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(couple.startDate), "yyyy年MM月dd日")} 至今
          </p>
        )}
      </div>

      <div className="glass-card p-4 text-center fade-in">
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          &ldquo; {quote} &rdquo;
        </p>
      </div>

      {stats && stats.todoCount > 0 && (
        <div className="glass-card p-4 fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> 今日进度
            </h3>
            <span className="text-xs text-muted-foreground">
              {stats.todoCount - stats.pendingTodoCount}/{stats.todoCount} 已完成
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
              style={{ width: `${todoProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-right">{todoProgress}%</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/todo" className="glass-card p-4 flex flex-col items-center gap-2 slide-up stagger-1">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
            <CheckSquare size={22} />
          </div>
          <span className="font-medium text-sm">今日待办</span>
          <span className="text-xs text-muted-foreground">
            {stats?.pendingTodoCount || 0} 项待完成
          </span>
        </Link>

        <Link href="/diary" className="glass-card p-4 flex flex-col items-center gap-2 slide-up stagger-2">
          <div className="p-2.5 bg-pink-500/10 text-pink-500 rounded-xl">
            <Heart size={22} />
          </div>
          <span className="font-medium text-sm">今日日记</span>
          <span className="text-xs text-muted-foreground">记录心情</span>
        </Link>

        <div className="glass-card p-4 flex flex-col items-center gap-2 slide-up stagger-3">
          <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
            <Droplets size={22} />
          </div>
          <span className="font-medium text-sm">喝水提醒</span>
          <div className="flex items-center gap-2">
            <button
              onClick={removeWater}
              className="w-5 h-5 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
            >
              <Minus size={12} />
            </button>
            <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
              {waterCups}/8 杯
            </span>
            <button
              onClick={addWater}
              className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus size={12} className="text-primary" />
            </button>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-4 rounded-sm transition-all duration-300 ${
                  i < waterCups ? "bg-primary/60" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <Link href="/health" className="glass-card p-4 flex flex-col items-center gap-2 slide-up stagger-4">
          <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
            <Dumbbell size={22} />
          </div>
          <span className="font-medium text-sm">运动提醒</span>
          <span className="text-xs text-muted-foreground">今日 {exerciseMinutes} 分钟</span>
        </Link>
      </div>

      <div className="glass-card p-4 fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Smile size={16} className="text-primary" /> 今日心情
          </h3>
          {todayMood && <span className="text-lg">{todayMood}</span>}
        </div>
        <div className="flex justify-around">
          {moods.map((m) => (
            <button
              key={m.emoji}
              onClick={() => handleMoodSelect(m.emoji, m.score)}
              className={`text-2xl hover:scale-125 transition-transform active:scale-95 p-1 ${
                todayMood === m.emoji ? "scale-110" : ""
              }`}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> 今日课程
          </h3>
          <span className="text-xs text-muted-foreground">{schedules.length} 节课</span>
        </div>
        {schedules.length > 0 ? (
          <div className="flex flex-col gap-2">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground text-xs w-20">{s.timeStart}-{s.timeEnd}</span>
                <span className="glass-card px-3 py-1 text-xs">{s.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">今天没有课程 🎉</p>
        )}
      </div>

      <div className="glass-card p-4 fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Brain size={16} className="text-primary" /> AI回忆
          </h3>
          <span className="glass-badge bg-primary/10 text-primary">去年今天</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg emoji-bounce">
            📸
          </div>
          <div>
            <p className="text-sm font-medium">去年的今天…</p>
            <p className="text-xs text-muted-foreground">暂无回忆记录，继续记录生活吧 ✨</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 fade-in">
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

      <footer className="text-center text-[10px] text-muted-foreground/50 pt-2 pb-4">
        v2.2.0
      </footer>
    </main>
  );
}
