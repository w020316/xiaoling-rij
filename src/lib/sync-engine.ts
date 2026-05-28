"use client";

const SYNC_VERSION_KEY = "xy_sync_version";
const SYNC_LAST_SYNC_KEY = "xy_sync_last";
const SYNC_KEY_STORAGE = "xy_sync_key";
const SYNC_PREFIXES = ["xy_", "xy_daily_"];

function generateVersion(): string {
  const now = new Date();
  const ts = now.getTime().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getSyncKey(): string {
  if (!isBrowser()) return "";
  try {
    const stored = localStorage.getItem(SYNC_KEY_STORAGE);
    if (stored) return stored;
  } catch {
    return "";
  }
  return "";
}

export function setSyncKey(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SYNC_KEY_STORAGE, key);
  } catch {
    return;
  }
}

export function getLocalSyncVersion(): string {
  if (!isBrowser()) return "";
  try {
    const stored = localStorage.getItem(SYNC_VERSION_KEY);
    if (stored) return stored;
  } catch {
    return "";
  }
  const version = generateVersion();
  try {
    localStorage.setItem(SYNC_VERSION_KEY, version);
  } catch {
    return version;
  }
  return version;
}

export function setLocalSyncVersion(version: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SYNC_VERSION_KEY, version);
  } catch {
    return;
  }
}

function shouldSyncKey(key: string): boolean {
  if (key === SYNC_VERSION_KEY || key === SYNC_LAST_SYNC_KEY || key === SYNC_KEY_STORAGE) {
    return false;
  }
  return SYNC_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function exportAllData(): string {
  if (!isBrowser()) return JSON.stringify({ version: "", items: {} });

  const version = getLocalSyncVersion();
  const items: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && shouldSyncKey(key)) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        items[key] = value;
      }
    }
  }

  const exportData = {
    version,
    exportedAt: new Date().toISOString(),
    items,
  };

  return JSON.stringify(exportData);
}

export function importAllData(jsonStr: string): { imported: number; skipped: number; conflicts: number } {
  const result = { imported: 0, skipped: 0, conflicts: 0 };

  if (!isBrowser()) return result;

  let data: { version: string; exportedAt?: string; items: Record<string, string> };
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return result;
  }

  if (!data || !data.items || typeof data.items !== "object") {
    return result;
  }

  const localVersion = getLocalSyncVersion();
  const incomingVersion = data.version || "";

  for (const [key, value] of Object.entries(data.items)) {
    if (!shouldSyncKey(key) && key !== SYNC_VERSION_KEY && key !== SYNC_LAST_SYNC_KEY) {
      if (!SYNC_PREFIXES.some((p) => key.startsWith(p))) continue;
    }
    if (typeof value !== "string") continue;

    const existingValue = localStorage.getItem(key);

    if (existingValue === null) {
      localStorage.setItem(key, value);
      result.imported++;
    } else if (existingValue === value) {
      result.skipped++;
    } else {
      try {
        const existingParsed = JSON.parse(existingValue);
        const incomingParsed = JSON.parse(value);

        const existingUpdated = existingParsed.updatedAt || existingParsed.updated_at || "";
        const incomingUpdated = incomingParsed.updatedAt || incomingParsed.updated_at || "";

        if (incomingUpdated && (!existingUpdated || incomingUpdated > existingUpdated)) {
          localStorage.setItem(key, value);
          result.imported++;
        } else if (existingUpdated && incomingUpdated && incomingUpdated <= existingUpdated) {
          result.skipped++;
        } else {
          if (Array.isArray(existingParsed) && Array.isArray(incomingParsed)) {
            const existingIds = new Set(existingParsed.map((i: any) => i.id));
            const newItems = incomingParsed.filter((i: any) => !existingIds.has(i.id));
            localStorage.setItem(key, JSON.stringify([...existingParsed, ...newItems]));
            result.imported++;
          } else {
            const merged = { ...existingParsed, ...incomingParsed };
            localStorage.setItem(key, JSON.stringify(merged));
            result.conflicts++;
          }
        }
      } catch {
        if (incomingVersion > localVersion) {
          localStorage.setItem(key, value);
          result.imported++;
        } else {
          result.conflicts++;
        }
      }
    }
  }

  if (result.imported > 0 || result.conflicts > 0) {
    const newVersion = incomingVersion || generateVersion();
    setLocalSyncVersion(newVersion);
  }

  try {
    localStorage.setItem(SYNC_LAST_SYNC_KEY, new Date().toISOString());
  } catch {
    // ignore
  }

  return result;
}

export function getSyncStatus(): { lastSync: string | null; version: string; itemCount: number; dataSize: number } {
  if (!isBrowser()) {
    return { lastSync: null, version: "", itemCount: 0, dataSize: 0 };
  }

  const lastSync = localStorage.getItem(SYNC_LAST_SYNC_KEY) || null;
  const version = getLocalSyncVersion();

  let itemCount = 0;
  let dataSize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && shouldSyncKey(key)) {
      itemCount++;
      const value = localStorage.getItem(key);
      if (value !== null) {
        dataSize += value.length;
      }
    }
  }

  return { lastSync, version, itemCount, dataSize };
}

export async function cloudSync(direction: "push" | "pull" | "merge" = "merge"): Promise<{
  success: boolean;
  message: string;
  imported?: number;
  skipped?: number;
  conflicts?: number;
}> {
  if (!isBrowser()) {
    return { success: false, message: "浏览器环境不可用" };
  }

  const syncKey = getSyncKey();
  if (!syncKey) {
    return { success: false, message: "请先设置同步密钥" };
  }

  try {
    if (direction === "push" || direction === "merge") {
      const jsonStr = exportAllData();
      const parsed = JSON.parse(jsonStr);

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: direction,
          syncKey,
          data: parsed.items,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (!result.success) {
        return { success: false, message: result.message || "同步失败" };
      }
    }

    if (direction === "pull" || direction === "merge") {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pull", syncKey }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (result.data && Object.keys(result.data).length > 0) {
        const importResult = importAllData(
          JSON.stringify({
            version: result.version || "",
            items: result.data,
          })
        );

        return {
          success: true,
          message: `同步完成！导入 ${importResult.imported} 条，跳过 ${importResult.skipped} 条，冲突 ${importResult.conflicts} 条`,
          imported: importResult.imported,
          skipped: importResult.skipped,
          conflicts: importResult.conflicts,
        };
      }
    }

    try {
      localStorage.setItem(SYNC_LAST_SYNC_KEY, new Date().toISOString());
    } catch {
      // ignore
    }

    return { success: true, message: "同步完成" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "同步失败，请检查网络连接",
    };
  }
}
