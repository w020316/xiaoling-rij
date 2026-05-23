"use client";

import { useState } from "react";
import { BookHeart, Plus, Sparkles, MapPin, CloudSun, Tag } from "lucide-react";
import Link from "next/link";

const mockDiaries = [
  {
    id: "1",
    title: "海边的午后",
    content: "今天和女朋友去了海边，阳光洒在海面上波光粼粼的，我们手牵着手走在沙滩上，海风吹来咸咸的味道...",
    mood: "🥰",
    weather: "☀️",
    tags: ["约会", "海边"],
    date: "2026-05-22",
  },
  {
    id: "2",
    title: "图书馆的一天",
    content: "在图书馆泡了一整天，终于把高数的作业写完了。晚上回宿舍的路上看到晚霞特别美...",
    mood: "😌",
    weather: "🌤️",
    tags: ["学习", "日常"],
    date: "2026-05-21",
  },
];

export default function DiaryPage() {
  const [filter, setFilter] = useState<"all" | "text" | "ai">("all");

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center justify-between mb-5 pt-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookHeart size={22} className="text-primary" /> 日记本
        </h1>
        <Link
          href="/diary/new"
          className="glass-button px-4 py-2 text-sm flex items-center gap-1.5"
        >
          <Plus size={16} /> 写日记
        </Link>
      </header>

      <div className="flex gap-2 mb-5">
        {[
          { key: "all", label: "全部" },
          { key: "text", label: "文字日记" },
          { key: "ai", label: "AI日记" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "glass-card text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {mockDiaries.map((diary) => (
          <Link href={`/diary/${diary.id}`} key={diary.id} className="glass-card p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-base">{diary.title}</h3>
              <span className="text-2xl">{diary.mood}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {diary.content}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CloudSun size={12} /> {diary.weather}
              </span>
              <span>{diary.date}</span>
              {diary.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 text-primary">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}

        <Link
          href="/diary/ai"
          className="glass-card p-4 border-dashed border-2 border-primary/30 flex items-center gap-3"
        >
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI 智能日记</h3>
            <p className="text-xs text-muted-foreground">输入一句话，AI帮你写完整日记</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
