"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, MapPin, CloudSun, Tag, Calendar, Pencil, Save, X, Clock } from "lucide-react";
import Link from "next/link";

interface Diary {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  weather: string | null;
  tags: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  diaryType: string;
  aiExpanded: boolean;
  aiContent: string | null;
}

export default function DiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/diary/${params.id}`)
      .then((r) => r.json())
      .then((data: Diary) => {
        setDiary(data);
        setEditTitle(data.title || "");
        setEditContent(data.content);
      });
  }, [params.id]);

  async function handleSave() {
    if (!diary) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/diary/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      const updated = await res.json();
      setDiary(updated);
      setIsEditing(false);
    } catch {}
    setSaving(false);
  }

  async function handleDelete() {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    await fetch(`/api/diary/${params.id}`, { method: "DELETE" });
    router.push("/diary");
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditTitle(diary?.title || "");
    setEditContent(diary?.content || "");
  }

  if (!diary) {
    return (
      <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </main>
    );
  }

  const createdDate = new Date(diary.createdAt);
  const updatedDate = new Date(diary.updatedAt);
  const isModified = updatedDate.getTime() - createdDate.getTime() > 1000;

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center justify-between mb-5 pt-2 fade-in">
        <Link href="/diary" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold">日记详情</h1>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-muted-foreground hover:text-primary"
            >
              <Pencil size={18} />
            </button>
          )}
          <button
            onClick={handleDelete}
            className={`p-2 transition-colors ${
              showDeleteConfirm ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            }`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {showDeleteConfirm && (
        <div className="glass-card p-4 mb-4 flex items-center justify-between slide-up">
          <p className="text-sm text-red-500">确定要删除这篇日记吗？</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-500 text-white"
            >
              删除
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="glass-button-outline px-3 py-1.5 text-xs"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="glass-card p-5 fade-in stagger-1">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="日记标题"
                className="glass-input px-3 py-2 text-lg font-bold w-full"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="写下你的心情..."
                className="glass-input px-3 py-2 text-sm w-full min-h-[200px] resize-none leading-relaxed"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="glass-button flex-1 py-2 text-xs flex items-center justify-center gap-1"
                >
                  <Save size={14} /> {saving ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="glass-button-outline flex-1 py-2 text-xs flex items-center justify-center gap-1"
                >
                  <X size={14} /> 取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">{diary.title || "无标题日记"}</h2>
                {diary.mood && <span className="text-3xl">{diary.mood}</span>}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {createdDate.toLocaleString()}
                </span>
                {isModified && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> 修改于 {updatedDate.toLocaleString()}
                  </span>
                )}
                {diary.weather && (
                  <span className="flex items-center gap-1">
                    <CloudSun size={12} /> {diary.weather}
                  </span>
                )}
                {diary.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {diary.location}
                  </span>
                )}
              </div>

              {diary.tags && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {diary.tags.split(",").map((tag) => (
                    <span key={tag} className="glass-badge bg-primary/10 text-primary flex items-center gap-1">
                      <Tag size={10} /> {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm leading-relaxed whitespace-pre-wrap">{diary.content}</div>
            </>
          )}
        </div>

        {diary.aiExpanded && diary.aiContent && (
          <div className="glass-card p-5 fade-in stagger-2">
            <h3 className="text-sm font-bold text-primary mb-3">✨ AI 生成内容</h3>
            {(() => {
              try {
                const aiData = JSON.parse(diary.aiContent);
                return (
                  <div className="flex flex-col gap-3">
                    {aiData.moments && (
                      <div>
                        <p className="text-xs font-bold mb-1">💬 朋友圈文案</p>
                        <p className="text-sm text-muted-foreground">{aiData.moments}</p>
                      </div>
                    )}
                    {aiData.xiaohongshu && (
                      <div>
                        <p className="text-xs font-bold mb-1">📕 小红书文案</p>
                        <p className="text-sm text-muted-foreground">{aiData.xiaohongshu}</p>
                      </div>
                    )}
                    {aiData.memorial && (
                      <div>
                        <p className="text-xs font-bold mb-1">💝 纪念文字</p>
                        <p className="text-sm text-muted-foreground">{aiData.memorial}</p>
                      </div>
                    )}
                  </div>
                );
              } catch {
                return <p className="text-sm text-muted-foreground">{diary.aiContent}</p>;
              }
            })()}
          </div>
        )}
      </div>
    </main>
  );
}
