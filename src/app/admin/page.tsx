"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Users, Image as ImageIcon, FileText, Bot, Settings, BarChart3,
  Trash2, Search, Download, Database, RefreshCw, X, Loader2,
  CheckSquare, Heart, Calendar, Sparkles, TrendingUp, AlertTriangle,
  Clock, BookHeart, Droplets, CloudSun,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  todoCount: number;
  diaryCount: number;
  photoCount: number;
  checkInDays: number;
  pendingTodoCount: number;
}

interface Todo {
  id: string; title: string; description?: string | null; category: string;
  priority: string; status: string; isDone: boolean; aiGenerated: boolean;
  dueDate?: string | null; createdAt: string;
}
interface Diary {
  id: string; title: string | null; content: string; mood: string | null;
  createdAt: string; aiExpanded: boolean;
}
interface Photo {
  id: string; url: string; description?: string | null; location?: string | null;
  category: string; isFavorite: boolean; createdAt: string;
}
interface Anniversary {
  id: string; title: string; date: string; remindDays: number; type: string; createdAt: string;
}
interface WishList { id: string; title: string; isCompleted: boolean; completedAt: string | null; createdAt: string; }
interface SavingsGoal { id: string; title: string; target: number; current: number; createdAt: string; }
interface Schedule { id: string; timeStart: string; timeEnd: string; title: string; dayOfWeek: number; classroom?: string | null; }
interface Emotion { id: string; mood: string; score: number; note?: string | null; createdAt: string; }
interface CalorieRecord { id: string; foodName: string; calories: number; mealType: string; date: string; }
interface PeriodRecord { id: string; startDate: string; endDate?: string | null; cycleDays: number; symptoms?: string | null; createdAt: string; }

type Tab = "overview" | "todos" | "diaries" | "photos" | "couple" | "schedule" | "emotions" | "health" | "data";

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "overview", label: "概览", emoji: "📊" },
  { key: "todos", label: "待办", emoji: "✅" },
  { key: "diaries", label: "日记", emoji: "📝" },
  { key: "photos", label: "照片", emoji: "📸" },
  { key: "couple", label: "情侣", emoji: "💑" },
  { key: "schedule", label: "课程", emoji: "📅" },
  { key: "emotions", label: "情绪", emoji: "💭" },
  { key: "health", label: "健康", emoji: "💪" },
  { key: "data", label: "数据", emoji: "💾" },
];

