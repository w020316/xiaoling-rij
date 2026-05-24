"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Users, Image, FileText, Bot, Settings, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Stats {
  todoCount: number;
  diaryCount: number;
  photoCount: number;
  checkInDays: number;
  pendingTodoCount: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "todos" | "diaries" | "photos">("overview");
  const [todos, setTodos] = useState([]);
  const [diaries, setDiaries] = useState([]);

  useEffect(() => {
    fetch("/api/user/stats").then((r) => r.json()).then(setStats);
  }, []);

  useEffect(() => {
    if (activeTab === "todos") fetch("/api/todo").then((r) => r.json()).then(setTodos);
    if (activeTab === "diaries") fetch("/api/diary").then((r) => r.json()).then(setDiaries);
  }, [activeTab]);

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center gap-4 mb-5 pt-2">
        <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1">管理后台</h1>
      </header>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { key: "overview", label: "📊 概览" },
          { key: "todos", label: "✅ 待办" },
          { key: "diaries", label: "📝 日记" },
          { key: "photos", label: "📸 照片" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 text-center">
              <FileText size={24} className="text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{stats?.todoCount || 0}</p>
              <p className="text-xs text-muted-foreground">待办总数</p>
            </div>
            <div className="glass-card p-4 text-center">
              <FileText size={24} className="text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{stats?.diaryCount || 0}</p>
              <p className="text-xs text-muted-foreground">日记总数</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Image size={24} className="text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{stats?.photoCount || 0}</p>
              <p className="text-xs text-muted-foreground">照片总数</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Users size={24} className="text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{stats?.checkInDays || 0}</p>
              <p className="text-xs text-muted-foreground">打卡天数</p>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" /> 数据统计
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span>待完成待办</span><span className="text-primary font-bold">{stats?.pendingTodoCount || 0}</span></div>
              <div className="flex justify-between"><span>已完成待办</span><span className="text-green-500 font-bold">{(stats?.todoCount || 0) - (stats?.pendingTodoCount || 0)}</span></div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Bot size={16} className="text-primary" /> AI 调用统计
            </h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>AI 聊天、日记扩写、任务生成等功能均通过 DeepSeek API 实现</p>
              <p>每次调用约消耗 0.001-0.01 元</p>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Settings size={16} className="text-primary" /> 系统信息
            </h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>版本</span><span>v2.3.0</span></div>
              <div className="flex justify-between"><span>数据库</span><span>PostgreSQL</span></div>
              <div className="flex justify-between"><span>AI引擎</span><span>DeepSeek</span></div>
              <div className="flex justify-between"><span>框架</span><span>Next.js 16</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "todos" && (
        <div className="flex flex-col gap-3">
          {todos.map((todo: any) => (
            <div key={todo.id} className="glass-card p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${todo.isDone ? "line-through opacity-50" : ""}`}>{todo.title}</p>
                <p className="text-[10px] text-muted-foreground">{todo.category} · {todo.priority} · {todo.status}</p>
              </div>
              <form action={async () => {
                await fetch(`/api/todo/${todo.id}`, { method: "DELETE" });
                const res = await fetch("/api/todo");
                setTodos(await res.json());
              }}>
                <button type="submit" className="text-red-500/50 hover:text-red-500 p-1 text-xs">删除</button>
              </form>
            </div>
          ))}
          {todos.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">暂无待办</p>}
        </div>
      )}

      {activeTab === "diaries" && (
        <div className="flex flex-col gap-3">
          {diaries.map((diary: any) => (
            <div key={diary.id} className="glass-card p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{diary.title || "无标题"}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(diary.createdAt).toLocaleDateString()} {diary.aiExpanded && "· AI"}</p>
              </div>
              <form action={async () => {
                await fetch(`/api/diary/${diary.id}`, { method: "DELETE" });
                const res = await fetch("/api/diary");
                setDiaries(await res.json());
              }}>
                <button type="submit" className="text-red-500/50 hover:text-red-500 p-1 text-xs">删除</button>
              </form>
            </div>
          ))}
          {diaries.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">暂无日记</p>}
        </div>
      )}

      {activeTab === "photos" && (
        <div className="glass-card p-8 text-center">
          <Image size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">照片管理请前往时光相册</p>
          <Link href="/album" className="glass-button inline-block px-4 py-2 text-xs mt-3">前往相册</Link>
        </div>
      )}
    </main>
  );
}
