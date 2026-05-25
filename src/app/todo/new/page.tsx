"use client";

import { useState } from "react";
import {
  ArrowLeft, Calendar, Tag, Flag, RotateCcw,
  Paperclip, X, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const categories = [
  { name: "默认", emoji: "📌" },
  { name: "学习", emoji: "📚" },
  { name: "生活", emoji: "🏠" },
  { name: "工作", emoji: "💼" },
  { name: "健康", emoji: "💪" },
  { name: "恋爱", emoji: "💕" },
];

const priorities = [
  { key: "normal", label: "普通", emoji: "⚪" },
  { key: "important", label: "重要", emoji: "🟠" },
  { key: "urgent", label: "紧急", emoji: "🔴" },
];

const repeatOptions = [
  { key: "", label: "不重复", emoji: "✨" },
  { key: "daily", label: "每日", emoji: "🔄" },
  { key: "weekly", label: "每周", emoji: "📅" },
  { key: "monthly", label: "每月", emoji: "🗓️" },
];

export default function NewTodoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("默认");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [repeatRule, setRepeatRule] = useState("");
  const [attachment, setAttachment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTag(value: string) {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput.replace(/,$/g, ""));
    }
  }

  function handleTagBlur() {
    if (tagInput.trim()) {
      addTag(tagInput);
    }
  }

  async function handleSave() {
    if (!title.trim() || loading) return;
    setLoading(true);
    try {
      await fetch("/api/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          category,
          priority,
          dueDate: dueDate || null,
          tags: tags.length > 0 ? tags.join(",") : null,
          isRepeat: repeatRule !== "",
          repeatRule: repeatRule || null,
          attachments: attachment || null,
        }),
      });
      router.push("/todo");
    } catch {
      setError("创建失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center gap-4 mb-5 pt-2 fade-in">
        <Link href="/todo" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">新建待办</h1>
      </header>

      {error && (
        <div className="glass-card p-3 mb-4 bg-red-500/10 flex items-center justify-between fade-in">
          <span className="text-xs text-red-500">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="slide-up">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="待办标题..."
            className="glass-input px-4 py-3 text-sm w-full"
          />
        </div>

        <div className="slide-up stagger-1">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述（可选）..."
            className="glass-input px-4 py-3 text-sm w-full min-h-[80px] resize-none"
            rows={3}
          />
        </div>

        <div className="glass-card p-4 slide-up stagger-2">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Tag size={14} className="text-primary" /> 分类
          </h4>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  category === cat.name
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "glass-card text-muted-foreground"
                }`}
              >
                <span>{cat.emoji}</span> {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 slide-up stagger-2">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Flag size={14} className="text-primary" /> 优先级
          </h4>
          <div className="flex gap-3">
            {priorities.map((p) => (
              <button
                key={p.key}
                onClick={() => setPriority(p.key)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  priority === p.key
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "glass-card text-muted-foreground"
                }`}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 slide-up stagger-3">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <RotateCcw size={14} className="text-primary" /> 重复
          </h4>
          <div className="flex flex-wrap gap-2">
            {repeatOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRepeatRule(opt.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  repeatRule === opt.key
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "glass-card text-muted-foreground"
                }`}
              >
                <span>{opt.emoji}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 slide-up stagger-3">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-primary" /> 截止时间
          </h4>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="glass-input px-4 py-2.5 text-sm w-full"
          />
        </div>

        <div className="glass-card p-4 slide-up stagger-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" /> 标签
          </h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="glass-badge bg-primary/10 text-primary flex items-center gap-1 scale-in"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={handleTagBlur}
            placeholder="输入标签后按回车或逗号添加..."
            className="glass-input px-4 py-2.5 text-sm w-full"
          />
        </div>

        <div className="glass-card p-4 slide-up stagger-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Paperclip size={14} className="text-primary" /> 附件备注
          </h4>
          <textarea
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
            placeholder="链接、备注、参考信息..."
            className="glass-input px-4 py-3 text-sm w-full min-h-[60px] resize-none"
            rows={2}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !title.trim()}
          className="glass-button py-3 text-sm w-full mt-2 disabled:opacity-50 slide-up stagger-5"
        >
          {loading ? "保存中..." : "✅ 创建待办"}
        </button>
      </div>
    </main>
  );
}
