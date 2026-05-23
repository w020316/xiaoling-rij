"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare, Plus, Sparkles, Filter,
  CheckCircle2, Circle, Clock, AlertTriangle, Flag, Trash2
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

const categories = ["全部", "学习", "生活", "工作", "健康", "恋爱", "默认"];

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState("全部");
  const [showAi, setShowAi] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const res = await fetch("/api/todo");
      const data = await res.json();
      setTodos(data);
    } catch {}
  }

  async function toggleTodo(id: string, isDone: boolean) {
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

  const filteredTodos =
    filter === "全部" ? todos : todos.filter((t) => t.category === filter);

  const pendingTodos = filteredTodos.filter((t) => !t.isDone);
  const completedTodos = filteredTodos.filter((t) => t.isDone);

  return (
    <main className="min-h-screen p-5 pb-28">
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
        <div className="glass-card p-4 mb-4">
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

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "glass-card text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {pendingTodos.map((todo) => {
          const pConfig = priorityConfig[todo.priority] || priorityConfig.normal;
          const PIcon = pConfig.icon;
          return (
            <div key={todo.id} className="glass-card p-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTodo(todo.id, todo.isDone)}
                  className="mt-0.5 text-primary"
                >
                  <Circle size={22} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{todo.title}</h3>
                    {todo.aiGenerated && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        AI
                      </span>
                    )}
                  </div>
                  {todo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {todo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${pConfig.color}`}>
                      {pConfig.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig[todo.status]?.color || ""}`}>
                      {statusConfig[todo.status]?.label || todo.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{todo.category}</span>
                  </div>
                </div>
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

        {completedTodos.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">已完成 ({completedTodos.length})</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {completedTodos.map((todo) => (
              <div key={todo.id} className="glass-card p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTodo(todo.id, todo.isDone)}
                    className="text-primary"
                  >
                    <CheckCircle2 size={22} />
                  </button>
                  <h3 className="font-medium text-sm line-through flex-1">{todo.title}</h3>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-muted-foreground/50 hover:text-red-500 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {todos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-sm text-muted-foreground">暂无待办事项</p>
            <p className="text-xs text-muted-foreground mt-1">点击右上角添加或使用AI助手生成</p>
          </div>
        )}
      </div>
    </main>
  );
}
