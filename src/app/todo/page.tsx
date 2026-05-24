"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckSquare, Plus, Sparkles,
  CheckCircle2, Circle, Clock, AlertTriangle, Flag, Trash2,
  GripVertical, BarChart3, Target
} from "lucide-react";
import Link from "next/link";

interface Todo {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  isDone: boolean;
  aiGenerated: boolean;
  dueDate?: string;
  createdAt: string;
  isRepeat?: boolean;
  repeatRule?: string;
  tags?: string;
  attachments?: string;
  sortOrder?: number;
}

const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  urgent: { label: "紧急", color: "bg-red-500/10 text-red-500", icon: AlertTriangle },
  important: { label: "重要", color: "bg-orange-500/10 text-orange-500", icon: Flag },
  normal: { label: "普通", color: "bg-primary/10 text-primary", icon: Circle },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "未开始", color: "bg-gray-500/10 text-gray-500" },
  in_progress: { label: "进行中", color: "bg-blue-500/10 text-blue-500" },
  completed: { label: "已完成", color: "bg-green-500/10 text-green-500" },
  postponed: { label: "延期", color: "bg-yellow-500/10 text-yellow-500" },
};

const repeatLabels: Record<string, string> = {
  daily: "🔄 每日",
  weekly: "🔄 每周",
  monthly: "🔄 每月",
};

