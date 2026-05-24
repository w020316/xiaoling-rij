"use client";

import { useState, useEffect } from "react";
import { BookHeart, Plus, Sparkles, MapPin, CloudSun, Tag, Trash2 } from "lucide-react";
import Link from "next/link";

interface Diary {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  weather: string | null;
  tags: string | null;
  createdAt: string;
  diaryType: string;
  aiExpanded: boolean;
}

export default function DiaryPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [filter, setFilter] = useState<"all" | "text" | "ai">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/diary")
      .then((r) => r.json())
      .then(setDiaries);
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/diary/${id}`, { method: "DELETE" });
    setDiaries((prev) => prev.filter((d) => d.id !== id));
    setDeleteId(null);
  }

  const filtered = diaries.filter((d) => {
    if (filter === "all") return true;
    if (filter === "ai") return d.aiExpanded;
    return !d.aiExpanded;
  });

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
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
        {filtered.map((diary) => (
          <Link href={`/diary/${diary.id}`} key={diary.id} className="glass-card p-4 relative group">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-base">{diary.title || "无标题日记"}</h3>
              <div className="flex items-center gap-1.5">
                {diary.mood && <span className="text-xl">{diary.mood}</span>}
                {diary.aiExpanded && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">AI</span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {diary.content}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {diary.weather && (
                <span className="flex items-center gap-1">
                  <CloudSun size={12} /> {diary.weather}
                </span>
              )}
              <span>{new Date(diary.createdAt).toLocaleDateString()}</span>
              {diary.tags && diary.tags.split(",").map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 text-primary">
                  <Tag size={10} /> {tag.trim()}
                </span>
              ))}
            </div>
            {deleteId === diary.id ? (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center gap-2 rounded-2xl z-10">
                <button onClick={(e) => { e.preventDefault(); handleDelete(diary.id); }} className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-500 text-white">删除</button>
                <button onClick={(e) => { e.preventDefault(); setDeleteId(null); }} className="glass-button-outline px-3 py-1.5 text-xs">取消</button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(diary.id); }}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50/50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            )}
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

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-sm text-muted-foreground">还没有日记哦</p>
            <p className="text-xs text-muted-foreground mt-1">点击右上角开始记录吧！</p>
          </div>
        )}
      </div>
    </main>
  );
}
