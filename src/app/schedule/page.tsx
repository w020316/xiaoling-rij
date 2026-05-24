"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Plus, Trash2, MapPin, Clock, ChevronDown, ChevronUp, X
} from "lucide-react";

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const DAY_MAP: Record<string, number> = {
  周一: 1, 周二: 2, 周三: 3, 周四: 4,
  周五: 5, 周六: 6, 周日: 7,
};

const DAY_MAP_REVERSE: Record<number, string> = {
  1: "周一", 2: "周二", 3: "周三", 4: "周四",
  5: "周五", 6: "周六", 7: "周日",
};

const COURSE_COLORS = [
  "bg-pink-400", "bg-blue-400", "bg-green-400", "bg-purple-400",
  "bg-orange-400", "bg-cyan-400", "bg-red-400", "bg-indigo-400",
];

interface Course {
  id: string;
  timeStart: string;
  timeEnd: string;
  title: string;
  dayOfWeek: number;
  classroom?: string;
}

export default function SchedulePage() {
  const today = DAY_MAP_REVERSE[new Date().getDay() || 7];
  const [activeDay, setActiveDay] = useState(today);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    dayOfWeek: DAY_MAP[today],
    timeStart: "",
    timeEnd: "",
    classroom: "",
  });

  const fetchCourses = useCallback(async () => {
    const res = await fetch("/api/schedule");
    const data: Course[] = await res.json();
    setCourses(data);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filtered = courses
    .filter((c) => c.dayOfWeek === DAY_MAP[activeDay])
    .sort((a, b) => a.timeStart.localeCompare(b.timeStart));

  async function addCourse() {
    if (!form.title || !form.timeStart || !form.timeEnd) return;
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", dayOfWeek: DAY_MAP[activeDay], timeStart: "", timeEnd: "", classroom: "" });
    setShowForm(false);
    fetchCourses();
  }

  async function deleteCourse(id: string) {
    await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    fetchCourses();
  }

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center gap-3 mb-5 pt-2">
        <BookOpen size={22} className="text-primary" />
        <h1 className="text-xl font-bold">课程表</h1>
      </header>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeDay === day
                ? "bg-primary text-primary-foreground"
                : "glass-card text-muted-foreground"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {filtered.map((course, index) => (
          <div
            key={course.id}
            className="glass-card p-4 flex items-start gap-3 fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${COURSE_COLORS[index % COURSE_COLORS.length]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{course.title}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {course.timeStart} - {course.timeEnd}
                </span>
                {course.classroom && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {course.classroom}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteCourse(course.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50/50 transition-colors shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {filtered.length === 0 && !showForm && (
          <div className="glass-card p-8 text-center fade-in">
            <p className="text-3xl mb-2">📚</p>
            <p className="text-sm text-muted-foreground">今天没有课程，点击下方添加</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="glass-button-outline w-full py-2.5 text-sm flex items-center justify-center gap-2 mb-3"
      >
        {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
        {showForm ? "收起" : "添加课程"}
      </button>

      {showForm && (
        <div className="glass-card p-4 flex flex-col gap-3 slide-up">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="课程名称"
            className="glass-input px-3 py-2 text-sm"
          />
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
            className="glass-input px-3 py-2 text-sm"
          >
            {DAYS.map((day) => (
              <option key={day} value={DAY_MAP[day]}>{day}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={form.timeStart}
              onChange={(e) => setForm({ ...form, timeStart: e.target.value })}
              placeholder="开始时间"
              className="glass-input px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={form.timeEnd}
              onChange={(e) => setForm({ ...form, timeEnd: e.target.value })}
              placeholder="结束时间"
              className="glass-input px-3 py-2 text-sm"
            />
          </div>
          <input
            type="text"
            value={form.classroom}
            onChange={(e) => setForm({ ...form, classroom: e.target.value })}
            placeholder="教室（可选）"
            className="glass-input px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={addCourse} className="glass-button flex-1 py-2 text-xs">添加</button>
            <button onClick={() => setShowForm(false)} className="glass-button-outline flex-1 py-2 text-xs">取消</button>
          </div>
        </div>
      )}
    </main>
  );
}