const categories = [
  { name: "全部", emoji: "📋" },
  { name: "学习", emoji: "📚" },
  { name: "生活", emoji: "🏠" },
  { name: "工作", emoji: "💼" },
  { name: "健康", emoji: "💪" },
  { name: "恋爱", emoji: "💕" },
  { name: "默认", emoji: "📌" },
];

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDueDate(dueDate?: string): string {
  if (!dueDate) return "";
  const d = new Date(dueDate);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "明天";
  if (diffDays === -1) return "昨天";
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}天后`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState("全部");
  const [showAi, setShowAi] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [confettiId, setConfettiId] = useState<string | null>(null);
  const [fadingId, setFadingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState<Record<string, number>>({});
  const touchStartX = useRef<Record<string, number>>({});
  const touchCurrentX = useRef<Record<string, number>>({});

  useEffect(() => {
    fetchTodos();
  }, []);

  const applyOrder = useCallback((items: Todo[]): Todo[] => {
    try {
      const orderStr = localStorage.getItem("todo-order");
      if (!orderStr) return items;
      const order: string[] = JSON.parse(orderStr);
      const ordered = order
        .map((id) => items.find((t) => t.id === id))
        .filter(Boolean) as Todo[];
      const remaining = items.filter((t) => !order.includes(t.id));
      return [...ordered, ...remaining];
    } catch {
      return items;
    }
  }, []);

  async function fetchTodos() {
    try {
      const res = await fetch("/api/todo");
      const data = await res.json();
      setTodos(applyOrder(data));
    } catch {}
  }

  async function toggleTodo(id: string, isDone: boolean) {
    if (!isDone) {
      setConfettiId(id);
      setFadingId(id);
      setTimeout(() => {
        setFadingId(null);
        setConfettiId(null);
      }, 600);
    }
    try {
      await fetch(`/api/todo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !isDone, status: !isDone ? "completed" : "pending" }),
      });
      fetchTodos();
    } catch {}
  }

  async function deleteTodo(id: string) {
    try {
      await fetch(`/api/todo/${id}`, { method: "DELETE" });
      fetchTodos();
    } catch {}
  }

  async function handleAiGenerate() {
    if (!aiGoal.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: aiGoal }),
      });
      const tasks = await res.json();
      if (Array.isArray(tasks)) {
        for (const task of tasks) {
          await fetch("/api/todo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: task.title,
              description: task.description,
              priority: task.priority || "normal",
              aiGenerated: true,
              dueDate: task.dueOffset
                ? new Date(Date.now() + task.dueOffset * 86400000).toISOString()
                : null,
            }),
          });
        }
        fetchTodos();
      }
      setShowAi(false);
      setAiGoal("");
    } catch {} finally {
      setAiLoading(false);
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const reordered = [...filteredTodos];
    const fromIdx = reordered.findIndex((t) => t.id === dragId);
    const toIdx = reordered.findIndex((t) => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const order = reordered.map((t) => t.id);
    localStorage.setItem("todo-order", JSON.stringify(order));
    setTodos(applyOrder(todos));
    setDragId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  function handleTouchStart(id: string, e: React.TouchEvent) {
    touchStartX.current[id] = e.touches[0].clientX;
    touchCurrentX.current[id] = e.touches[0].clientX;
  }

  function handleTouchMove(id: string, e: React.TouchEvent) {
    touchCurrentX.current[id] = e.touches[0].clientX;
    const diff = touchStartX.current[id] - touchCurrentX.current[id];
    if (diff > 0) {
      setSwipeX((prev) => ({ ...prev, [id]: Math.min(diff, 80) }));
    } else {
      setSwipeX((prev) => ({ ...prev, [id]: 0 }));
    }
  }

  function handleTouchEnd(id: string) {
    const diff = touchStartX.current[id] - touchCurrentX.current[id];
    if (diff < 60) {
      setSwipeX((prev) => ({ ...prev, [id]: 0 }));
    }
  }

  const filteredTodos =
    filter === "全部" ? todos : todos.filter((t) => t.category === filter);

  const pendingTodos = filteredTodos.filter((t) => !t.isDone);
  const completedTodos = filteredTodos.filter((t) => t.isDone);

  const totalCount = filteredTodos.length;
  const completedCount = completedTodos.length;
  const pendingCount = pendingTodos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-3xl lg:mx-auto">
      <header className="flex items-center justify-between mb-5 pt-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CheckSquare size={22} className="text-primary" /> 待办列表
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAi(!showAi)}
            className="glass-button-outline px-3 py-1.5 text-xs flex items-center gap-1"
          >
            <Sparkles size={14} /> AI助手
          </button>
          <Link
            href="/todo/new"
            className="glass-button px-3 py-1.5 text-xs flex items-center gap-1"
          >
            <Plus size={14} /> 新建
          </Link>
        </div>
      </header>

      {showAi && (
        <div className="glass-card p-4 mb-4 fade-in">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> AI 任务助手
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            告诉我你的目标，AI帮你生成学习计划
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiGoal}
              onChange={(e) => setAiGoal(e.target.value)}
              placeholder="例如：下周要考四级..."
              className="flex-1 glass-input px-3 py-2 text-sm"
            />
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="glass-button px-4 py-2 text-xs disabled:opacity-50"
            >
              {aiLoading ? "生成中..." : "生成"}
            </button>
          </div>
        </div>
      )}

      <div className="glass-card p-3 mb-4 fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Target size={12} /> 完成进度
          </span>
          <span className="text-xs font-bold text-primary">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <BarChart3 size={10} /> 总计 {totalCount}
            </span>
            <span className="text-[10px] text-green-500">✓ {completedCount}</span>
            <span className="text-[10px] text-primary">○ {pendingCount}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setFilter(cat.name)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              filter === cat.name
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "glass-card text-muted-foreground"
            }`}
          >
            <span>{cat.emoji}</span> {cat.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {pendingTodos.map((todo, index) => {
          const pConfig = priorityConfig[todo.priority] || priorityConfig.normal;
          const PIcon = pConfig.icon;
          const overdue = isOverdue(todo.dueDate);
          const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
          const isFading = fadingId === todo.id;
          const isDragging = dragId === todo.id;
          const isDragOver = dragOverId === todo.id;
          const swipeOffset = swipeX[todo.id] || 0;

          return (
            <div
              key={todo.id}
              className={`relative overflow-hidden ${staggerClass}`}
              draggable
              onDragStart={(e) => handleDragStart(e, todo.id)}
              onDragOver={(e) => handleDragOver(e, todo.id)}
              onDrop={(e) => handleDrop(e, todo.id)}
              onDragEnd={handleDragEnd}
            >
              <div
                className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 rounded-r-2xl transition-all"
                style={{ width: "80px", opacity: swipeOffset > 30 ? 1 : 0 }}
              >
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-white p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div
                className={`glass-card p-4 transition-all duration-300 ${
                  isFading ? "opacity-0 -translate-y-2 scale-95" : "fade-in"
                } ${isDragging ? "opacity-50 border-dashed border-2 border-primary" : ""} ${
                  isDragOver ? "border-2 border-primary/50" : ""
                }`}
                style={{
                  transform: swipeOffset > 0 ? `translateX(-${swipeOffset}px)` : undefined,
                  transition: swipeOffset === 0 ? "transform 0.3s ease" : "transform 0.05s linear",
                }}
                onTouchStart={(e) => handleTouchStart(todo.id, e)}
                onTouchMove={(e) => handleTouchMove(todo.id, e)}
                onTouchEnd={() => handleTouchEnd(todo.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-muted-foreground/40 cursor-grab active:cursor-grabbing">
                      <GripVertical size={14} />
                    </span>
                    <button
                      onClick={() => toggleTodo(todo.id, todo.isDone)}
                      className={confettiId === todo.id ? "confetti" : ""}
                    >
                      <Circle size={22} className="text-primary" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{todo.title}</h3>
                      {todo.aiGenerated && (
                        <span className="glass-badge bg-primary/10 text-primary">AI</span>
                      )}
                      {todo.isRepeat && todo.repeatRule && repeatLabels[todo.repeatRule] && (
                        <span className="glass-badge bg-accent/20 text-accent-foreground">
                          {repeatLabels[todo.repeatRule]}
                        </span>
                      )}
                    </div>
                    {todo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {todo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`glass-badge ${pConfig.color}`}>
                        <PIcon size={10} /> {pConfig.label}
                      </span>
                      <span className={`glass-badge ${statusConfig[todo.status]?.color || ""}`}>
                        {statusConfig[todo.status]?.label || todo.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{todo.category}</span>
                      {todo.dueDate && (
                        <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                          <Clock size={10} /> {formatDueDate(todo.dueDate)}
                          {overdue && " ⚠"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-muted-foreground/50 hover:text-red-500 p-1 hidden sm:block"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {completedTodos.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">已完成 ({completedTodos.length})</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {completedTodos.map((todo, index) => {
              const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
              return (
                <div
                  key={todo.id}
                  className={`glass-card p-4 opacity-60 fade-in ${staggerClass}`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTodo(todo.id, todo.isDone)}
                      className={confettiId === todo.id ? "confetti" : ""}
                    >
                      <CheckCircle2 size={22} className="text-primary" />
                    </button>
                    <h3 className="font-medium text-sm line-through flex-1">{todo.title}</h3>
                    {todo.isRepeat && todo.repeatRule && repeatLabels[todo.repeatRule] && (
                      <span className="glass-badge bg-accent/20 text-accent-foreground">
                        {repeatLabels[todo.repeatRule]}
                      </span>
                    )}
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-muted-foreground/50 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {todos.length === 0 && (
          <div className="text-center py-16 fade-in">
            <div className="text-6xl mb-4 emoji-bounce">📝</div>
            <p className="text-sm text-muted-foreground">暂无待办事项</p>
            <p className="text-xs text-muted-foreground mt-1">点击右上角添加或使用AI助手生成</p>
          </div>
        )}

        {todos.length > 0 && pendingTodos.length === 0 && (
          <div className="text-center py-16 fade-in">
            <div className="text-6xl mb-4 emoji-bounce">🎉</div>
            <p className="text-lg font-bold text-primary mb-1">所有任务都完成啦～</p>
            <p className="text-xs text-muted-foreground">太棒了，好好休息一下吧！</p>
          </div>
        )}
      </div>
    </main>
  );
}
