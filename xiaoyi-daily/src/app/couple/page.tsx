"use client";

import { useState } from "react";
import {
  Heart, Calendar, Gift, PiggyBank, Star,
  Link2, Plus, CheckCircle2
} from "lucide-react";
import { differenceInDays, format } from "date-fns";

const mockAnniversaries = [
  { id: "1", title: "恋爱纪念日", date: "2025-05-12", type: "love", remindDays: 3 },
  { id: "2", title: "TA的生日", date: "2025-08-15", type: "birthday", remindDays: 7 },
  { id: "3", title: "第一次见面", date: "2025-03-20", type: "first", remindDays: 3 },
];

const mockWishList = [
  { id: "1", title: "一起看极光", isCompleted: false },
  { id: "2", title: "一起旅行", isCompleted: true, completedAt: "2026-01-01" },
  { id: "3", title: "一起养猫", isCompleted: false },
  { id: "4", title: "一起看日出", isCompleted: false },
];

const mockSavings = [
  { id: "1", title: "旅行基金", target: 10000, current: 3500 },
  { id: "2", title: "拍婚纱", target: 5000, current: 1200 },
];

export default function CouplePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "anniversary" | "wish" | "savings">("overview");
  const coupleStart = new Date("2025-05-12");
  const coupleDays = differenceInDays(new Date(), coupleStart);

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center gap-3 mb-5 pt-2">
        <Heart size={22} className="text-primary" />
        <h1 className="text-xl font-bold">情侣空间</h1>
      </header>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { key: "overview", label: "💕 概览" },
          { key: "anniversary", label: "🎂 纪念日" },
          { key: "wish", label: "⭐ 愿望清单" },
          { key: "savings", label: "🐷 存钱罐" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "glass-card text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 text-center relative overflow-hidden">
            <div className="absolute top-3 left-3 text-3xl emoji-bounce">💖</div>
            <div className="absolute top-3 right-3 text-3xl emoji-bounce" style={{ animationDelay: "0.5s" }}>💖</div>
            <p className="text-sm text-muted-foreground mb-2">在一起</p>
            <h2 className="text-5xl font-bold text-primary mb-2">{coupleDays}</h2>
            <p className="text-sm text-muted-foreground">天</p>
            <p className="text-xs text-muted-foreground mt-3">
              {format(coupleStart, "yyyy年MM月dd日")} - {format(new Date(), "yyyy年MM月dd日")}
            </p>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Link2 size={16} className="text-primary" /> 绑定邀请码
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入TA的邀请码..."
                className="flex-1 glass-input px-3 py-2 text-sm"
              />
              <button className="glass-button px-4 py-2 text-xs">绑定</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl mb-1">🎂</p>
              <p className="text-xs text-muted-foreground">下一个纪念日</p>
              <p className="text-sm font-bold text-primary mt-1">恋爱纪念日</p>
              <p className="text-xs text-muted-foreground">还有 20 天</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl mb-1">⭐</p>
              <p className="text-xs text-muted-foreground">愿望完成</p>
              <p className="text-sm font-bold text-primary mt-1">1/4</p>
              <p className="text-xs text-muted-foreground">继续加油</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "anniversary" && (
        <div className="flex flex-col gap-3">
          <button className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> 添加纪念日
          </button>
          {mockAnniversaries.map((a) => {
            const daysLeft = differenceInDays(new Date(a.date), new Date());
            return (
              <div key={a.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(a.date), "yyyy年MM月dd日")}
                    </p>
                  </div>
                  <div className="text-right">
                    {daysLeft > 0 ? (
                      <>
                        <p className="text-lg font-bold text-primary">{daysLeft}</p>
                        <p className="text-[10px] text-muted-foreground">天后</p>
                      </>
                    ) : (
                      <p className="text-sm text-primary font-bold">🎉 今天！</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "wish" && (
        <div className="flex flex-col gap-3">
          <button className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> 添加愿望
          </button>
          {mockWishList.map((wish) => (
            <div
              key={wish.id}
              className={`glass-card p-4 flex items-center gap-3 ${
                wish.isCompleted ? "opacity-60" : ""
              }`}
            >
              <button
                className={`text-xl ${wish.isCompleted ? "text-primary" : "text-muted-foreground"}`}
              >
                {wish.isCompleted ? <CheckCircle2 size={24} /> : <Star size={24} />}
              </button>
              <span className={`flex-1 text-sm ${wish.isCompleted ? "line-through" : ""}`}>
                {wish.title}
              </span>
              {wish.isCompleted && (
                <span className="text-xs text-primary">✅ 已完成</span>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "savings" && (
        <div className="flex flex-col gap-3">
          <button className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> 新建存钱目标
          </button>
          {mockSavings.map((s) => {
            const percent = Math.round((s.current / s.target) * 100);
            return (
              <div key={s.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    🐷 {s.title}
                  </h3>
                  <span className="text-xs text-primary font-bold">{percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>¥{s.current.toLocaleString()}</span>
                  <span>目标 ¥{s.target.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
