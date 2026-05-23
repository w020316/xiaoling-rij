"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Camera, MapPin, CloudSun, Tag } from "lucide-react";
import Link from "next/link";

export default function NewDiaryPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [weather, setWeather] = useState("");
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [mode, setMode] = useState<"write" | "ai">("write");

  const moods = [
    { emoji: "😊", label: "开心" },
    { emoji: "😌", label: "平静" },
    { emoji: "🥰", label: "甜蜜" },
    { emoji: "😢", label: "难过" },
    { emoji: "😤", label: "生气" },
    { emoji: "🤔", label: "思考" },
  ];

  const weathers = ["☀️", "🌤️", "⛅", "🌧️", "❄️", "🌈"];

  async function handleAiExpand() {
    if (!content.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      setAiResult(data);
    } catch {
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    try {
      await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "无标题日记",
          content: aiResult?.diary || content,
          mood,
          weather,
          tags,
          location,
          diaryType: mode,
          aiExpanded: !!aiResult,
          aiContent: aiResult ? JSON.stringify(aiResult) : null,
        }),
      });
    } catch {}
  }

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center gap-4 mb-5 pt-2">
        <Link href="/diary" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">
          {mode === "ai" ? "AI 日记" : "写日记"}
        </h1>
      </header>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setMode("write")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === "write" ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"
          }`}
        >
          ✍️ 手写日记
        </button>
        <button
          onClick={() => setMode("ai")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === "ai" ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"
          }`}
        >
          ✨ AI 日记
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="日记标题..."
          className="glass-input px-4 py-3 text-sm w-full"
        />

        {mode === "ai" && !aiResult ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="用一句话描述今天... AI会帮你扩写成完整日记 ✨"
              className="glass-input px-4 py-3 text-sm w-full min-h-[100px] resize-none"
              rows={4}
            />
            <button
              onClick={handleAiExpand}
              disabled={aiLoading || !content.trim()}
              className="glass-button py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={16} />
              {aiLoading ? "AI 正在创作中..." : "AI 扩写日记"}
            </button>
          </div>
        ) : aiResult ? (
          <div className="flex flex-col gap-3">
            <div className="glass-card p-4">
              <h4 className="text-xs font-bold text-primary mb-2">📝 扩写日记</h4>
              <p className="text-sm leading-relaxed">{aiResult.diary}</p>
            </div>
            {aiResult.moments && (
              <div className="glass-card p-4">
                <h4 className="text-xs font-bold text-primary mb-2">💬 朋友圈文案</h4>
                <p className="text-sm leading-relaxed">{aiResult.moments}</p>
              </div>
            )}
            {aiResult.xiaohongshu && (
              <div className="glass-card p-4">
                <h4 className="text-xs font-bold text-primary mb-2">📕 小红书文案</h4>
                <p className="text-sm leading-relaxed">{aiResult.xiaohongshu}</p>
              </div>
            )}
            <button
              onClick={() => setAiResult(null)}
              className="glass-button-outline py-2 text-sm"
            >
              重新生成
            </button>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天发生了什么..."
            className="glass-input px-4 py-3 text-sm w-full min-h-[200px] resize-none"
            rows={8}
          />
        )}

        <div className="glass-card p-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Tag size={14} className="text-primary" /> 心情
          </h4>
          <div className="flex gap-3">
            {moods.map((m) => (
              <button
                key={m.emoji}
                onClick={() => setMood(m.emoji)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  mood === m.emoji ? "bg-primary/10 scale-110" : ""
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px]">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <CloudSun size={14} className="text-primary" /> 天气
          </h4>
          <div className="flex gap-3">
            {weathers.map((w) => (
              <button
                key={w}
                onClick={() => setWeather(w)}
                className={`text-2xl p-1.5 rounded-xl transition-all ${
                  weather === w ? "bg-primary/10 scale-110" : ""
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="📍 位置"
            className="flex-1 glass-input px-4 py-2.5 text-sm"
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="🏷️ 标签(逗号分隔)"
            className="flex-1 glass-input px-4 py-2.5 text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          className="glass-button py-3 text-sm w-full mt-2"
        >
          💕 保存日记
        </button>
      </div>
    </main>
  );
}
