"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, RotateCcw, Save, X } from "lucide-react";
import Link from "next/link";
import {
  getStoredTimeInfo,
  saveTimeSettings,
  resetTimeSettings,
  TIMEZONES,
} from "@/lib/time-manager";

export default function TimeSettingsPage() {
  const [systemTime, setSystemTime] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredTimeInfo();
    if (stored) {
      setSelectedTimezone(stored.timezone);
      if (stored.manualSet) {
        const adjusted = new Date(Date.now() + stored.offset);
        setManualDate(adjusted.toISOString().slice(0, 10));
        setManualTime(
          `${String(adjusted.getHours()).padStart(2, "0")}:${String(adjusted.getMinutes()).padStart(2, "0")}`
        );
      }
    }

    const tick = () => {
      setSystemTime(new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleTimezoneChange(value: string) {
    setSelectedTimezone(value);
    setManualDate("");
    setManualTime("");
    setSaved(false);
  }

  function handleManualDateChange(value: string) {
    setManualDate(value);
    setSaved(false);
  }

  function handleManualTimeChange(value: string) {
    setManualTime(value);
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    try {
      if (manualDate && manualTime) {
        const target = new Date(`${manualDate}T${manualTime}:00`);
        if (isNaN(target.getTime())) {
          setError("日期时间格式无效");
          setSaving(false);
          return;
        }
        const offset = target.getTime() - Date.now();
        const tz = TIMEZONES.find((t) => t.value === selectedTimezone);
        saveTimeSettings(offset, tz?.value || "Asia/Shanghai");
      } else {
        const tz = TIMEZONES.find((t) => t.value === selectedTimezone);
        if (tz) {
          saveTimeSettings(0, tz.value);
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    resetTimeSettings();
    setSelectedTimezone("");
    setManualDate("");
    setManualTime("");
    setSaved(false);
    setError(null);
  }

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-2xl lg:mx-auto">
      <header className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/settings" className="p-1 -ml-1 rounded-xl hover:bg-muted/50 transition-colors">
          <ArrowLeft size={22} className="text-primary" />
        </Link>
        <h1 className="text-xl font-bold">时间设置</h1>
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
        <section className="glass-card p-4 fade-in">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> 当前系统时间
          </h2>
          <p className="text-3xl font-bold text-primary text-center py-3 font-mono">
            {systemTime || "加载中..."}
          </p>
          <p className="text-xs text-muted-foreground text-center">北京时间</p>
        </section>

        <section className="glass-card p-4 fade-in stagger-1">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            🌍 时区选择
          </h2>
          <select
            value={selectedTimezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="glass-input px-3 py-2.5 text-sm w-full"
          >
            <option value="">自动检测（浏览器时区）</option>
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          {selectedTimezone && (
            <p className="text-xs text-muted-foreground mt-2">
              已选择：{TIMEZONES.find((t) => t.value === selectedTimezone)?.label || selectedTimezone}
            </p>
          )}
        </section>

        <section className="glass-card p-4 fade-in stagger-2">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            📅 手动调整日期时间
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            如需模拟特定日期的功能（如提前查看纪念日提醒），可在此手动设置日期和时间。
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">日期</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => handleManualDateChange(e.target.value)}
                className="glass-input px-3 py-2.5 text-sm w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">时间</label>
              <input
                type="time"
                value={manualTime}
                onChange={(e) => handleManualTimeChange(e.target.value)}
                className="glass-input px-3 py-2.5 text-sm w-full"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-3 fade-in stagger-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="glass-button flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "保存中..." : saved ? "已保存 ✅" : "保存设置"}
          </button>
          <button
            onClick={handleReset}
            className="glass-button-outline flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> 重置
          </button>
        </div>
      </div>
    </main>
  );
}