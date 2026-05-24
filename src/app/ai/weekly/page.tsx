"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, TrendingUp, TrendingDown, BarChart3, BookOpen, Activity, Smile, ClipboardList } from "lucide-react";
import Link from "next/link";

interface Todo {
  id: string;
  title: string;
  status: string;
  isDone: boolean;
  createdAt: string;
}

interface EmotionRecord {
  mood: string;
  score: number;
  note?: string;
  createdAt: string;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function formatWeekRange() {
  const { monday, sunday } = getWeekRange();
  const mMonth = monday.getMonth() + 1;
  const mDay = monday.getDate();
  const sMonth = sunday.getMonth() + 1;
  const sDay = sunday.getDate();
  return `${mMonth}月${mDay}日 — ${sMonth}月${sDay}日`;
}

const WEEKLY_PROMPT = "请根据以下本周数据，生成一份温暖治愈的每周成长报告分析：\n1. 本周整体表现总结\n2. 任务完成情况分析\n3. 情绪变化趋势分析\n4. 学习与运动表现\n5. 下周成长建议\n请用温暖鼓励的语气，加上emoji，分段展示。";

const moodEmojis: Record<string, string> = {
  开心: "😄",
  平静: "😌",
  焦虑: "😰",
  难过: "😢",
  兴奋: "🤩",
  疲惫: "😩",
  感恩: "🙏",
  满足: "😊",
};

export default function WeeklyPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [emotions, setEmotions] = useState<EmotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [studyHours, setStudyHours] = useState<number | null>(null);
  const [exerciseHours, setExerciseHours] = useState<number | null>(null);

  useEffect(() => {
    fetchWeekData();
  }, []);

