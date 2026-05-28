"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft, User, Bell, Database, Info,
  Download, Trash2, ExternalLink, Save, X, Clock
} from "lucide-react";
import Link from "next/link";

const AVATARS = ["🐱", "🐶", "🐰", "🦊", "🐼", "🐨", "🦄", "🐸"];

const NOTIFY_KEYS = [
  { key: "notify-water", label: "喝水提醒", emoji: "💧" },
  { key: "notify-exercise", label: "运动提醒", emoji: "🏃" },
  { key: "notify-anniversary", label: "纪念日提醒", emoji: "💝" },
  { key: "notify-period", label: "生理期提醒", emoji: "🌸" },
];

export default function SettingsPage() {
  const [avatar, setAvatar] = useState("🐱");
  const [nickname, setNickname] = useState("");
  const [savedNickname, setSavedNickname] = useState("");
  const [notifyState, setNotifyState] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const savedAvatar = localStorage.getItem("user-avatar") || "🐱";
    setAvatar(savedAvatar);

    const state: Record<string, boolean> = {};
    NOTIFY_KEYS.forEach(({ key }) => {
      state[key] = localStorage.getItem(key) === "true";
    });
    setNotifyState(state);

    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        setNickname(data.nickname || "");
        setSavedNickname(data.nickname || "");
      });
  }, []);

  function selectAvatar(emoji: string) {
    setAvatar(emoji);
    localStorage.setItem("user-avatar", emoji);
  }

  async function saveNickname() {
    if (!nickname.trim() || nickname === savedNickname) return;
    setSaving(true);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });
    setSavedNickname(nickname.trim());
    setSaving(false);
  }

  function toggleNotify(key: string) {
    const next = !notifyState[key];
    setNotifyState((prev) => ({ ...prev, [key]: next }));
    localStorage.setItem(key, String(next));
  }

  function exportData() {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xiaoyi-daily-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearCache() {
    localStorage.clear();
    setAvatar("🐱");
    setNotifyState(
      Object.fromEntries(NOTIFY_KEYS.map(({ key }) => [key, false]))
    );
    setShowClearConfirm(false);
  }

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-2xl lg:mx-auto">
      <header className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/profile" className="p-1 -ml-1 rounded-xl hover:bg-muted/50 transition-colors">
          <ArrowLeft size={22} className="text-primary" />
        </Link>
        <h1 className="text-xl font-bold">设置</h1>
      </header>

      <div className="flex flex-col gap-4">
        <section className="glass-card p-4 fade-in">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <User size={16} className="text-primary" /> 个人资料
          </h2>

          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">选择头像</p>
            <div className="flex gap-2 flex-wrap">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => selectAvatar(emoji)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all border-2 ${
                    avatar === emoji
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-transparent bg-muted/50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">昵称</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveNickname()}
                placeholder="输入昵称"
                className="glass-input px-3 py-2 text-sm flex-1"
              />
              <button
                onClick={saveNickname}
                disabled={saving || nickname === savedNickname}
                className="glass-button px-3 py-2 text-xs flex items-center gap-1 disabled:opacity-50"
              >
                <Save size={14} /> 保存
              </button>
            </div>
          </div>
        </section>

        <section className="glass-card p-4 fade-in stagger-1">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> 时间与天气
          </h2>
          <Link
            href="/settings/time"
            className="glass-button-outline py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <Clock size={16} /> 时间与天气设置
          </Link>
        </section>

        <section id="notifications" className="glass-card p-4 fade-in stagger-2">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Bell size={16} className="text-primary" /> 通知设置
          </h2>
          <div className="flex flex-col gap-3">
            {NOTIFY_KEYS.map(({ key, label, emoji }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">
                  {emoji} {label}
                </span>
                <button
                  onClick={() => toggleNotify(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifyState[key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      notifyState[key] ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card p-4 fade-in stagger-3">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Database size={16} className="text-primary" /> 数据管理
          </h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={exportData}
              className="glass-button-outline py-2.5 text-sm flex items-center justify-center gap-2"
            >
              <Download size={16} /> 导出数据
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="py-2.5 text-sm flex items-center justify-center gap-2 rounded-xl border border-red-300 text-red-500 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30 transition-all active:scale-95"
            >
              <Trash2 size={16} /> 清除缓存
            </button>
          </div>
        </section>

        <section className="glass-card p-4 fade-in stagger-4">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Info size={16} className="text-primary" /> 关于
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">版本</span>
              <span>v2.3.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">GitHub</span>
              <a
                href="https://github.com/w020316/xiaoling-rij"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink size={14} /> 开源仓库
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Made with</span>
              <span>💕</span>
            </div>
          </div>
        </section>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center fade-in">
          <div className="glass-card p-6 mx-4 max-w-xs w-full text-center slide-up">
            <p className="text-lg font-bold mb-2">确认清除</p>
            <p className="text-sm text-muted-foreground mb-5">确定要清除所有本地缓存吗？此操作不可恢复。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="glass-button-outline flex-1 py-2 text-sm">取消</button>
              <button onClick={clearCache} className="glass-button bg-red-500 text-white flex-1 py-2 text-sm">清除</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
