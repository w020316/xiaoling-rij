"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Download, Upload, Cloud, Clock, Database, FileJson, AlertCircle, CheckCircle2, X } from "lucide-react";
import { exportAllData, importAllData, getSyncStatus } from "@/lib/sync-engine";

export default function SyncPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<{ itemCount: number; dataSize: number; lastSync: string; version: string }>({
    itemCount: 0,
    dataSize: 0,
    lastSync: "从未同步",
    version: "1.0",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStats = useCallback(() => {
    try {
      const s = getSyncStatus();
      setStats({
        itemCount: s.itemCount,
        dataSize: s.dataSize,
        lastSync: s.lastSync || "从未同步",
        version: s.version || "1.0",
      });
    } catch {
      setStats({ itemCount: 0, dataSize: 0, lastSync: "读取失败", version: "1.0" });
    }
  }, []);

  useEffect(() => {
    refreshStats();
    setLoading(false);
  }, [refreshStats]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleExport() {
    try {
      setError(null);
      const jsonStr = exportAllData();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `xiaoyi-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg("数据导出成功！");
    } catch (e) {
      setError(e instanceof Error ? e.message : "导出失败");
    }
  }

  async function handleImport(file: File) {
    try {
      setError(null);
      const text = await file.text();
      const result = importAllData(text);
      refreshStats();
      setSuccessMsg(`导入完成！成功 ${result.imported} 条，跳过 ${result.skipped} 条，冲突 ${result.conflicts} 条`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败，请检查文件格式");
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      setError(null);
      const jsonStr = exportAllData();

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "merge", data: JSON.parse(jsonStr) }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      if (result.success) {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("xy_sync_last", new Date().toISOString());
        }
        refreshStats();
        setSuccessMsg(`同步成功！已合并 ${result.mergedCount || 0} 条数据`);
      } else {
        setError(result.message || "同步失败");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "同步失败，请检查网络连接");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-4xl lg:mx-auto">
        <div className="flex items-center gap-3 mb-5 pt-2">
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton h-6 w-32 rounded-lg" />
        </div>
        <div className="skeleton h-40 rounded-2xl mb-4" />
        <div className="skeleton h-32 rounded-2xl mb-4" />
        <div className="skeleton h-24 rounded-2xl" />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-4xl lg:mx-auto">
      <header className="flex items-center gap-3 mb-5 pt-2">
        <Link href="/couple" className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <Cloud size={22} className="text-primary" />
        <h1 className="text-xl font-bold lg:text-2xl">数据同步</h1>
      </header>

      {error && (
        <div className="glass-card p-3 mb-4 bg-red-500/10 flex items-center justify-between fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <span className="text-xs text-red-500">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="glass-card p-3 mb-4 bg-green-500/10 flex items-center justify-between fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
            <span className="text-xs text-green-600">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="glass-card p-5 lg:p-6">
          <h2 className="text-sm font-bold mb-4 lg:text-base flex items-center gap-2">
            <Database size={18} className="text-primary" />
            数据状态
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <p className="text-lg lg:text-xl mb-0.5">📊</p>
              <p className="text-xs text-muted-foreground">数据条数</p>
              <p className="text-base font-bold text-primary mt-1">{stats.itemCount}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-lg lg:text-xl mb-0.5">📦</p>
              <p className="text-xs text-muted-foreground">数据大小</p>
              <p className="text-base font-bold text-primary mt-1">{formatSize(stats.dataSize)}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={14} className="shrink-0" />
              <span>最后同步：</span>
              <span className="font-medium text-foreground">{stats.lastSync}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileJson size={14} className="shrink-0" />
              <span>数据版本：</span>
              <span className="font-medium text-foreground">{stats.version}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 lg:p-6">
          <h2 className="text-sm font-bold mb-4 lg:text-base flex items-center gap-2">
            <RefreshCw size={18} className="text-primary" />
            同步操作
          </h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="glass-button py-3 text-sm flex items-center justify-center gap-2 w-full"
            >
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? "同步中..." : "手动同步"}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="glass-button-outline py-3 text-sm flex items-center justify-center gap-2"
              >
                <Download size={16} />
                导出数据
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="glass-button-outline py-3 text-sm flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                导入数据
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="glass-card p-5 lg:p-6">
          <h2 className="text-sm font-bold mb-3 lg:text-base flex items-center gap-2">
            <Cloud size={18} className="text-primary" />
            同步说明
          </h2>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>• 导出数据将当前浏览器中的本地数据保存为 JSON 文件</li>
            <li>• 导入数据会将 JSON 文件中的数据写入本地存储</li>
            <li>• 手动同步会将本地数据上传到云端进行合并，防止数据丢失</li>
            <li>• 导入数据可能覆盖现有数据，请谨慎操作</li>
          </ul>
        </div>
      </div>
    </main>
  );
}