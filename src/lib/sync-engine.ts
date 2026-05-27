"use client";

const SYNC_VERSION_KEY = "xy_sync_version";
const SYNC_LAST_SYNC_KEY = "xy_sync_last";
const SYNC_PREFIX = "xy_";

function generateVersion(): string {
  const now = new Date();
  const ts = now.getTime().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
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

export function exportAllData(): string {
  if (!isBrowser()) return JSON.stringify({ version: "", items: {} });

  const version = getLocalSyncVersion();
  const items: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(SYNC_PREFIX) && key !== SYNC_VERSION_KEY && key !== SYNC_LAST_SYNC_KEY) {
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
    if (key === SYNC_VERSION_KEY || key === SYNC_LAST_SYNC_KEY) continue;
    if (!key.startsWith(SYNC_PREFIX)) continue;
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
          const merged = { ...existingParsed, ...incomingParsed };
          localStorage.setItem(key, JSON.stringify(merged));
          result.conflicts++;
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
    if (key && key.startsWith(SYNC_PREFIX)) {
      itemCount++;
      const value = localStorage.getItem(key);
      if (value !== null) {
        dataSize += value.length;
      }
    }
  }

  return { lastSync, version, itemCount, dataSize };
}