  async function fetchWeekData() {
    setLoading(true);
    try {
      const { monday } = getWeekRange();
      const [todoRes, emotionRes] = await Promise.all([
        fetch("/api/todo"),
        fetch("/api/emotion?days=7"),
      ]);
      const todoData = await todoRes.json();
      const emotionData = await emotionRes.json();
      const allTodos: Todo[] = Array.isArray(todoData) ? todoData : [];
      const weekTodos = allTodos.filter((t) => {
        const created = new Date(t.createdAt);
        return created >= monday;
      });
      setTodos(weekTodos);
      const allEmotions: EmotionRecord[] = Array.isArray(emotionData) ? emotionData : [];
      const weekEmotions = allEmotions.filter((e) => {
        const created = new Date(e.createdAt);
        return created >= monday;
      });
      setEmotions(weekEmotions);
      try {
        const { monday } = getWeekRange();
        const mondayStr = monday.toISOString().slice(0, 10);
        const exerciseSaved = localStorage.getItem("exercise-records");
        if (exerciseSaved) {
          const records = JSON.parse(exerciseSaved);
          const weekRecords = records.filter((r: any) => r.date >= mondayStr);
          const totalMin = weekRecords.reduce((s: number, r: any) => s + r.duration, 0);
          setExerciseHours(Math.round((totalMin / 60) * 10) / 10);
        }
        const studySaved = localStorage.getItem("study-records");
        if (studySaved) {
          const records = JSON.parse(studySaved);
          const weekRecords = records.filter((r: any) => r.date >= mondayStr);
          const totalMin = weekRecords.reduce((s: number, r: any) => s + r.duration, 0);
          setStudyHours(Math.round((totalMin / 60) * 10) / 10);
        }
      } catch {}
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const completedCount = todos.filter((t) => t.isDone || t.status === "completed").length;
  const totalCount = todos.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const moodScores = weekDays.map((_, i) => {
    const dayDate = new Date(getWeekRange().monday);
    dayDate.setDate(dayDate.getDate() + i);
    const dayStr = dayDate.toISOString().slice(0, 10);
    const dayEmotions = emotions.filter((e) => e.createdAt.slice(0, 10) === dayStr);
    if (dayEmotions.length === 0) return 0;
    return dayEmotions.reduce((sum, e) => sum + e.score, 0) / dayEmotions.length;
  });
  const hasMoodData = moodScores.some((s) => s > 0);
  const maxScore = 10;

  const stats = [
    {
      emoji: "📋",
      title: "任务完成率",
      value: `${completionRate}%`,
      detail: `${completedCount}/${totalCount}`,
      trend: completionRate >= 60 ? "up" : "down",
      trendValue: completionRate >= 60 ? "良好" : "需加油",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      emoji: "📚",
      title: "学习时长",
      value: studyHours !== null ? `${studyHours}h` : "暂无记录",
      detail: "本周累计",
      trend: "up",
      trendValue: studyHours !== null ? (studyHours >= 10 ? "良好" : "需加油") : "",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      emoji: "🏃",
      title: "运动时长",
      value: exerciseHours !== null ? `${exerciseHours}h` : "暂无记录",
      detail: "本周累计",
      trend: exerciseHours !== null ? (exerciseHours >= 3 ? "up" : "down") : "up",
      trendValue: exerciseHours !== null ? (exerciseHours >= 3 ? "达标" : "需加油") : "",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      emoji: "😊",
      title: "心情变化",
      value: emotions.length > 0 ? `${emotions[0].mood}` : "平静",
      detail: emotions.length > 0 ? `均分 ${(emotions.reduce((a, e) => a + e.score, 0) / emotions.length).toFixed(1)}` : "情绪稳定",
      trend: "up",
      trendValue: "积极",
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
  ];

  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    setAnalysis("");
    try {
      const todoInfo = totalCount > 0
        ? `共${totalCount}个任务，完成${completedCount}个，完成率${completionRate}%\n已完成：${todos.filter((t) => t.isDone).map((t) => t.title).join("、") || "无"}\n未完成：${todos.filter((t) => !t.isDone).map((t) => t.title).join("、") || "无"}`
        : "本周暂无任务记录";
      const emotionInfo = emotions.length > 0
        ? emotions.map((e) => `${e.mood}(${e.score}/10)`).join("、")
        : "本周暂无情绪记录";

      const userMessage = `${WEEKLY_PROMPT}\n\n以下是本周数据：\n任务情况：${todoInfo}\n学习时长：${studyHours !== null ? `${studyHours}小时` : "暂无记录"}\n运动时长：${exerciseHours !== null ? `${exerciseHours}小时` : "暂无记录"}\n情绪记录：${emotionInfo}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
        }),
      });
      const data = await res.json();
      setAnalysis(data.content || "生成失败，请稍后再试～ 💫");
    } catch {
      setAnalysis("网络好像有点问题呢，稍后再试试吧～ 💫");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center gap-4 mb-5 pt-2">
        <Link href="/ai" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">
          📊 每周成长报告
        </h1>
      </header>

      <div className="glass-card p-5 text-center mb-5 fade-in">
        <p className="text-4xl mb-2 float-animation">📊</p>
        <h2 className="text-lg font-bold mb-1">每周成长报告</h2>
        <p className="text-sm text-muted-foreground">{formatWeekRange()}</p>
        <p className="text-xs text-muted-foreground mt-2">
          回顾这一周，看见自己的成长 🌱
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {stats.map((stat, i) => (
          <div
            key={stat.title}
            className={`glass-card p-4 fade-in stagger-${i + 1}`}
            style={{ animationFillMode: "both" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.emoji}</span>
              <span className="text-xs text-muted-foreground">{stat.title}</span>
            </div>
            {loading ? (
              <div className="skeleton h-6 w-16 mb-1" />
            ) : (
              <>
                <p className="text-xl font-bold">{stat.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === "up" ? (
                    <TrendingUp size={12} className="text-green-500" />
                  ) : (
                    <TrendingDown size={12} className="text-red-400" />
                  )}
                  <span className={`text-[10px] font-medium ${stat.trend === "up" ? "text-green-500" : "text-red-400"}`}>
                    {stat.trendValue}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.detail}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card p-4 mb-5 fade-in stagger-5" style={{ animationFillMode: "both" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📈</span>
          <h3 className="text-sm font-bold">心情趋势</h3>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        ) : !hasMoodData ? (
          <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
        ) : (
          <div className="flex items-end gap-2 h-24">
            {weekDays.map((day, i) => {
              const score = moodScores[i];
              const height = score > 0 ? (score / maxScore) * 100 : 0;
              const isToday = i === (new Date().getDay() + 6) % 7;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday
                        ? "bg-gradient-to-t from-primary to-accent"
                        : "bg-primary/20"
                    }`}
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  />
                  <span className={`text-[10px] ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!analysis ? (
        <button
          onClick={handleGenerate}
          disabled={generating || loading}
          className="glass-button w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {generating ? "AI 正在分析中..." : "生成AI分析"}
        </button>
      ) : (
        <div className="glass-card p-5 fade-in">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-primary">AI 成长分析</h3>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {analysis}
          </div>
        </div>
      )}

      {generating && (
        <div className="glass-card p-5 mt-4 fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-primary animate-pulse" />
            <h3 className="text-sm font-bold text-primary">AI 正在分析你的本周数据...</h3>
          </div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-4/6" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      )}
    </main>
  );
}
