"use client";

import { useState } from "react";
import { ArrowLeft, Calendar, Tag, Flag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewTodoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("默认");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = ["默认", "学习", "生活", "工作", "健康", "恋爱"];
  const priorities = [
    { key: "normal", label: "普通", emoji: "⚪" },
    { key: "important", label: "重要", emoji: "🟠" },
    { key: "urgent", label: "紧急", emoji: "🔴" },
  ];

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
          tags: tags || null,
        }),
      });
      router.push("/todo");
    } catch {} finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center gap-4 mb-5 pt-2">
        <Link href="/todo" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">新建待办</h1>
      </header>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="待办标题..."
          className="glass-input px-4 py-3 text-sm w-full"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述（可选）..."
          className="glass-input px-4 py-3 text-sm w-full min-h-[80px] resize-none"
          rows={3}
        />

        <div className="glass-card p-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Tag size={14} className="text-primary" /> 分类
          </h4>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "glass-card text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
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
                    ? "bg-primary text-primary-foreground"
                    : "glass-card text-muted-foreground"
                }`}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
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

        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="🏷️ 标签（逗号分隔）"
          className="glass-input px-4 py-3 text-sm w-full"
        />

        <button
          onClick={handleSave}
          disabled={loading || !title.trim()}
          className="glass-button py-3 text-sm w-full mt-2 disabled:opacity-50"
        >
          {loading ? "保存中..." : "✅ 创建待办"}
        </button>
      </div>
    </main>
  );
}
