"use client";

const TIME_OFFSET_KEY = "xy_time_offset";

interface StoredTime {
  offset: number;
  timezone: string;
  manualSet: boolean;
}

export function getTimeOffset(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = localStorage.getItem(TIME_OFFSET_KEY);
    if (stored) {
      const data: StoredTime = JSON.parse(stored);
      if (data.manualSet) {
        return data.offset;
      }
    }
  } catch {
    return 0;
  }
  return 0;
}

export function getAdjustedDate(): Date {
  const now = new Date();
  const offset = getTimeOffset();
  if (offset !== 0) {
    return new Date(now.getTime() + offset);
  }
  return now;
}

export function getAdjustedISO(): string {
  return getAdjustedDate().toISOString();
}

export function getAdjustedDateString(): string {
  return getAdjustedDate().toISOString().slice(0, 10);
}

export function getAdjustedTimeString(): string {
  const d = getAdjustedDate();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function getActiveTimezone(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = localStorage.getItem(TIME_OFFSET_KEY);
    if (stored) {
      const data: StoredTime = JSON.parse(stored);
      return data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  } catch {
    // fallback
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function saveTimeSettings(offsetMs: number, timezone: string): void {
  if (typeof window === "undefined") return;
  const data: StoredTime = {
    offset: offsetMs,
    timezone,
    manualSet: offsetMs !== 0,
  };
  localStorage.setItem(TIME_OFFSET_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("time-offset-changed"));
}

export function resetTimeSettings(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TIME_OFFSET_KEY);
  window.dispatchEvent(new Event("time-offset-changed"));
}

export function getStoredTimeInfo(): { offset: number; timezone: string; manualSet: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(TIME_OFFSET_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    return null;
  }
  return null;
}

export const TIMEZONES = [
  { value: "Asia/Shanghai", label: "北京时间 (UTC+8)", offset: 8 * 3600000 },
  { value: "Asia/Tokyo", label: "东京 (UTC+9)", offset: 9 * 3600000 },
  { value: "Asia/Seoul", label: "首尔 (UTC+9)", offset: 9 * 3600000 },
  { value: "Asia/Singapore", label: "新加坡 (UTC+8)", offset: 8 * 3600000 },
  { value: "Asia/Kolkata", label: "印度 (UTC+5:30)", offset: 5.5 * 3600000 },
  { value: "Asia/Dubai", label: "迪拜 (UTC+4)", offset: 4 * 3600000 },
  { value: "Europe/London", label: "伦敦 (UTC+0/+1)", offset: 0 },
  { value: "Europe/Paris", label: "巴黎 (UTC+1/+2)", offset: 1 * 3600000 },
  { value: "Europe/Moscow", label: "莫斯科 (UTC+3)", offset: 3 * 3600000 },
  { value: "America/New_York", label: "纽约 (UTC-5/-4)", offset: -5 * 3600000 },
  { value: "America/Los_Angeles", label: "洛杉矶 (UTC-8/-7)", offset: -8 * 3600000 },
  { value: "America/Chicago", label: "芝加哥 (UTC-6/-5)", offset: -6 * 3600000 },
  { value: "America/Sao_Paulo", label: "圣保罗 (UTC-3)", offset: -3 * 3600000 },
  { value: "Australia/Sydney", label: "悉尼 (UTC+10/+11)", offset: 10 * 3600000 },
  { value: "Pacific/Auckland", label: "奥克兰 (UTC+12/+13)", offset: 12 * 3600000 },
];