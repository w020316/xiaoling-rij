"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, MapPin, CloudSun, Tag, Calendar } from "lucide-react";
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
  diaryType: string;
  aiExpanded: boolean;
  aiContent: string | null;
}

export default function DiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);

  useEffect(() => {
    fetch(`/api/diary/${params.id}`)
      .then((r) => r.json())
      .then(setDiary);
  }, [params.id]);

  async function handleDelete() {
    if (!confirm("确定要删除这篇日记吗？")) return;
    await fetch(`/api/diary/${params.id}`, { method: "DELETE" });
    router.push("/diary");
  }

  if (!diary) {
    return (
      <main className="min-h-screen p-5 pb-28 flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center justify-between mb-5 pt-2">
        <Link href="/diary" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold">日记详情</h1>
        <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-red-500">
          <Trash2 size={20} />
        </button>
      </header>

      <div className="flex flex-col gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">{diary.title || "无标题日记"}</h2>
            {diary.mood && <span className="text-3xl">{diary.mood}</span>}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {new Date(diary.createdAt).toLocaleString()}
            </span>
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
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                  <Tag size={10} /> {tag.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="text-sm leading-relaxed whitespace-pre-wrap">{diary.content}</div>
        </div>

        {diary.aiExpanded && diary.aiContent && (
          <div className="glass-card p-5">
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
