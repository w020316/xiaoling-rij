"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Thermometer, Plus, Minus, ChevronRight } from "lucide-react";

interface ExerciseRecord {
  id: string;
  type: string;
  duration: number;
  calories: number;
  date: string;
}

interface SleepRecord {
  id: string;
  bedtime: string;
  wakeTime: string;
  quality: string;
  date: string;
}

interface StudyRecord {
  id: string;
  subject: string;
  duration: number;
  date: string;
}

interface PeriodPrediction {
  nextDate: string | null;
  daysUntil: number | null;
}

type TabKey = "water" | "exercise" | "sleep" | "study" | "period";

const EXERCISE_TYPES = ["跑步", "瑜伽", "游泳", "骑行", "健身", "散步", "其他"];
const EXERCISE_EMOJIS: Record<string, string> = {
  "跑步": "🏃", "瑜伽": "🧘", "游泳": "🏊", "骑行": "🚴",
  "健身": "💪", "散步": "🚶", "其他": "🏅",
};
const STUDY_SUBJECTS = ["数学", "英语", "编程", "阅读", "专业课", "其他"];
const STUDY_EMOJIS: Record<string, string> = {
  "数学": "📐", "英语": "🔤", "编程": "💻", "阅读": "📖", "专业课": "📚", "其他": "✏️",
};
const SLEEP_QUALITY_OPTIONS = [
  { value: "好", emoji: "😊", color: "text-green-500" },
  { value: "一般", emoji: "😐", color: "text-yellow-500" },
  { value: "差", emoji: "😫", color: "text-red-500" },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function calcSleepDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  return Math.round((wakeMin - bedMin) / 60 * 10) / 10;
}

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("water");
  const [waterCups, setWaterCups] = useState(0);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [periodPrediction, setPeriodPrediction] = useState<PeriodPrediction>({ nextDate: null, daysUntil: null });
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddSleep, setShowAddSleep] = useState(false);
  const [showAddStudy, setShowAddStudy] = useState(false);
  const [newExercise, setNewExercise] = useState({ type: "跑步", duration: 30, calories: 100 });
  const [newSleep, setNewSleep] = useState({ bedtime: "23:00", wakeTime: "07:00", quality: "好" });
  const [newStudy, setNewStudy] = useState({ subject: "编程", duration: 60 });
  const [deleteTarget, setDeleteTarget] = useState<{type: 'exercise'|'sleep'|'study', id: string} | null>(null);

  const loadWater = useCallback(() => {
    const key = `water-cups-${getTodayKey()}`;
    const saved = localStorage.getItem(key);
    if (saved) setWaterCups(Number(saved));
    else setWaterCups(0);
  }, []);

  const loadExercise = useCallback(() => {
    const saved = localStorage.getItem("exercise-records");
    if (saved) setExerciseRecords(JSON.parse(saved));
  }, []);

  const loadSleep = useCallback(() => {
    const saved = localStorage.getItem("sleep-records");
    if (saved) setSleepRecords(JSON.parse(saved));
  }, []);

  const loadStudy = useCallback(() => {
    const saved = localStorage.getItem("study-records");
    if (saved) setStudyRecords(JSON.parse(saved));
  }, []);

  const loadPeriodPrediction = useCallback(async () => {
    setPeriodError(null);
    try {
      const res = await fetch("/api/health/period");
      const records = await res.json();
      if (records.length > 0) {
        const last = records[0];
        const next = new Date(last.startDate);
        next.setDate(next.getDate() + last.cycleDays);
        const days = Math.max(0, Math.ceil((next.getTime() - Date.now()) / 86400000));
        setPeriodPrediction({ nextDate: next.toISOString().slice(0, 10), daysUntil: days });
      }
    } catch {
      setPeriodError("经期数据加载失败");
    }
  }, []);

  useEffect(() => {
    loadWater();
    loadExercise();
    loadSleep();
    loadStudy();
    loadPeriodPrediction();
  }, [loadWater, loadExercise, loadSleep, loadStudy, loadPeriodPrediction]);

  function updateWater(cups: number) {
    const clamped = Math.max(0, Math.min(8, cups));
    setWaterCups(clamped);
    localStorage.setItem(`water-cups-${getTodayKey()}`, String(clamped));
  }

  function addExercise() {
    const record: ExerciseRecord = {
      id: Date.now().toString(),
      type: newExercise.type,
      duration: newExercise.duration,
      calories: newExercise.calories,
      date: getTodayKey(),
    };
    const updated = [record, ...exerciseRecords];
    setExerciseRecords(updated);
    localStorage.setItem("exercise-records", JSON.stringify(updated));
    setShowAddExercise(false);
    setNewExercise({ type: "跑步", duration: 30, calories: 100 });
  }

  function addSleep() {
    const record: SleepRecord = {
      id: Date.now().toString(),
      bedtime: newSleep.bedtime,
      wakeTime: newSleep.wakeTime,
      quality: newSleep.quality,
      date: getTodayKey(),
    };
    const updated = [record, ...sleepRecords];
    setSleepRecords(updated);
    localStorage.setItem("sleep-records", JSON.stringify(updated));
    setShowAddSleep(false);
    setNewSleep({ bedtime: "23:00", wakeTime: "07:00", quality: "好" });
  }

  function deleteExercise(id: string) {
    const updated = exerciseRecords.filter((r) => r.id !== id);
    setExerciseRecords(updated);
    localStorage.setItem("exercise-records", JSON.stringify(updated));
  }

  function deleteSleep(id: string) {
    const updated = sleepRecords.filter((r) => r.id !== id);
    setSleepRecords(updated);
    localStorage.setItem("sleep-records", JSON.stringify(updated));
  }

  function addStudy() {
    const record: StudyRecord = {
      id: Date.now().toString(),
      subject: newStudy.subject,
      duration: newStudy.duration,
      date: getTodayKey(),
    };
    const updated = [record, ...studyRecords];
    setStudyRecords(updated);
    localStorage.setItem("study-records", JSON.stringify(updated));
    setShowAddStudy(false);
    setNewStudy({ subject: "编程", duration: 60 });
  }

  function deleteStudy(id: string) {
    const updated = studyRecords.filter((r) => r.id !== id);
    setStudyRecords(updated);
    localStorage.setItem("study-records", JSON.stringify(updated));
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'exercise') deleteExercise(deleteTarget.id);
    else if (deleteTarget.type === 'sleep') deleteSleep(deleteTarget.id);
    else if (deleteTarget.type === 'study') deleteStudy(deleteTarget.id);
    setDeleteTarget(null);
  }

  const todayExercises = exerciseRecords.filter((r) => r.date === getTodayKey());
  const todayTotalMinutes = todayExercises.reduce((s, r) => s + r.duration, 0);
  const todayTotalCalories = todayExercises.reduce((s, r) => s + r.calories, 0);

  const weekDates = getWeekDates();
  const weekExerciseData = weekDates.map((date) => {
    const dayRecords = exerciseRecords.filter((r) => r.date === date);
    return { date, minutes: dayRecords.reduce((s, r) => s + r.duration, 0) };
  });
  const maxWeekMinutes = Math.max(...weekExerciseData.map((d) => d.minutes), 1);

  const todaySleep = sleepRecords.find((r) => r.date === getTodayKey());
  const recentSleep = sleepRecords.slice(0, 7);

  const waterProgress = (waterCups / 8) * 100;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "water", label: "💧 喝水" },
    { key: "exercise", label: "🏃 运动" },
    { key: "sleep", label: "😴 睡眠" },
    { key: "study", label: "📚 学习" },
    { key: "period", label: "🌸 经期" },
  ];

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-4xl lg:mx-auto">
      <header className="flex items-center gap-3 mb-5 pt-2 fade-in">
        <Thermometer size={22} className="text-primary" />
        <h1 className="text-xl font-bold lg:text-2xl">健康管理</h1>
      </header>

      <div className="flex gap-2 lg:gap-3 mb-5 overflow-x-auto pb-1 fade-in stagger-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all lg:px-5 lg:py-2.5 lg:text-sm lg:rounded-lg ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "glass-card text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "water" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 lg:p-8 text-center fade-in stagger-2">
            <p className="text-5xl mb-3 lg:text-6xl">💧</p>
            <h2 className="text-3xl font-bold text-primary lg:text-4xl">{waterCups}/8</h2>
            <p className="text-sm text-muted-foreground mt-1">杯水</p>

            <div className="mt-4 w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${waterProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              每日目标 8 杯 · 已完成 {waterProgress.toFixed(0)}%
            </p>

            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateWater(i < waterCups ? i : i + 1)}
                  className={`w-8 h-10 rounded-lg transition-all duration-300 flex items-center justify-center text-xs ${
                    i < waterCups
                      ? "bg-blue-400 text-white scale-105"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  💧
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={() => updateWater(waterCups - 1)}
                className="glass-button-outline px-4 py-2 text-xs flex items-center gap-1"
              >
                <Minus size={14} /> 1 杯
              </button>
              <button
                onClick={() => updateWater(waterCups + 1)}
                className="glass-button px-4 py-2 text-xs flex items-center gap-1"
              >
                <Plus size={14} /> 1 杯
              </button>
            </div>
          </div>

          {waterCups >= 8 && (
            <div className="glass-card p-4 text-center fade-in stagger-3">
              <p className="text-3xl mb-1">🎉</p>
              <p className="text-sm font-bold text-primary">今日喝水目标已达成！</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "exercise" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-5 lg:p-8 text-center fade-in stagger-2">
            <p className="text-5xl mb-3 lg:text-6xl">🏃</p>
            <h2 className="text-3xl font-bold text-primary lg:text-4xl">{todayTotalMinutes}</h2>
            <p className="text-sm text-muted-foreground mt-1">分钟运动</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="glass-card px-3 py-2 text-center lg:px-5 lg:py-3">
                <p className="text-sm font-bold text-orange-500 lg:text-lg">{todayTotalCalories}</p>
                <p className="text-[10px] text-muted-foreground lg:text-xs">千卡</p>
              </div>
              <div className="glass-card px-3 py-2 text-center lg:px-5 lg:py-3">
                <p className="text-sm font-bold text-blue-500 lg:text-lg">{todayExercises.length}</p>
                <p className="text-[10px] text-muted-foreground lg:text-xs">次运动</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddExercise(true)}
            className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2 fade-in stagger-3"
          >
            <Plus size={16} /> 记录运动
          </button>

          {showAddExercise && (
            <div className="glass-card p-4 flex flex-col gap-3 slide-up">
              <div>
                <p className="text-xs text-muted-foreground mb-2">运动类型</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXERCISE_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewExercise({ ...newExercise, type: t })}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        newExercise.type === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {EXERCISE_EMOJIS[t]} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">时长(分钟)</p>
                  <input
                    type="number"
                    value={newExercise.duration || ""}
                    onChange={(e) => setNewExercise({ ...newExercise, duration: Number(e.target.value) })}
                    placeholder="30"
                    className="glass-input px-3 py-2 text-sm w-full"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">消耗(千卡)</p>
                  <input
                    type="number"
                    value={newExercise.calories || ""}
                    onChange={(e) => setNewExercise({ ...newExercise, calories: Number(e.target.value) })}
                    placeholder="100"
                    className="glass-input px-3 py-2 text-sm w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addExercise} className="glass-button flex-1 py-2 text-xs">保存</button>
                <button onClick={() => setShowAddExercise(false)} className="glass-button-outline flex-1 py-2 text-xs">取消</button>
              </div>
            </div>
          )}

          {todayExercises.length > 0 && (
            <div className="glass-card p-4 lg:p-5 fade-in stagger-3">
              <h3 className="text-sm font-bold mb-3 lg:text-base">今日运动</h3>
              <div className="flex flex-col gap-2">
                {todayExercises.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span>{EXERCISE_EMOJIS[r.type] || "🏅"} {r.type}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{r.duration} 分钟</span>
                      <span className="text-orange-500 text-xs">{r.calories} kcal</span>
                      <button onClick={() => setDeleteTarget({type: 'exercise', id: r.id})} className="text-muted-foreground hover:text-red-500 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-4 lg:p-5 fade-in stagger-4">
            <h3 className="text-sm font-bold mb-3 lg:text-base">本周运动</h3>
            <div className="flex items-end gap-1 h-24 lg:h-32">
              {weekExerciseData.map((d, i) => {
                const dayLabel = new Date(d.date).toLocaleDateString("zh-CN", { weekday: "narrow" });
                const height = d.minutes > 0 ? Math.max(8, (d.minutes / maxWeekMinutes) * 100) : 4;
                const isToday = d.date === getTodayKey();
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-muted-foreground">{d.minutes > 0 ? d.minutes : ""}</span>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isToday ? "bg-primary" : d.minutes > 0 ? "bg-primary/40" : "bg-muted"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className={`text-[9px] ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "sleep" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-5 lg:p-8 text-center fade-in stagger-2">
            <p className="text-5xl mb-3 lg:text-6xl">😴</p>
            {todaySleep ? (
              <>
                <h2 className="text-3xl font-bold text-primary">
                  {calcSleepDuration(todaySleep.bedtime, todaySleep.wakeTime)}h
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {todaySleep.bedtime} → {todaySleep.wakeTime}
                </p>
                <div className="mt-2">
                  {SLEEP_QUALITY_OPTIONS.find((q) => q.value === todaySleep.quality)?.emoji}{" "}
                  <span className={SLEEP_QUALITY_OPTIONS.find((q) => q.value === todaySleep.quality)?.color}>
                    睡眠质量{todaySleep.quality}
                  </span>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-muted-foreground">还未记录今日睡眠</h2>
                <p className="text-sm text-muted-foreground mt-1">点击下方按钮记录</p>
              </>
            )}
          </div>

          <button
            onClick={() => setShowAddSleep(true)}
            className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2 fade-in stagger-3"
          >
            <Plus size={16} /> 记录睡眠
          </button>

          {showAddSleep && (
            <div className="glass-card p-4 flex flex-col gap-3 slide-up">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">入睡时间</p>
                  <input
                    type="time"
                    value={newSleep.bedtime}
                    onChange={(e) => setNewSleep({ ...newSleep, bedtime: e.target.value })}
                    className="glass-input px-3 py-2 text-sm w-full"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">起床时间</p>
                  <input
                    type="time"
                    value={newSleep.wakeTime}
                    onChange={(e) => setNewSleep({ ...newSleep, wakeTime: e.target.value })}
                    className="glass-input px-3 py-2 text-sm w-full"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">睡眠质量</p>
                <div className="flex gap-2">
                  {SLEEP_QUALITY_OPTIONS.map((q) => (
                    <button
                      key={q.value}
                      onClick={() => setNewSleep({ ...newSleep, quality: q.value })}
                      className={`flex-1 py-2 rounded-full text-xs font-medium transition-all ${
                        newSleep.quality === q.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {q.emoji} {q.value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addSleep} className="glass-button flex-1 py-2 text-xs">保存</button>
                <button onClick={() => setShowAddSleep(false)} className="glass-button-outline flex-1 py-2 text-xs">取消</button>
              </div>
            </div>
          )}

          {recentSleep.length > 0 && (
            <div className="glass-card p-4 lg:p-5 fade-in stagger-4">
            <h3 className="text-sm font-bold mb-3 lg:text-base">睡眠趋势</h3>
            <div className="flex items-end gap-1 h-24 lg:h-32">
                {recentSleep.slice(0, 7).reverse().map((r, i) => {
                  const hours = calcSleepDuration(r.bedtime, r.wakeTime);
                  const height = Math.max(8, Math.min(100, (hours / 10) * 100));
                  const qualityColor =
                    r.quality === "好" ? "bg-green-400" : r.quality === "一般" ? "bg-yellow-400" : "bg-red-400";
                  const dayLabel = new Date(r.date).toLocaleDateString("zh-CN", { weekday: "narrow" });
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">{hours}h</span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${qualityColor}`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-2 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-green-400" />
                  <span className="text-[9px] text-muted-foreground">好</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-yellow-400" />
                  <span className="text-[9px] text-muted-foreground">一般</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-red-400" />
                  <span className="text-[9px] text-muted-foreground">差</span>
                </div>
              </div>
            </div>
          )}

          {recentSleep.length > 0 && (
            <div className="glass-card p-4 lg:p-5 fade-in stagger-5">
              <h3 className="text-sm font-bold mb-3 lg:text-base">历史记录</h3>
              <div className="flex flex-col gap-2">
                {recentSleep.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                      <span>{r.bedtime} → {r.wakeTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-medium">{calcSleepDuration(r.bedtime, r.wakeTime)}h</span>
                      <span>{SLEEP_QUALITY_OPTIONS.find((q) => q.value === r.quality)?.emoji}</span>
                      <button onClick={() => setDeleteTarget({type: 'sleep', id: r.id})} className="text-muted-foreground hover:text-red-500 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "study" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-5 lg:p-8 text-center fade-in stagger-2">
            <p className="text-5xl mb-3 lg:text-6xl">📚</p>
            <h2 className="text-3xl font-bold text-primary lg:text-4xl">
              {studyRecords.filter((r) => r.date === getTodayKey()).reduce((s, r) => s + r.duration, 0)}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">分钟学习</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="glass-card px-3 py-2 text-center lg:px-5 lg:py-3">
                <p className="text-sm font-bold text-blue-500 lg:text-lg">
                  {studyRecords.filter((r) => r.date === getTodayKey()).length}
                </p>
                <p className="text-[10px] text-muted-foreground lg:text-xs">次学习</p>
              </div>
              <div className="glass-card px-3 py-2 text-center lg:px-5 lg:py-3">
                <p className="text-sm font-bold text-purple-500 lg:text-lg">
                  {weekDates.reduce((s, d) => {
                    return s + studyRecords.filter((r) => r.date === d).reduce((ss, r) => ss + r.duration, 0);
                  }, 0)}
                </p>
                <p className="text-[10px] text-muted-foreground lg:text-xs">本周(分钟)</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddStudy(true)}
            className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2 fade-in stagger-3"
          >
            <Plus size={16} /> 记录学习
          </button>

          {showAddStudy && (
            <div className="glass-card p-4 flex flex-col gap-3 slide-up">
              <div>
                <p className="text-xs text-muted-foreground mb-2">学习科目</p>
                <div className="flex flex-wrap gap-1.5">
                  {STUDY_SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewStudy({ ...newStudy, subject: s })}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        newStudy.subject === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {STUDY_EMOJIS[s]} {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">时长(分钟)</p>
                <input
                  type="number"
                  value={newStudy.duration || ""}
                  onChange={(e) => setNewStudy({ ...newStudy, duration: Number(e.target.value) })}
                  placeholder="60"
                  className="glass-input px-3 py-2 text-sm w-full"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={addStudy} className="glass-button flex-1 py-2 text-xs">保存</button>
                <button onClick={() => setShowAddStudy(false)} className="glass-button-outline flex-1 py-2 text-xs">取消</button>
              </div>
            </div>
          )}

          {studyRecords.filter((r) => r.date === getTodayKey()).length > 0 && (
            <div className="glass-card p-4 lg:p-5 fade-in stagger-3">
              <h3 className="text-sm font-bold mb-3 lg:text-base">今日学习</h3>
              <div className="flex flex-col gap-2">
                {studyRecords.filter((r) => r.date === getTodayKey()).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span>{STUDY_EMOJIS[r.subject] || "✏️"} {r.subject}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{r.duration} 分钟</span>
                      <button onClick={() => setDeleteTarget({type: 'study', id: r.id})} className="text-muted-foreground hover:text-red-500 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-4 lg:p-5 fade-in stagger-4">
            <h3 className="text-sm font-bold mb-3 lg:text-base">本周学习</h3>
            <div className="flex items-end gap-1 h-24 lg:h-32">
              {weekDates.map((date, i) => {
                const dayLabel = new Date(date).toLocaleDateString("zh-CN", { weekday: "narrow" });
                const dayMin = studyRecords.filter((r) => r.date === date).reduce((s, r) => s + r.duration, 0);
                const maxMin = Math.max(...weekDates.map((d) => studyRecords.filter((r) => r.date === d).reduce((s, r) => s + r.duration, 0)), 1);
                const height = dayMin > 0 ? Math.max(8, (dayMin / maxMin) * 100) : 4;
                const isToday = date === getTodayKey();
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-muted-foreground">{dayMin > 0 ? dayMin : ""}</span>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isToday ? "bg-blue-500" : dayMin > 0 ? "bg-blue-500/40" : "bg-muted"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className={`text-[9px] ${isToday ? "text-blue-500 font-bold" : "text-muted-foreground"}`}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "period" && (
        <div className="flex flex-col gap-4">
          {periodError && (
            <div className="glass-card p-3 bg-red-500/10 text-xs text-red-500 fade-in">
              {periodError}
            </div>
          )}
          <Link href="/health/period" className="glass-card p-5 flex items-center gap-4 fade-in stagger-2">
            <p className="text-4xl">🌸</p>
            <div className="flex-1">
              <h2 className="text-lg font-bold">经期管理</h2>
              {periodPrediction.daysUntil !== null ? (
                <p className="text-sm text-muted-foreground mt-0.5">
                  预计下次经期还有 {periodPrediction.daysUntil} 天
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">点击进入详细管理</p>
              )}
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </Link>

          {periodPrediction.daysUntil !== null && (
            <div className="glass-card p-4 fade-in stagger-3">
              <h3 className="text-sm font-bold mb-3">经期预测</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">下次经期</span>
                  <span className="text-primary font-medium">{periodPrediction.nextDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">倒计时</span>
                  <span className="text-primary font-medium">{periodPrediction.daysUntil} 天</span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-4 fade-in stagger-4">
            <h3 className="text-sm font-bold mb-3">健康建议</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>🥗 饮食：多补充铁质和维生素B</p>
              <p>🏃 运动：适度散步，避免剧烈运动</p>
              <p>😌 情绪：保持心情舒畅，适当休息</p>
              <p>🧴 护理：注意保暖，避免生冷食物</p>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center fade-in">
          <div className="glass-card p-6 mx-4 max-w-xs w-full text-center slide-up">
            <p className="text-lg font-bold mb-2">确认删除</p>
            <p className="text-sm text-muted-foreground mb-5">删除后无法恢复，确定要删除吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="glass-button-outline flex-1 py-2 text-sm">取消</button>
              <button onClick={handleConfirmDelete} className="glass-button bg-red-500 text-white flex-1 py-2 text-sm">删除</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
