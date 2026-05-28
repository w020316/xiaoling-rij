"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Download, Upload, Cloud, Clock, Database, FileJson, AlertCircle, CheckCircle2, X, Key, ArrowUpDown, CloudUpload, CloudDownload } from "lucide-react";
import { exportAllData, importAllData, getSyncStatus, getSyncKey, setSyncKey, cloudSync } from "@/lib/sync-engine";

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
  const [syncKeyInput, setSyncKeyInput] = useState("");
  const [currentSyncKey, setCurrentSyncKey] = useState("");
  const [showKeySetup, setShowKeySetup] = useState(false);
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
    const key = getSyncKey();
    setCurrentSyncKey(key);
    setSyncKeyInput(key);
    if (!key) setShowKeySetup(true);
    setLoading(false);
  }, [refreshStats]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
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

  async function handleCloudSync(direction: "push" | "pull" | "merge") {
    const key = getSyncKey();
    if (!key) {
      setError("请先设置同步密钥");
      setShowKeySetup(true);
      return;
    }

    try {
      setSyncing(true);
      setError(null);
      const result = await cloudSync(direction);
      if (result.success) {
        refreshStats();
        setSuccessMsg(result.message);
      } else {
        setError(result.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "同步失败，请检查网络连接");
    } finally {
      setSyncing(false);
    }
  }

  function handleSaveKey() {
    if (!syncKeyInput.trim()) {
      setError("同步密钥不能为空");
      return;
    }
    setSyncKey(syncKeyInput.trim());
    setCurrentSyncKey(syncKeyInput.trim());
    setShowKeySetup(false);
    setSuccessMsg("同步密钥已保存！在另一台设备上输入相同密钥即可同步");
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
            <Key size={18} className="text-primary" />
            同步密钥
          </h2>
          {currentSyncKey && !showKeySetup ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 glass-input px-4 py-2.5 text-sm font-mono text-center text-primary">
                {currentSyncKey}
              </div>
              <button
                onClick={() => setShowKeySetup(true)}
                className="glass-button px-4 py-2.5 text-xs"
              >
                修改
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                设置一个同步密钥，在两台设备上输入相同密钥即可同步数据。建议使用情侣邀请码作为密钥。
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={syncKeyInput}
                  onChange={(e) => setSyncKeyInput(e.target.value)}
                  placeholder="输入同步密钥..."
                  className="flex-1 glass-input px-3 py-2.5 text-sm"
                />
                <button onClick={handleSaveKey} className="glass-button px-4 py-2.5 text-xs">
                  保存
                </button>
                {currentSyncKey && (
                  <button onClick={() => setShowKeySetup(false)} className="glass-button-outline px-4 py-2.5 text-xs">
                    取消
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

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
            云端同步
          </h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleCloudSync("merge")}
              disabled={syncing || !currentSyncKey}
              className="glass-button py-3 text-sm flex items-center justify-center gap-2 w-full disabled:opacity-50"
            >
              <ArrowUpDown size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? "同步中..." : "双向同步（推荐）"}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCloudSync("push")}
                disabled={syncing || !currentSyncKey}
                className="glass-button-outline py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CloudUpload size={16} />
                推送到云端
              </button>

              <button
                onClick={() => handleCloudSync("pull")}
                disabled={syncing || !currentSyncKey}
                className="glass-button-outline py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CloudDownload size={16} />
                从云端拉取
              </button>
            </div>

            {!currentSyncKey && (
              <p className="text-xs text-amber-500 text-center">请先设置同步密钥才能使用云端同步</p>
            )}
          </div>
        </div>

        <div className="glass-card p-5 lg:p-6">
          <h2 className="text-sm font-bold mb-4 lg:text-base flex items-center gap-2">
            <FileJson size={18} className="text-primary" />
            本地备份
          </h2>
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

        <div className="glass-card p-5 lg:p-6">
          <h2 className="text-sm font-bold mb-3 lg:text-base flex items-center gap-2">
            <Cloud size={18} className="text-primary" />
            同步说明
          </h2>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>• 在两台设备上设置相同的同步密钥，即可实现数据同步</li>
            <li>• 双向同步：将本地数据推送到云端，同时拉取云端数据到本地</li>
            <li>• 推送到云端：仅将本地数据上传，不拉取云端数据</li>
            <li>• 从云端拉取：仅将云端数据下载到本地，不上传本地数据</li>
            <li>• 冲突数据会根据更新时间自动合并，较新的数据优先</li>
            <li>• 导出/导入适合离线场景，可手动传输 JSON 文件</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
