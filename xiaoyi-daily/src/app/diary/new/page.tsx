"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Sparkles, X, ImagePlus, MapPin, CloudSun, Tag, Smile } from "lucide-react";
import Link from "next/link";

const MOODS = [
  { emoji: "😊", label: "开心" },
  { emoji: "😌", label: "平静" },
  { emoji: "🥰", label: "甜蜜" },
  { emoji: "😢", label: "难过" },
  { emoji: "😤", label: "生气" },
  { emoji: "😴", label: "困倦" },
  { emoji: "🤔", label: "思考" },
];

const WEATHERS = [
  { emoji: "☀️", label: "晴天" },
  { emoji: "⛅", label: "多云" },
  { emoji: "☁️", label: "阴天" },
  { emoji: "🌧️", label: "雨天" },
  { emoji: "❄️", label: "雪天" },
  { emoji: "🌙", label: "夜晚" },
];

export default function NewDiaryPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [weather, setWeather] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const [viewMode, setViewMode] = useState<"original" | "ai">("original");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const remaining = 9 - images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImages((prev) => {
          if (prev.length >= 9) return prev;
          return [...prev, base64];
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  function addTag() {
    const trimmed = tagInput.trim().replace(/,$/g, "");
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleAiExpand() {
    if (!content.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `请将以下日记内容扩写为一篇优美的日记，保持原文情感，加入更多细节描写，字数300-500字：\n${content}`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiContent(data.content || "");
      setViewMode("ai");
    } catch {
      setAiContent("");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    const finalContent = viewMode === "ai" && aiContent ? aiContent : content;
    try {
      await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "无标题日记",
          content: finalContent,
          mood,
          weather,
          tags: tags.join(","),
          location,
          images: images.length > 0 ? JSON.stringify(images) : null,
          diaryType: aiContent ? "ai" : "text",
          aiExpanded: !!aiContent,
          aiContent: aiContent || null,
        }),
      });
      window.location.href = "/diary";
    } catch {}
  }

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center gap-4 mb-5 pt-2 fade-in">
        <Link
          href="/diary"
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">写日记</h1>
      </header>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="日记标题..."
          className="glass-input px-4 py-3 text-sm w-full fade-in"
        />

        <div className="fade-in stagger-1">
          {viewMode === "original" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今天发生了什么..."
              className="glass-input px-4 py-3 text-sm w-full min-h-[200px] resize-none"
              rows={8}
            />
          ) : (
            <textarea
              value={aiContent}
              onChange={(e) => setAiContent(e.target.value)}
              className="glass-input px-4 py-3 text-sm w-full min-h-[200px] resize-none"
              rows={8}
            />
          )}
        </div>

        {content.trim() && (
          <div className="flex gap-2 fade-in stagger-2">
            <button
              onClick={() => setViewMode("original")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === "original"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "glass-card text-muted-foreground"
              }`}
            >
              原文
            </button>
            <button
              onClick={() => {
                if (!aiContent) {
                  handleAiExpand();
                } else {
                  setViewMode("ai");
                }
              }}
              disabled={aiLoading}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                viewMode === "ai"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "glass-card text-muted-foreground"
              }`}
            >
              <Sparkles size={14} />
              {aiLoading ? "AI 扩写中..." : aiContent ? "AI扩写" : "AI扩写"}
            </button>
          </div>
        )}

        <div className="glass-card p-4 fade-in stagger-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <ImagePlus size={14} className="text-primary" /> 图片
            </h4>
            <span className="text-xs text-muted-foreground">
              {images.length}/9
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden scale-in"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <ImagePlus size={20} className="text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/50">
                  添加
                </span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <div className="glass-card p-4 fade-in stagger-3">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Smile size={14} className="text-primary" /> 心情
          </h4>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                onClick={() => setMood(m.emoji)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  mood === m.emoji
                    ? "bg-primary/10 scale-110 shadow-sm"
                    : "hover:bg-muted/50"
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] text-muted-foreground">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 fade-in stagger-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <CloudSun size={14} className="text-primary" /> 天气
          </h4>
          <div className="flex gap-2 flex-wrap">
            {WEATHERS.map((w) => (
              <button
                key={w.emoji}
                onClick={() => setWeather(w.emoji)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  weather === w.emoji
                    ? "bg-primary/10 scale-110 shadow-sm"
                    : "hover:bg-muted/50"
                }`}
              >
                <span className="text-2xl">{w.emoji}</span>
                <span className="text-[10px] text-muted-foreground">
                  {w.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 fade-in stagger-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Tag size={14} className="text-primary" /> 标签
          </h4>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium scale-in"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder="输入标签，按逗号或回车添加..."
            className="glass-input px-4 py-2.5 text-sm w-full"
          />
        </div>

        <div className="flex gap-3 fade-in stagger-5">
          <div className="flex-1 relative">
            <MapPin
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="位置"
              className="glass-input px-4 py-2.5 pl-8 text-sm w-full"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="glass-button py-3 text-sm w-full mt-2 fade-in stagger-5"
        >
          💕 保存日记
        </button>
      </div>
    </main>
  );
}