const DAY_NAMES = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const priorityLabels: Record<string, string> = { urgent: "紧急", important: "重要", normal: "普通" };
const statusLabels: Record<string, string> = { pending: "未开始", in_progress: "进行中", completed: "已完成", postponed: "延期" };
const mealLabels: Record<string, string> = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐" };

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string; type: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 数据状态
  const [todos, setTodos] = useState<Todo[]>([]);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [wishlists, setWishlists] = useState<WishList[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [calories, setCalories] = useState<CalorieRecord[]>([]);
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [todoSearch, setTodoSearch] = useState("");
  const [diarySearch, setDiarySearch] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  // 概览统计
  useEffect(() => {
    fetch("/api/user/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  // 按标签加载对应数据
  useEffect(() => {
    setLoading(true);
    setError(null);
    const loaders: Partial<Record<Tab, Promise<any>>> = {
      todos: fetch("/api/todo").then((r) => r.json()),
      diaries: fetch("/api/diary").then((r) => r.json()),
      photos: fetch("/api/photo").then((r) => r.json()),
      schedule: fetch("/api/schedule").then((r) => r.json()),
      emotions: fetch("/api/emotion").then((r) => r.json()),
    };
    if (activeTab === "couple") {
      Promise.allSettled([
        fetch("/api/anniversary").then((r) => r.json()),
        fetch("/api/wishlist").then((r) => r.json()),
        fetch("/api/savings").then((r) => r.json()),
      ]).then(([a, w, s]) => {
        if (a.status === "fulfilled") setAnniversaries(Array.isArray(a.value) ? a.value : []);
        if (w.status === "fulfilled") setWishlists(Array.isArray(w.value) ? w.value : []);
        if (s.status === "fulfilled") setSavings(Array.isArray(s.value) ? s.value : []);
        setLoading(false);
      });
      return;
    }
    if (activeTab === "health") {
      Promise.allSettled([
        fetch("/api/calorie").then((r) => r.json()),
        fetch("/api/health/period").then((r) => r.json()),
      ]).then(([c, p]) => {
        if (c.status === "fulfilled") setCalories(Array.isArray(c.value) ? c.value : []);
        if (p.status === "fulfilled") setPeriods(Array.isArray(p.value) ? p.value : []);
        setLoading(false);
      });
      return;
    }
    const loader = loaders[activeTab];
    if (!loader) { setLoading(false); return; }
    loader
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        if (activeTab === "todos") setTodos(arr);
        if (activeTab === "diaries") setDiaries(arr);
        if (activeTab === "photos") setPhotos(arr);
        if (activeTab === "schedule") setSchedules(arr);
        if (activeTab === "emotions") setEmotions(arr);
      })
      .catch(() => setError("加载失败，请重试"))
      .finally(() => setLoading(false));
  }, [activeTab]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    const endpointMap: Record<string, string> = {
      todo: `/api/todo/${id}`, diary: `/api/diary/${id}`, photo: `/api/photo/${id}`,
      anniversary: `/api/anniversary/${id}`, wishlist: `/api/wishlist/${id}`,
      savings: `/api/savings/${id}`, schedule: `/api/schedule/${id}`,
      emotion: `/api/emotion/${id}`, calorie: `/api/calorie/${id}`, period: `/api/health/period/${id}`,
    };
    try {
      const res = await fetch(endpointMap[type], { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      if (type === "todo") setTodos((p) => p.filter((x) => x.id !== id));
      if (type === "diary") setDiaries((p) => p.filter((x) => x.id !== id));
      if (type === "photo") setPhotos((p) => p.filter((x) => x.id !== id));
      if (type === "anniversary") setAnniversaries((p) => p.filter((x) => x.id !== id));
      if (type === "wishlist") setWishlists((p) => p.filter((x) => x.id !== id));
      if (type === "savings") setSavings((p) => p.filter((x) => x.id !== id));
      if (type === "schedule") setSchedules((p) => p.filter((x) => x.id !== id));
      if (type === "emotion") setEmotions((p) => p.filter((x) => x.id !== id));
      if (type === "calorie") setCalories((p) => p.filter((x) => x.id !== id));
      if (type === "period") setPeriods((p) => p.filter((x) => x.id !== id));
      showToast("删除成功");
    } catch {
      showToast("删除失败，请重试");
    }
    setDeleteTarget(null);
  }

  async function handleInitDb() {
    if (!confirm("确定要初始化数据库吗？这将创建默认数据表结构。")) return;
    try {
      const res = await fetch("/api/db/init", { method: "POST" });
      if (res.ok) showToast("数据库初始化成功");
      else showToast("初始化失败");
    } catch {
      showToast("初始化失败，请检查网络");
    }
  }


  function exportData() {
    const data: Record<string, unknown> = { exportTime: new Date().toISOString(), version: "2.4.0" };
    Promise.allSettled([
      fetch("/api/todo").then((r) => r.json()),
      fetch("/api/diary").then((r) => r.json()),
      fetch("/api/photo").then((r) => r.json()),
      fetch("/api/anniversary").then((r) => r.json()),
      fetch("/api/wishlist").then((r) => r.json()),
      fetch("/api/savings").then((r) => r.json()),
      fetch("/api/schedule").then((r) => r.json()),
      fetch("/api/emotion").then((r) => r.json()),
      fetch("/api/calorie").then((r) => r.json()),
      fetch("/api/health/period").then((r) => r.json()),
    ]).then((results) => {
      const keys = ["todos", "diaries", "photos", "anniversaries", "wishlists", "savings", "schedules", "emotions", "calories", "periods"];
      results.forEach((r, i) => {
        if (r.status === "fulfilled") data[keys[i]] = r.value;
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xiaoyi-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("数据导出成功");
    });
  }

  const todoFiltered = todoSearch.trim()
    ? todos.filter((t) => t.title.toLowerCase().includes(todoSearch.toLowerCase()) || (t.description || "").toLowerCase().includes(todoSearch.toLowerCase()))
    : todos;
  const diaryFiltered = diarySearch.trim()
    ? diaries.filter((d) => (d.title || "").toLowerCase().includes(diarySearch.toLowerCase()) || d.content.toLowerCase().includes(diarySearch.toLowerCase()))
    : diaries;

  const completedTodos = todos.filter((t) => t.isDone).length;
  const todoCompletionRate = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-5xl lg:mx-auto">
      <header className="flex items-center gap-3 mb-5 pt-2 fade-in">
        <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft size={22} className="text-primary" />
        </Link>
        <h1 className="text-xl font-bold flex-1 flex items-center gap-2">
          <Settings size={22} className="text-primary" /> 管理后台
        </h1>
        <span className="glass-badge bg-primary/15 text-primary">v2.4.0</span>
      </header>

      {error && (
        <div className="glass-card p-3 mb-4 bg-red-500/10 flex items-center justify-between fade-in">
          <span className="text-xs text-red-500">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-card px-4 py-2 text-xs slide-up shadow-lg">
          {toast}
        </div>
      )}

      {/* 标签栏 */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 fade-in">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === tab.key ? "bg-primary text-primary-foreground shadow-md scale-105" : "glass-card text-muted-foreground"
            }`}
          >
            <span>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center fade-in p-4">
          <div className="glass-card p-6 max-w-xs w-full text-center slide-up">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <p className="text-base font-bold mb-1">确认删除</p>
            <p className="text-xs text-muted-foreground mb-5 truncate">「{deleteTarget.label}」删除后无法恢复</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="glass-button-outline flex-1 py-2 text-sm">取消</button>
              <button onClick={handleDelete} className="glass-button bg-red-500 text-white flex-1 py-2 text-sm">删除</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      )}

      {/* ============ 概览 ============ */}
      {activeTab === "overview" && !loading && (
        <div className="flex flex-col gap-4 fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<CheckSquare size={20} className="text-blue-500" />} value={stats?.todoCount || 0} label="待办总数" sub={`${stats?.pendingTodoCount || 0} 项待完成`} />
            <StatCard icon={<FileText size={20} className="text-pink-500" />} value={stats?.diaryCount || 0} label="日记总数" sub="累计记录" />
            <StatCard icon={<ImageIcon size={20} className="text-green-500" />} value={stats?.photoCount || 0} label="照片总数" sub="时光相册" />
            <StatCard icon={<Users size={20} className="text-purple-500" />} value={stats?.checkInDays || 0} label="打卡天数" sub="连续坚持" />
          </div>

          <div className="glass-card p-5 slide-up">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" /> 数据分析
            </h3>
            <div className="flex flex-col gap-4">
              <ChartBar label="待办完成率" percent={todoCompletionRate} color="from-blue-400 to-cyan-300" icon={<TrendingUp size={14} />} />
              <ChartBar label="日记丰富度" percent={Math.min((stats?.diaryCount || 0) * 2, 100)} color="from-pink-400 to-rose-300" icon={<BookHeart size={14} />} />
              <ChartBar label="相册完整度" percent={Math.min((stats?.photoCount || 0) * 3, 100)} color="from-green-400 to-emerald-300" icon={<ImageIcon size={14} />} />
              <ChartBar label="打卡坚持度" percent={Math.min((stats?.checkInDays || 0) * 2, 100)} color="from-purple-400 to-violet-300" icon={<Heart size={14} />} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Bot size={16} className="text-primary" /> AI 调用统计</h3>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>聊天 / 日记扩写 / 任务生成</span><span className="text-primary">DeepSeek</span></div>
                <div className="flex justify-between"><span>单次成本</span><span>约 0.001-0.01 元</span></div>
                <div className="flex justify-between"><span>AI 标记待办</span><span className="font-bold">{todos.filter((t) => t.aiGenerated).length} 条</span></div>
                <div className="flex justify-between"><span>AI 扩写日记</span><span className="font-bold">{diaries.filter((d) => d.aiExpanded).length} 篇</span></div>
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Settings size={16} className="text-primary" /> 系统信息</h3>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>版本</span><span>v2.4.0</span></div>
                <div className="flex justify-between"><span>框架</span><span>Next.js 16 / React 19</span></div>
                <div className="flex justify-between"><span>数据库</span><span>PostgreSQL + Prisma</span></div>
                <div className="flex justify-between"><span>AI 引擎</span><span>DeepSeek</span></div>
                <div className="flex justify-between"><span>样式</span><span>Tailwind CSS 4</span></div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Sparkles size={16} className="text-primary" /> 快捷操作</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Link href="/todo" className="glass-card p-3 text-center text-xs hover:bg-primary/5 transition-colors">
                <CheckSquare size={18} className="text-blue-500 mx-auto mb-1" /> 待办管理
              </Link>
              <Link href="/diary" className="glass-card p-3 text-center text-xs hover:bg-primary/5 transition-colors">
                <BookHeart size={18} className="text-pink-500 mx-auto mb-1" /> 写日记
              </Link>
              <Link href="/album" className="glass-card p-3 text-center text-xs hover:bg-primary/5 transition-colors">
                <ImageIcon size={18} className="text-green-500 mx-auto mb-1" /> 时光相册
              </Link>
              <button onClick={exportData} className="glass-card p-3 text-center text-xs hover:bg-primary/5 transition-colors">
                <Download size={18} className="text-purple-500 mx-auto mb-1" /> 导出数据
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 待办 ============ */}
      {activeTab === "todos" && !loading && (
        <div className="flex flex-col gap-3 fade-in">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text" value={todoSearch} onChange={(e) => setTodoSearch(e.target.value)}
              placeholder="搜索待办标题或描述..."
              className="glass-input px-4 py-2 pl-8 text-sm w-full"
            />
          </div>
          {todoFiltered.map((todo) => (
            <div key={todo.id} className="glass-card p-3 flex items-center gap-3 slide-up">
              <button
                onClick={() => setDeleteTarget({ id: todo.id, label: todo.title, type: "todo" })}
                className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${todo.isDone ? "line-through opacity-50" : ""}`}>{todo.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="glass-badge bg-primary/10 text-primary">{todo.category}</span>
                  <span className="glass-badge bg-muted text-muted-foreground">{priorityLabels[todo.priority] || todo.priority}</span>
                  <span className="glass-badge bg-muted text-muted-foreground">{statusLabels[todo.status] || todo.status}</span>
                  {todo.aiGenerated && <span className="glass-badge bg-purple-500/10 text-purple-500">AI</span>}
                  {todo.dueDate && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock size={10} /> {new Date(todo.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {todoFiltered.length === 0 && <EmptyState emoji="✅" text="暂无待办" />}
        </div>
      )}

      {/* ============ 日记 ============ */}
      {activeTab === "diaries" && !loading && (
        <div className="flex flex-col gap-3 fade-in">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text" value={diarySearch} onChange={(e) => setDiarySearch(e.target.value)}
              placeholder="搜索日记标题或内容..."
              className="glass-input px-4 py-2 pl-8 text-sm w-full"
            />
          </div>
          {diaryFiltered.map((d) => (
            <div key={d.id} className="glass-card p-3 flex items-center gap-3 slide-up">
              <button
                onClick={() => setDeleteTarget({ id: d.id, label: d.title || "无标题日记", type: "diary" })}
                className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.title || "无标题日记"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
                  {d.mood && <span className="text-sm">{d.mood}</span>}
                  {d.aiExpanded && <span className="glass-badge bg-purple-500/10 text-purple-500">AI</span>}
                </div>
              </div>
            </div>
          ))}
          {diaryFiltered.length === 0 && <EmptyState emoji="📝" text="暂无日记" />}
        </div>
      )}

      {/* ============ 照片 ============ */}
      {activeTab === "photos" && !loading && (
        <div className="flex flex-col gap-3 fade-in">
          {photos.length > 0 && (
            <p className="text-xs text-muted-foreground">共 {photos.length} 张照片，点击右上角删除按钮可移除</p>
          )}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="glass-card overflow-hidden relative group slide-up">
                <div className="relative aspect-square bg-primary/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.description || ""} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setDeleteTarget({ id: p.id, label: p.description || "照片", type: "photo" })}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={11} />
                  </button>
                  {p.isFavorite && (
                    <Heart size={12} className="absolute top-1 left-1 text-red-500 fill-red-500" />
                  )}
                </div>
                <p className="text-[10px] truncate p-1.5">{p.description || "无描述"}</p>
              </div>
            ))}
          </div>
          {photos.length === 0 && <EmptyState emoji="📸" text="暂无照片" />}
        </div>
      )}

      {/* ============ 情侣 ============ */}
      {activeTab === "couple" && !loading && (
        <div className="flex flex-col gap-4 fade-in">
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Heart size={16} className="text-pink-500" /> 纪念日 ({anniversaries.length})</h3>
            <div className="flex flex-col gap-2">
              {anniversaries.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Calendar size={14} className="text-pink-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(a.date).toLocaleDateString()} · 提前 {a.remindDays} 天</p>
                  </div>
                  <button onClick={() => setDeleteTarget({ id: a.id, label: a.title, type: "anniversary" })} className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {anniversaries.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">暂无纪念日</p>}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Sparkles size={16} className="text-purple-500" /> 愿望清单 ({wishlists.length})</h3>
            <div className="flex flex-col gap-2">
              {wishlists.map((w) => (
                <div key={w.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-sm">{w.isCompleted ? "✅" : "⭕"}</span>
                  <p className={`text-sm flex-1 truncate ${w.isCompleted ? "line-through opacity-50" : ""}`}>{w.title}</p>
                  <button onClick={() => setDeleteTarget({ id: w.id, label: w.title, type: "wishlist" })} className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {wishlists.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">暂无愿望</p>}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Droplets size={16} className="text-blue-500" /> 存钱罐 ({savings.length})</h3>
            <div className="flex flex-col gap-2">
              {savings.map((s) => {
                const pct = s.target > 0 ? Math.min(Math.round((s.current / s.target) * 100), 100) : 0;
                return (
                  <div key={s.id} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm flex-1 truncate">{s.title}</p>
                      <span className="text-xs text-muted-foreground">¥{s.current} / ¥{s.target}</span>
                      <button onClick={() => setDeleteTarget({ id: s.id, label: s.title, type: "savings" })} className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {savings.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">暂无存钱目标</p>}
            </div>
          </div>
        </div>
      )}

      {/* ============ 课程表 ============ */}
      {activeTab === "schedule" && !loading && (
        <div className="flex flex-col gap-3 fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const daySchedules = schedules.filter((s) => s.dayOfWeek === day).sort((a, b) => a.timeStart.localeCompare(b.timeStart));
              return (
                <div key={day} className="glass-card p-3">
                  <h3 className="text-xs font-bold mb-2 text-primary">{DAY_NAMES[day]}</h3>
                  <div className="flex flex-col gap-1.5">
                    {daySchedules.map((s) => (
                      <div key={s.id} className="group p-1.5 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">{s.timeStart}</span>
                          <p className="text-[11px] font-medium truncate flex-1">{s.title}</p>
                          <button
                            onClick={() => setDeleteTarget({ id: s.id, label: s.title, type: "schedule" })}
                            className="text-muted-foreground/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                        {s.classroom && <p className="text-[9px] text-muted-foreground">📍 {s.classroom}</p>}
                      </div>
                    ))}
                    {daySchedules.length === 0 && <p className="text-[10px] text-muted-foreground/50 text-center py-2">无课</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {schedules.length === 0 && <EmptyState emoji="📅" text="暂无课程" />}
        </div>
      )}

      {/* ============ 情绪 ============ */}
      {activeTab === "emotions" && !loading && (
        <div className="flex flex-col gap-3 fade-in">
          {emotions.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-primary" /> 情绪趋势（最近 14 条）</h3>
              <div className="flex items-end gap-1 h-20">
                {emotions.slice(0, 14).reverse().map((e) => (
                  <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary to-accent transition-all hover:opacity-80"
                      style={{ height: `${(e.score / 10) * 100}%`, minHeight: "4px" }}
                      title={`${e.mood} · ${e.score}/10`}
                    />
                    <span className="text-[9px]">{e.mood}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {emotions.map((e) => (
            <div key={e.id} className="glass-card p-3 flex items-center gap-3 slide-up">
              <span className="text-2xl">{e.mood}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">心情评分 {e.score}/10</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString()}
                  {e.note && ` · ${e.note}`}
                </p>
              </div>
              <button onClick={() => setDeleteTarget({ id: e.id, label: `${e.mood} 情绪记录`, type: "emotion" })} className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {emotions.length === 0 && <EmptyState emoji="💭" text="暂无情绪记录" />}
        </div>
      )}

      {/* ============ 健康 ============ */}
      {activeTab === "health" && !loading && (
        <div className="flex flex-col gap-4 fade-in">
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Droplets size={16} className="text-orange-500" /> 卡路里记录 ({calories.length})</h3>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {calories.slice().reverse().map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-sm">🍜</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.foodName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {mealLabels[c.mealType] || c.mealType} · {c.calories} 千卡 · {new Date(c.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setDeleteTarget({ id: c.id, label: c.foodName, type: "calorie" })} className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {calories.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">暂无卡路里记录</p>}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Heart size={16} className="text-pink-500" /> 生理期记录 ({periods.length})</h3>
            <div className="flex flex-col gap-2">
              {periods.slice().reverse().map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Calendar size={14} className="text-pink-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {new Date(p.startDate).toLocaleDateString()}
                      {p.endDate && ` → ${new Date(p.endDate).toLocaleDateString()}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      周期 {p.cycleDays} 天{p.symptoms ? ` · ${p.symptoms}` : ""}
                    </p>
                  </div>
                  <button onClick={() => setDeleteTarget({ id: p.id, label: "生理期记录", type: "period" })} className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {periods.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">暂无生理期记录</p>}
            </div>
          </div>
        </div>
      )}

      {/* ============ 数据 ============ */}
      {activeTab === "data" && !loading && (
        <div className="flex flex-col gap-4 fade-in">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Database size={16} className="text-primary" /> 数据管理</h3>
            <p className="text-xs text-muted-foreground mb-4">导出所有数据为 JSON 备份文件，可用于数据迁移或归档。</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <button onClick={exportData} className="glass-button py-3 text-sm flex items-center justify-center gap-2">
                <Download size={16} /> 导出全部数据
              </button>
              <button onClick={handleInitDb} className="glass-button-outline py-3 text-sm flex items-center justify-center gap-2">
                <RefreshCw size={16} /> 初始化数据库
              </button>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><BarChart3 size={16} className="text-primary" /> 数据概览</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <CheckSquare size={18} className="text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.todoCount || 0}</p>
                <p className="text-[10px] text-muted-foreground">待办</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <FileText size={18} className="text-pink-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.diaryCount || 0}</p>
                <p className="text-[10px] text-muted-foreground">日记</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <ImageIcon size={18} className="text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.photoCount || 0}</p>
                <p className="text-[10px] text-muted-foreground">照片</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <Users size={18} className="text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.checkInDays || 0}</p>
                <p className="text-[10px] text-muted-foreground">打卡</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><CloudSun size={16} className="text-primary" /> 部署信息</h3>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>主部署</span><span>Vercel (PostgreSQL)</span></div>
              <div className="flex justify-between"><span>静态部署</span><span>GitHub Pages</span></div>
              <div className="flex justify-between"><span>双模式</span><span>自动切换</span></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ icon, value, label, sub }: { icon: React.ReactNode; value: number; label: string; sub: string }) {
  return (
    <div className="glass-card p-4 text-center slide-up">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[10px] text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function ChartBar({ label, percent, color, icon }: { label: string; percent: number; color: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">{icon} {label}</span>
        <span className="text-xs font-bold text-primary">{percent}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="text-center py-12 fade-in">
      <p className="text-4xl mb-2 opacity-50">{emoji}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
