"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AiDiaryPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const data = await res.json();
      setResult(data);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    try {
      await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.slice(0, 20),
          content: result.diary,
          diaryType: "ai",
          tags: ["AI生成"],
          aiContent: result,
        }),
      });
      window.location.href = "/diary";
    } catch {}
  }

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center gap-4 mb-5 pt-2">
        <Link href="/diary" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">AI 日记</h1>
      </header>

      {!result ? (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 text-center">
            <p className="text-4xl mb-3 float-animation">✨</p>
            <h2 className="text-lg font-bold mb-2">AI 智能日记</h2>
            <p className="text-sm text-muted-foreground">
              用一句话描述今天，AI帮你写完整日记
            </p>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：今天和女朋友去海边玩..."
            className="glass-input px-4 py-3 text-sm w-full min-h-[120px] resize-none"
            rows={5}
          />

          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="glass-button py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={16} />
            {loading ? "AI 正在创作中..." : "生成日记"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-4">
            <h4 className="text-xs font-bold text-primary mb-2">📝 完整日记</h4>
            <p className="text-sm leading-relaxed">{result.diary}</p>
          </div>
          {result.moments && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-bold text-primary mb-2">💬 朋友圈文案</h4>
              <p className="text-sm leading-relaxed">{result.moments}</p>
            </div>
          )}
          {result.xiaohongshu && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-bold text-primary mb-2">📕 小红书文案</h4>
              <p className="text-sm leading-relaxed">{result.xiaohongshu}</p>
            </div>
          )}
          {result.memorial && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-bold text-primary mb-2">💝 纪念文字</h4>
              <p className="text-sm leading-relaxed">{result.memorial}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setResult(null)}
              className="glass-button-outline flex-1 py-2 text-sm"
            >
              重新生成
            </button>
            <button onClick={handleSave} className="glass-button flex-1 py-2 text-sm">
              💕 保存日记
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
