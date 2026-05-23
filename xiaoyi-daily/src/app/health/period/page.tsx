"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  differenceInDays,
  addDays,
  subDays,
  startOfDay,
} from "date-fns";
import {
  Calendar,
  Droplets,
  Heart,
  Brain,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

interface PeriodRecord {
  id: string;
  startDate: string;
  endDate: string | null;
  cycleDays: number;
  symptoms: string | null;
  flowLevel: string | null;
  notes: string | null;
}

const SYMPTOM_OPTIONS = [
  "痛经",
  "头痛",
  "腰酸",
  "情绪波动",
  "腹胀",
  "疲劳",
  "失眠",
  "食欲变化",
];
const FLOW_LEVELS = ["量少", "量中", "量多"];
const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

export default function PeriodPage() {
  const [records, setRecords] = useState<PeriodRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    symptoms: [] as string[],
    flowLevel: "",
    notes: "",
  });
  const [aiAdvice, setAiAdvice] = useState("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch("/api/health/period");
      const data = await res.json();
      setRecords(data);
    } catch {
      setRecords([]);
    }
  }

  async function handleSubmit() {
    if (!formData.startDate) return;

    let cycleDays = 28;
    if (records.length > 0) {
      const lastStart = new Date(records[0].startDate);
      const newStart = new Date(formData.startDate);
      const diff = differenceInDays(newStart, lastStart);
      if (diff > 15 && diff < 50) cycleDays = diff;
    }

    await fetch("/api/health/period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        cycleDays,
        symptoms: formData.symptoms.join(","),
        flowLevel: formData.flowLevel || null,
        notes: formData.notes || null,
      }),
    });

    setShowForm(false);
    setFormData({
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      symptoms: [],
      flowLevel: "",
      notes: "",
    });
    fetchRecords();
  }

  function getCurrentPhase(): string {
    if (!predictions) return "未知";
    const today = startOfDay(new Date());

    for (const record of records) {
      const start = startOfDay(new Date(record.startDate));
      const end = record.endDate
        ? startOfDay(new Date(record.endDate))
        : startOfDay(new Date());
      if (isWithinInterval(today, { start, end })) return "经期";
    }

    if (
      isWithinInterval(today, {
        start: startOfDay(predictions.pmsStart),
        end: startOfDay(subDays(predictions.nextPeriodStart, 1)),
      })
    ) {
      return "经前综合征期";
    }

    if (isSameDay(today, predictions.ovulationDate)) return "排卵日";

    if (
      isWithinInterval(today, {
        start: startOfDay(predictions.fertileStart),
        end: startOfDay(predictions.fertileEnd),
      })
    ) {
      return "易孕期";
    }

    return "安全期";
  }

  async function getAiAdvice() {
    setLoadingAdvice(true);
    const phase = getCurrentPhase();
    const symptomsStr =
      records.length > 0 && records[0].symptoms ? records[0].symptoms : "";
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `我目前处于${phase}阶段${symptomsStr ? `，症状有：${symptomsStr}` : ""}。请给我一些关于经期健康的建议，包括饮食、运动、情绪管理等方面。回复要简洁温暖，用可爱的方式表达。`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiAdvice(data.content);
    } catch {
      setAiAdvice("获取建议失败，请稍后再试～ 💫");
    }
    setLoadingAdvice(false);
  }

  const predictions = useMemo(() => {
    if (records.length === 0) return null;

    const cycleLengths: number[] = [];
    for (let i = 0; i < records.length - 1; i++) {
      const current = new Date(records[i].startDate);
      const next = new Date(records[i + 1].startDate);
      const diff = differenceInDays(current, next);
      if (diff > 15 && diff < 50) cycleLengths.push(diff);
    }

    const avgCycleLength =
      cycleLengths.length > 0
        ? Math.round(
            cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
          )
        : records[0].cycleDays || 28;

    const durations: number[] = [];
    for (const record of records) {
      if (record.endDate) {
        const diff =
          differenceInDays(
            new Date(record.endDate),
            new Date(record.startDate)
          ) + 1;
        if (diff > 0 && diff < 15) durations.push(diff);
      }
    }
    const avgPeriodDuration =
      durations.length > 0
        ? Math.round(
            durations.reduce((a, b) => a + b, 0) / durations.length
          )
        : 5;

    const lastPeriodStart = new Date(records[0].startDate);
    const nextPeriodStart = addDays(lastPeriodStart, avgCycleLength);
    const ovulationDate = subDays(nextPeriodStart, 14);
    const fertileStart = subDays(ovulationDate, 5);
    const fertileEnd = ovulationDate;
    const pmsStart = subDays(nextPeriodStart, 7);

    return {
      avgCycleLength,
      avgPeriodDuration,
      nextPeriodStart,
      ovulationDate,
      fertileStart,
      fertileEnd,
      pmsStart,
      lastPeriodStart,
    };
  }, [records]);

  const currentCycleDay = useMemo(() => {
    if (!predictions) return null;
    const diff =
      differenceInDays(new Date(), predictions.lastPeriodStart) + 1;
    return diff > 0 ? diff : null;
  }, [predictions]);

  const daysUntilNext = useMemo(() => {
    if (!predictions) return null;
    const today = startOfDay(new Date());
    for (const record of records) {
      const start = startOfDay(new Date(record.startDate));
      const end = record.endDate
        ? startOfDay(new Date(record.endDate))
        : startOfDay(new Date());
      if (isWithinInterval(today, { start, end })) return -1;
    }
    return differenceInDays(predictions.nextPeriodStart, new Date());
  }, [predictions, records]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDayOfWeek = getDay(monthStart);

    const padDays: Date[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      padDays.push(addDays(monthStart, -(startDayOfWeek - i)));
    }

    const currentDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const totalCells = 42;
    const remainingCells =
      totalCells - padDays.length - currentDays.length;
    const nextDays: Date[] = [];
    for (let i = 1; i <= remainingCells; i++) {
      nextDays.push(addDays(monthEnd, i));
    }

    return [...padDays, ...currentDays, ...nextDays];
  }, [currentMonth]);

  function getDayTypes(date: Date): string[] {
    const types: string[] = [];
    const day = startOfDay(date);

    for (const record of records) {
      const start = startOfDay(new Date(record.startDate));
      const end = record.endDate
        ? startOfDay(new Date(record.endDate))
        : startOfDay(new Date());
      if (isWithinInterval(day, { start, end })) {
        types.push("period");
      }
    }

    if (predictions) {
      const nextStart = startOfDay(predictions.nextPeriodStart);
      const nextEnd = addDays(nextStart, predictions.avgPeriodDuration - 1);
      if (isWithinInterval(day, { start: nextStart, end: nextEnd })) {
        types.push("predicted");
      }

      if (isSameDay(day, predictions.ovulationDate)) {
        types.push("ovulation");
      }

      if (
        isWithinInterval(day, {
          start: startOfDay(predictions.fertileStart),
          end: startOfDay(predictions.fertileEnd),
        })
      ) {
        types.push("fertile");
      }
    }

    return types;
  }

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center gap-3 mb-5 pt-2 fade-in">
        <Droplets size={22} className="text-primary" />
        <h1 className="text-xl font-bold">生理期追踪</h1>
        {predictions && (
          <span className="glass-badge bg-primary/15 text-primary ml-auto">
            {getCurrentPhase()}
          </span>
        )}
      </header>

      <div className="glass-card p-4 mb-4 fade-in stagger-1">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="glass-button-outline p-1.5 rounded-full"
          >
            <ChevronLeft size={14} />
          </button>
          <h2 className="text-sm font-bold">
            {format(currentMonth, "yyyy年M月")}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="glass-button-outline p-1.5 rounded-full"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEK_DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] text-muted-foreground py-1.5 font-medium"
            >
              {d}
            </div>
          ))}
          {calendarDays.map((date, i) => {
            const inMonth = isSameMonth(date, currentMonth);
            const today = isSameDay(date, new Date());
            const types = getDayTypes(date);

            return (
              <div
                key={i}
                className={`
                  relative aspect-square flex items-center justify-center text-[11px] rounded-lg transition-all
                  ${!inMonth ? "text-muted-foreground/30" : "text-foreground"}
                  ${today ? "ring-2 ring-primary font-bold" : ""}
                  ${
                    types.includes("period")
                      ? "bg-red-400/30 text-red-600 font-medium"
                      : ""
                  }
                  ${
                    types.includes("predicted") && !types.includes("period")
                      ? "bg-red-300/15 border border-dashed border-red-300/30"
                      : ""
                  }
                  ${
                    types.includes("ovulation")
                      ? "bg-blue-400/30 text-blue-600 font-medium"
                      : ""
                  }
                  ${
                    types.includes("fertile") && !types.includes("ovulation")
                      ? "bg-blue-200/15"
                      : ""
                  }
                `}
              >
                {format(date, "d")}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-400/30" />
            <span className="text-[10px] text-muted-foreground">经期</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-300/15 border border-dashed border-red-300/30" />
            <span className="text-[10px] text-muted-foreground">预测</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-400/30" />
            <span className="text-[10px] text-muted-foreground">排卵</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-200/15" />
            <span className="text-[10px] text-muted-foreground">易孕</span>
          </div>
        </div>
      </div>

      {predictions && (
        <div className="glass-card p-4 mb-4 slide-up stagger-2">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Heart size={14} className="text-primary" /> 周期概览
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <p className="text-lg font-bold text-primary">
                {predictions.avgCycleLength}
              </p>
              <p className="text-[10px] text-muted-foreground">
                平均周期(天)
              </p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-lg font-bold text-primary">
                {predictions.avgPeriodDuration}
              </p>
              <p className="text-[10px] text-muted-foreground">
                平均经期(天)
              </p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-lg font-bold text-primary">
                {daysUntilNext === -1
                  ? "🌸"
                  : daysUntilNext !== null
                    ? Math.max(0, daysUntilNext)
                    : "-"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {daysUntilNext === -1 ? "经期中" : "距下次(天)"}
              </p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-lg font-bold text-primary">
                {currentCycleDay ?? "-"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                当前周期日
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        className="glass-button-outline w-full py-2.5 text-sm flex items-center justify-center gap-2 mb-4 slide-up stagger-3"
      >
        <Plus size={16} /> 记录经期
      </button>

      {showForm && (
        <div className="glass-card p-4 mb-4 slide-up">
          <h3 className="text-sm font-bold mb-3">🌸 记录经期</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                开始日期
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="glass-input px-3 py-2 text-sm w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                结束日期
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="glass-input px-3 py-2 text-sm w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                症状
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SYMPTOM_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        symptoms: formData.symptoms.includes(s)
                          ? formData.symptoms.filter((x) => x !== s)
                          : [...formData.symptoms, s],
                      })
                    }
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                      formData.symptoms.includes(s)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                经血量
              </label>
              <div className="flex gap-2">
                {FLOW_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setFormData({ ...formData, flowLevel: level })
                    }
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                      formData.flowLevel === level
                        ? "bg-primary text-primary-foreground"
                        : "glass-card text-muted-foreground"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                备注
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="记录你的感受..."
                className="glass-input px-3 py-2 text-sm w-full h-20 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="glass-button flex-1 py-2 text-xs"
              >
                保存
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="glass-button-outline flex-1 py-2 text-xs"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {predictions && (
        <div className="glass-card p-4 mb-4 slide-up stagger-3">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Brain size={14} className="text-primary" /> AI 预测
          </h3>
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">下次经期</span>
              <span className="text-primary font-medium">
                {format(predictions.nextPeriodStart, "M月d日")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">排卵日</span>
              <span className="text-blue-500 font-medium">
                {format(predictions.ovulationDate, "M月d日")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">易孕窗口</span>
              <span className="text-blue-400 font-medium">
                {format(predictions.fertileStart, "M月d日")} -{" "}
                {format(predictions.fertileEnd, "M月d日")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">PMS 预计</span>
              <span className="text-orange-500 font-medium">
                {format(predictions.pmsStart, "M月d日")}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-4 mb-4 slide-up stagger-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Brain size={14} className="text-primary" /> AI 健康建议
        </h3>
        {aiAdvice ? (
          <>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {aiAdvice}
            </div>
            <button
              onClick={() => setAiAdvice("")}
              className="glass-button-outline w-full py-2 text-xs mt-3"
            >
              重新获取
            </button>
          </>
        ) : (
          <button
            onClick={getAiAdvice}
            disabled={loadingAdvice}
            className="glass-button w-full py-2.5 text-xs disabled:opacity-50"
          >
            {loadingAdvice ? "正在获取建议..." : "获取个性化建议 ✨"}
          </button>
        )}
      </div>

      <div className="slide-up stagger-5">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Calendar size={14} className="text-primary" /> 历史记录
        </h3>
        {records.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-3xl mb-2">🌸</p>
            <p className="text-sm text-muted-foreground">
              还没有记录，点击上方开始记录
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {records.map((record) => (
              <div key={record.id} className="glass-card p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">
                    {format(new Date(record.startDate), "M月d日")}
                    {record.endDate &&
                      ` - ${format(new Date(record.endDate), "M月d日")}`}
                  </span>
                  {record.flowLevel && (
                    <span className="glass-badge bg-primary/15 text-primary">
                      {record.flowLevel}
                    </span>
                  )}
                </div>
                {record.symptoms && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {record.symptoms.split(",").map((s, i) => (
                      <span
                        key={i}
                        className="glass-badge bg-red-400/15 text-red-500"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {record.notes && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {record.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
