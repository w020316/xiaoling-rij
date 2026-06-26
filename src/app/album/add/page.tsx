"use client";

import { useState } from "react";
import { ArrowLeft, Camera, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const photoCategories = [
  { key: "all", label: "全部", emoji: "📷" },
  { key: "couple", label: "情侣", emoji: "💑" },
  { key: "travel", label: "旅行", emoji: "✈️" },
  { key: "study", label: "学习", emoji: "📚" },
  { key: "food", label: "美食", emoji: "🍜" },
  { key: "life", label: "生活", emoji: "🏠" },
];

export default function AddPhotoPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photoTime, setPhotoTime] = useState(() => {
    // datetime-local 需要本地时间，不能用 toISOString（UTC）
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    }
  }

  async function handleUpload() {
    if (!file || loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("photoTime", photoTime);
      formData.append("category", category);

      const response = await fetch("/api/photo", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "上传失败");
      }
      router.push("/album");
    } catch (err: any) { setError(err.message || "上传失败，请重试"); } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center gap-4 mb-5 pt-2">
        <Link href="/album" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">上传照片</h1>
      </header>

      {error && (
        <div className="glass-card p-3 mb-4 bg-red-500/10 flex items-center justify-between fade-in">
          <span className="text-xs text-red-500">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <label className="glass-card p-6 flex flex-col items-center gap-3 cursor-pointer border-dashed border-2 border-primary/30">
          {preview ? (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <>
              <Camera size={40} className="text-primary/50" />
              <p className="text-sm text-muted-foreground">点击选择照片</p>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="写下当时的心情或故事..."
          className="glass-input px-4 py-3 text-sm w-full min-h-[80px] resize-none"
          rows={3}
        />

        <div className="glass-card p-4">
          <h4 className="text-sm font-bold mb-3">分类</h4>
          <div className="flex flex-wrap gap-2">
            {photoCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "glass-card text-muted-foreground"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="📍 位置"
            className="flex-1 glass-input px-4 py-2.5 text-sm"
          />
          <input
            type="datetime-local"
            value={photoTime}
            onChange={(e) => setPhotoTime(e.target.value)}
            className="flex-1 glass-input px-4 py-2.5 text-sm"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="glass-button py-3 text-sm w-full mt-2 disabled:opacity-50"
        >
          {loading ? "上传中..." : "📸 保存照片"}
        </button>
      </div>
    </main>
  );
}
