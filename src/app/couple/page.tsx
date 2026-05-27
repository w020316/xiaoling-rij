"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart, Plus, CheckCircle2, Star, Link2, Trash2, X, RefreshCw
} from "lucide-react";
import { differenceInDays, format } from "date-fns";

interface Anniversary {
  id: string;
  title: string;
  date: string;
  type: string;
  remindDays: number;
}

interface WishItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface SavingsGoal {
  id: string;
  title: string;
  target: number;
  current: number;
}

interface CoupleData {
  id: string;
  startDate: string;
  inviteCode: string;
  nickname1: string;
  nickname2: string;
  anniversaries: Anniversary[];
  wishLists: WishItem[];
  savingsGoals: SavingsGoal[];
}

export default function CouplePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "anniversary" | "wish" | "savings">("overview");
  const [couple, setCouple] = useState<CoupleData | null>(null);
  const [showAddAnniversary, setShowAddAnniversary] = useState(false);
  const [showAddWish, setShowAddWish] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [newAnniversary, setNewAnniversary] = useState({ title: "", date: "", type: "custom" });
  const [newWish, setNewWish] = useState("");
  const [newSavings, setNewSavings] = useState({ title: "", target: 0 });
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'anniversary'|'wish'|'savings', id: string} | null>(null);

  useEffect(() => {
    fetch("/api/couple").then((r) => r.json()).then(setCouple);
  }, []);

  const coupleDays = couple ? differenceInDays(new Date(), new Date(couple.startDate)) : 0;

  async function addAnniversary() {
    if (!newAnniversary.title || !newAnniversary.date) return;
    try {
      await fetch("/api/anniversary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnniversary),
      });
      setShowAddAnniversary(false);
      setNewAnniversary({ title: "", date: "", type: "custom" });
      const res = await fetch("/api/couple");
      setCouple(await res.json());
    } catch {
      setError("添加纪念日失败");
    }
  }

  async function addWish() {
    if (!newWish) return;
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newWish }),
      });
      setShowAddWish(false);
      setNewWish("");
      const res = await fetch("/api/couple");
      setCouple(await res.json());
    } catch {
      setError("添加愿望失败");
    }
  }

  async function toggleWish(id: string, isCompleted: boolean) {
    try {
      await fetch(`/api/wishlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });
      const res = await fetch("/api/couple");
      setCouple(await res.json());
    } catch {
      setError("操作失败");
    }
  }

  async function addSavingsGoal() {
    if (!newSavings.title || !newSavings.target) return;
    try {
      await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSavings),
      });
      setShowAddSavings(false);
      setNewSavings({ title: "", target: 0 });
      const res = await fetch("/api/couple");
      setCouple(await res.json());
    } catch {
      setError("创建存钱目标失败");
    }
  }

  async function updateSavingsAmount(id: string, current: number) {
    try {
      await fetch(`/api/savings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current }),
      });
      const res = await fetch("/api/couple");
      setCouple(await res.json());
    } catch {
      setError("更新金额失败");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    try {
      const apiMap = { anniversary: "/api/anniversary", wish: "/api/wishlist", savings: "/api/savings" };
      await fetch(`${apiMap[deleteConfirm.type]}/${deleteConfirm.id}`, { method: "DELETE" });
      const res = await fetch("/api/couple");
      setCouple(await res.json());
    } catch {
      setError("删除失败");
    }
    setDeleteConfirm(null);
  }

  const anniversaries = couple?.anniversaries || [];
  const wishLists = couple?.wishLists || [];
  const savingsGoals = couple?.savingsGoals || [];

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-4xl lg:mx-auto">
      <header className="flex items-center gap-3 mb-5 pt-2">
        <Heart size={22} className="text-primary" />
        <h1 className="text-xl font-bold lg:text-2xl">情侣空间</h1>
      </header>

      {error && (
        <div className="glass-card p-3 mb-4 bg-red-500/10 flex items-center justify-between fade-in">
          <span className="text-xs text-red-500">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex gap-2 lg:gap-3 mb-5 overflow-x-auto pb-1">
        {[
          { key: "overview", label: "💕 概览" },
          { key: "anniversary", label: "🎂 纪念日" },
          { key: "wish", label: "⭐ 愿望清单" },
          { key: "savings", label: "🐷 存钱罐" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all lg:px-5 lg:py-2.5 lg:text-sm lg:rounded-lg ${
              activeTab === tab.key ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 lg:p-10 text-center relative overflow-hidden">
            <div className="absolute top-3 left-3 text-3xl lg:text-4xl emoji-bounce">💖</div>
            <div className="absolute top-3 right-3 text-3xl lg:text-4xl emoji-bounce" style={{ animationDelay: "0.5s" }}>💖</div>
            <p className="text-sm text-muted-foreground mb-2 lg:text-base">在一起</p>
            <h2 className="text-5xl font-bold text-primary mb-2 lg:text-7xl">{coupleDays}</h2>
            <p className="text-sm text-muted-foreground lg:text-base">天</p>
            {couple && (
              <p className="text-xs text-muted-foreground mt-3">
                {format(new Date(couple.startDate), "yyyy年MM月dd日")} - {format(new Date(), "yyyy年MM月dd日")}
              </p>
            )}
          </div>

          <div className="glass-card p-4 lg:p-5">
            <h3 className="text-sm font-bold mb-3 lg:text-base flex items-center gap-2">
              <Link2 size={16} className="text-primary lg:size-5" /> 邀请码
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 glass-input px-4 py-2.5 text-sm font-mono text-center text-primary">
                {couple?.inviteCode || "------"}
              </div>
              <button
                onClick={() => couple?.inviteCode && navigator.clipboard.writeText(couple.inviteCode)}
                className="glass-button px-4 py-2.5 text-xs"
              >
                复制
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">分享邀请码给TA，绑定情侣关系</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass-card p-4 text-center lg:p-5">
              <p className="text-2xl mb-1 lg:text-3xl">🎂</p>
              <p className="text-xs text-muted-foreground lg:text-sm">纪念日</p>
              <p className="text-sm font-bold text-primary mt-1 lg:text-base">{anniversaries.length} 个</p>
            </div>
            <div className="glass-card p-4 text-center lg:p-5">
              <p className="text-2xl mb-1 lg:text-3xl">⭐</p>
              <p className="text-xs text-muted-foreground lg:text-sm">愿望完成</p>
              <p className="text-sm font-bold text-primary mt-1 lg:text-base">
                {wishLists.filter((w) => w.isCompleted).length}/{wishLists.length}
              </p>
            </div>
            <div className="glass-card p-4 text-center lg:p-5">
              <p className="text-2xl mb-1 lg:text-3xl">🐷</p>
              <p className="text-xs text-muted-foreground lg:text-sm">存钱目标</p>
              <p className="text-sm font-bold text-primary mt-1 lg:text-base">{savingsGoals.length} 个</p>
            </div>
            <Link href="/couple/sync" className="glass-card p-4 text-center lg:p-5 block hover-lift">
              <RefreshCw size={28} className="mx-auto mb-1 text-primary lg:size-8" />
              <p className="text-xs text-muted-foreground lg:text-sm">数据同步</p>
              <p className="text-sm font-bold text-primary mt-1 lg:text-base">管理</p>
            </Link>
          </div>
        </div>
      )}

      {activeTab === "anniversary" && (
        <div className="flex flex-col gap-3">
          <button onClick={() => setShowAddAnniversary(true)} className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> 添加纪念日
          </button>

          {showAddAnniversary && (
            <div className="glass-card p-4 flex flex-col gap-3">
              <input type="text" value={newAnniversary.title} onChange={(e) => setNewAnniversary({ ...newAnniversary, title: e.target.value })} placeholder="纪念日名称" className="glass-input px-3 py-2 text-sm" />
              <input type="date" value={newAnniversary.date} onChange={(e) => setNewAnniversary({ ...newAnniversary, date: e.target.value })} className="glass-input px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={addAnniversary} className="glass-button flex-1 py-2 text-xs">保存</button>
                <button onClick={() => setShowAddAnniversary(false)} className="glass-button-outline flex-1 py-2 text-xs">取消</button>
              </div>
            </div>
          )}

          {anniversaries.map((a) => {
            const daysLeft = differenceInDays(new Date(a.date), new Date());
            const isPast = daysLeft < 0;
            return (
              <div key={a.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm lg:text-base">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(a.date), "yyyy年MM月dd日")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {isPast ? (
                        <p className="text-sm text-primary font-bold">🎉 已过</p>
                      ) : daysLeft === 0 ? (
                        <p className="text-sm text-primary font-bold">🎉 今天！</p>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-primary">{daysLeft}</p>
                          <p className="text-[10px] text-muted-foreground">天后</p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({type: 'anniversary', id: a.id})}
                      className="p-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {anniversaries.length === 0 && !showAddAnniversary && (
            <p className="text-center text-sm text-muted-foreground py-8">还没有纪念日，添加一个吧 💕</p>
          )}
        </div>
      )}

      {activeTab === "wish" && (
        <div className="flex flex-col gap-3">
          <button onClick={() => setShowAddWish(true)} className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> 添加愿望
          </button>

          {showAddWish && (
            <div className="glass-card p-4 flex flex-col gap-3">
              <input type="text" value={newWish} onChange={(e) => setNewWish(e.target.value)} placeholder="愿望内容" className="glass-input px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={addWish} className="glass-button flex-1 py-2 text-xs">保存</button>
                <button onClick={() => setShowAddWish(false)} className="glass-button-outline flex-1 py-2 text-xs">取消</button>
              </div>
            </div>
          )}

          {wishLists.map((wish) => (
            <div key={wish.id} className={`glass-card p-4 flex items-center gap-3 ${wish.isCompleted ? "opacity-60" : ""}`}>
              <button onClick={() => toggleWish(wish.id, wish.isCompleted)}>
                {wish.isCompleted ? <CheckCircle2 size={24} className="text-primary" /> : <Star size={24} className="text-muted-foreground" />}
              </button>
              <span className={`flex-1 text-sm ${wish.isCompleted ? "line-through" : ""}`}>{wish.title}</span>
              {wish.isCompleted && <span className="text-xs text-primary">✅</span>}
              <button
                onClick={() => setDeleteConfirm({type: 'wish', id: wish.id})}
                className="p-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {wishLists.length === 0 && !showAddWish && (
            <p className="text-center text-sm text-muted-foreground py-8">还没有愿望，添加一个吧 ⭐</p>
          )}
        </div>
      )}

      {activeTab === "savings" && (
        <div className="flex flex-col gap-3">
          <button onClick={() => setShowAddSavings(true)} className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> 新建存钱目标
          </button>

          {showAddSavings && (
            <div className="glass-card p-4 flex flex-col gap-3">
              <input type="text" value={newSavings.title} onChange={(e) => setNewSavings({ ...newSavings, title: e.target.value })} placeholder="存钱目标" className="glass-input px-3 py-2 text-sm" />
              <input type="number" value={newSavings.target || ""} onChange={(e) => setNewSavings({ ...newSavings, target: Number(e.target.value) })} placeholder="目标金额" className="glass-input px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={addSavingsGoal} className="glass-button flex-1 py-2 text-xs">保存</button>
                <button onClick={() => setShowAddSavings(false)} className="glass-button-outline flex-1 py-2 text-xs">取消</button>
              </div>
            </div>
          )}

          {savingsGoals.map((s) => {
            const percent = Math.round((s.current / s.target) * 100);
            return (
              <div key={s.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm lg:text-base">🐷 {s.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-bold">{percent}%</span>
                    <button
                      onClick={() => setDeleteConfirm({type: 'savings', id: s.id})}
                      className="p-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>¥{s.current.toLocaleString()}</span>
                  <span>目标 ¥{s.target.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    const add = prompt("存入金额:", "100");
                    if (add) updateSavingsAmount(s.id, s.current + Number(add));
                  }}
                  className="glass-button-outline w-full py-1.5 text-xs mt-2"
                >
                  💰 存入
                </button>
              </div>
            );
          })}

          {savingsGoals.length === 0 && !showAddSavings && (
            <p className="text-center text-sm text-muted-foreground py-8">还没有存钱目标，添加一个吧 🐷</p>
          )}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center fade-in">
          <div className="glass-card p-6 mx-4 max-w-xs w-full text-center slide-up">
            <p className="text-lg font-bold mb-2">确认删除</p>
            <p className="text-sm text-muted-foreground mb-5">删除后无法恢复，确定要删除吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="glass-button-outline flex-1 py-2 text-sm">取消</button>
              <button onClick={handleDeleteConfirm} className="glass-button bg-red-500 text-white flex-1 py-2 text-sm">删除</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
