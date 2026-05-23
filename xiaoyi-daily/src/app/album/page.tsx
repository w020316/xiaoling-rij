"use client";

import { useState, useEffect } from "react";
import { Images, Plus, Heart, MapPin, Calendar, Search, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Photo {
  id: string;
  url: string;
  description?: string;
  location?: string;
  photoTime?: string;
  category: string;
  aiTags?: string;
  isFavorite: boolean;
  createdAt: string;
}

const photoCategories = [
  { key: "all", label: "全部", emoji: "📷" },
  { key: "couple", label: "情侣", emoji: "💑" },
  { key: "travel", label: "旅行", emoji: "✈️" },
  { key: "study", label: "学习", emoji: "📚" },
  { key: "food", label: "美食", emoji: "🍜" },
  { key: "life", label: "生活", emoji: "🏠" },
  { key: "favorite", label: "收藏", emoji: "⭐" },
];

export default function AlbumPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function fetchPhotos() {
    try {
      const res = await fetch("/api/photo");
      const data = await res.json();
      setPhotos(data);
    } catch {}
  }

  const filteredPhotos = photos.filter((p) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "favorite") return p.isFavorite;
    return p.category === activeCategory;
  });

  const searchFiltered = searchQuery
    ? filteredPhotos.filter(
        (p) =>
          p.description?.includes(searchQuery) ||
          p.location?.includes(searchQuery) ||
          p.aiTags?.includes(searchQuery)
      )
    : filteredPhotos;

  const groupedByMonth = searchFiltered.reduce(
    (groups, photo) => {
      const date = photo.photoTime || photo.createdAt;
      const monthKey = new Date(date).toISOString().slice(0, 7);
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(photo);
      return groups;
    },
    {} as Record<string, Photo[]>
  );

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center justify-between mb-5 pt-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Images size={22} className="text-primary" /> 时光相册
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="glass-card p-2"
          >
            <Search size={18} className="text-muted-foreground" />
          </button>
          <Link
            href="/album/add"
            className="glass-button p-2 rounded-xl"
          >
            <Plus size={18} />
          </Link>
        </div>
      </header>

      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 搜索照片（AI智能搜索）..."
            className="glass-input px-4 py-2.5 text-sm w-full"
          />
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {photoCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.key
                ? "bg-primary text-primary-foreground"
                : "glass-card text-muted-foreground"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode("grid")}
          className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
            viewMode === "grid" ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"
          }`}
        >
          📷 网格
        </button>
        <button
          onClick={() => setViewMode("timeline")}
          className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
            viewMode === "timeline" ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"
          }`}
        >
          🕐 时间轴
        </button>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3">
          {searchFiltered.map((photo) => (
            <div key={photo.id} className="glass-card overflow-hidden">
              <div className="relative aspect-square bg-primary/5">
                <Image
                  src={photo.url}
                  alt={photo.description || "Photo"}
                  fill
                  className="object-cover"
                />
                {photo.isFavorite && (
                  <div className="absolute top-2 right-2 text-red-500 text-sm">
                    <Heart size={16} fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs line-clamp-1">{photo.description || "无描述"}</p>
                {photo.location && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                    <MapPin size={10} /> {photo.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(groupedByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([month, monthPhotos]) => (
              <div key={month}>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  {month}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({monthPhotos.length} 张)
                  </span>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {monthPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-primary/5">
                      <Image
                        src={photo.url}
                        alt={photo.description || "Photo"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {searchFiltered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-sm text-muted-foreground">还没有照片哦</p>
          <p className="text-xs text-muted-foreground mt-1">点击右上角记录美好时光吧！</p>
        </div>
      )}
    </main>
  );
}
