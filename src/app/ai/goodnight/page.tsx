"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, Save, Moon, CheckCircle2, BookOpen, Activity, Smile, Lightbulb, X } from "lucide-react";
import Link from "next/link";

interface Todo {
  id: string;
  title: string;
  status: string;
  isDone: boolean;
}

interface Emotion {
  mood: string;
  score: number;
  note?: string;
}

const GOODNIGHT_PROMPT = "请根据以下信息生成今日晚安总结：\n1. 今日完成的任务\n2. 今日学习时间\n3. 今日运动情况\n4. 今日情绪变化\n5. 明日建议\n请用温暖治愈的语气，加上emoji，分段展示。";

function formatDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekDay = weekDays[now.getDay()];
  return `${year}年${month}月${day}日 星期${weekDay}`;
}

export default function GoodnightPage() {
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [studyMinutes, setStudyMinutes] = useState<number | null>(null);
  const [exerciseMinutes, setExerciseMinutes] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [todoRes, emotionRes] = await Promise.all([
        fetch("/api/todo?status=completed"),
        fetch("/api/emotion"),
      ]);
      const todoData = await todoRes.json();
      const emotionData = await emotionRes.json();
      setCompletedTodos(Array.isArray(todoData) ? todoData.filter((t: Todo) => t.isDone) : []);
      setEmotion(emotionData);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const exerciseSaved = localStorage.getItem("exercise-records");
        if (exerciseSaved) {
          const records = JSON.parse(exerciseSaved);
          const todayRecords = records.filter((r: any) => r.date === today);
          const totalMin = todayRecords.reduce((s: number, r: any) => s + r.duration, 0);
          setExerciseMinutes(totalMin > 0 ? totalMin : null);
        }
        const studySaved = localStorage.getItem("study-records");
        if (studySaved) {
          const records = JSON.parse(studySaved);
          const todayRecords = records.filter((r: any) => r.date === today);
          const totalMin = todayRecords.reduce((s: number, r: any) => s + r.duration, 0);
          setStudyMinutes(totalMin > 0 ? totalMin : null);
        }
      } catch { setError("加载运动/学习记录失败") }
    } catch {
      setError("加载今日数据失败，请稍后重试")
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    setSummary("");
    try {
      const todoList = completedTodos.length > 0
        ? completedTodos.map((t) => `- ${t.title}`).join("\n")
        : "暂无已完成任务";
      const emotionInfo = emotion
        ? `心情：${emotion.mood}，情绪分数：${emotion.score}/10${emotion.note ? `，备注：${emotion.note}` : ""}`
        : "暂无情绪记录";

      const studyInfo = studyMinutes !== null ? `${Math.floor(studyMinutes / 60)}小时${studyMinutes % 60 > 0 ? `${studyMinutes % 60}分钟` : ""}` : "暂无学习记录";
      const exerciseInfo = exerciseMinutes !== null ? `${exerciseMinutes}分钟运动` : "暂无运动记录";

      const userMessage = `${GOODNIGHT_PROMPT}\n\n以下是今日数据：\n已完成任务：\n${todoList}\n学习时间：${studyInfo}\n运动情况：${exerciseInfo}\n情绪：${emotionInfo}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
        }),
      });
      const data = await res.json();
      setSummary(data.content || "生成失败，请稍后再试～ 💫");
    } catch {
      setError("AI总结生成失败，请稍后重试")
      setSummary("网络好像有点问题呢，稍后再试试吧～ 💫");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (saving || saved || !summary) return;
    setSaving(true);
    try {
      await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `晚安总结 - ${formatDate()}`,
          content: summary,
          mood: emotion?.mood || "平静",
          diaryType: "goodnight",
        }),
      });
      setSaved(true);
    } catch {
      setError("保存失败，请稍后重试")
    } finally {
      setSaving(false);
    }
  }

  const sections = [
    {
      icon: <CheckCircle2 size={18} className="text-green-500" />,
      emoji: "✅",
      title: "今日完成任务",
      content: loading ? null : completedTodos.length > 0
        ? completedTodos.map((t) => t.title).join("、")
        : "今天还没有完成任务哦～",
      skeleton: true,
    },
    {
      icon: <BookOpen size={18} className="text-blue-500" />,
      emoji: "📚",
      title: "学习时间",
      content: studyMinutes !== null ? `${Math.floor(studyMinutes / 60)}小时${studyMinutes % 60 > 0 ? `${studyMinutes % 60}分钟` : ""}` : "今天还没有记录学习哦～",
      skeleton: false,
    },
    {
      icon: <Activity size={18} className="text-orange-500" />,
      emoji: "🏃",
      title: "运动情况",
      content: exerciseMinutes !== null ? `${exerciseMinutes}分钟运动` : "今天还没有运动哦～",
      skeleton: false,
    },
    {
      icon: <Smile size={18} className="text-pink-500" />,
      emoji: "😊",
      title: "情绪变化",
      content: loading ? null : emotion
        ? `${emotion.mood}（${emotion.score}/10）${emotion.note ? `— ${emotion.note}` : ""}`
        : "今天还没有记录情绪哦～",
      skeleton: true,
    },
    {
      icon: <Lightbulb size={18} className="text-yellow-500" />,
      emoji: "💡",
      title: "明日建议",
      content: "由AI为你生成...",
      skeleton: false,
    },
  ];

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center gap-4 mb-5 pt-2">
        <Link href="/ai" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">
          🌙 晚安总结
        </h1>
      </header>

      <div className="glass-card p-5 text-center mb-5 fade-in">
        <p className="text-4xl mb-2 float-animation">🌙</p>
        <h2 className="text-lg font-bold mb-1">晚安总结</h2>
        <p className="text-sm text-muted-foreground">{formatDate()}</p>
        <p className="text-xs text-muted-foreground mt-2">
          回顾今天，温柔地和自己说晚安 ✨
        </p>
      </div>

      {error && (
        <div className="glass-card p-3 mb-5 bg-red-500/10 flex items-center justify-between fade-in">
          <span className="text-xs text-red-500">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-5">
        {sections.map((section, i) => (
          <div
            key={section.title}
            className={`glass-card p-4 fade-in stagger-${i + 1}`}
            style={{ animationFillMode: "both" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{section.emoji}</span>
              <h3 className="text-sm font-bold">{section.title}</h3>
            </div>
            {loading && section.skeleton ? (
              <div className="space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.content}
              </p>
            )}
          </div>
        ))}
      </div>

      {!summary ? (
        <button
          onClick={handleGenerate}
          disabled={generating || loading}
          className="glass-button w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {generating ? "AI 正在生成晚安总结..." : "生成晚安总结"}
        </button>
      ) : (
        <div className="flex flex-col gap-4 fade-in">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Moon size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-primary">今日晚安总结</h3>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line">
              {summary}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="glass-button w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saved ? "已保存到日记 ✨" : saving ? "保存中..." : "保存到日记"}
          </button>
        </div>
      )}

      {generating && (
        <div className="glass-card p-5 mt-4 fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-primary animate-pulse" />
            <h3 className="text-sm font-bold text-primary">AI 正在为你总结...</h3>
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
