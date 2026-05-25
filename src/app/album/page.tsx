"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Images, Plus, Heart, MapPin, Calendar, Search, Clock,
  X, Trash2, Sparkles, MessageSquare
} from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [lastYearPhoto, setLastYearPhoto] = useState<Photo | null>(null);
  const [hasLastYearPhoto, setHasLastYearPhoto] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
    fetchLastYearPhoto();
  }, []);

  async function fetchPhotos() {
    try {
      const res = await fetch("/api/photo");
      const data = await res.json();
      setPhotos(data);
    } catch { setError("加载失败，请刷新重试"); }
  }

  async function fetchLastYearPhoto() {
    try {
      const now = new Date();
      const lastYear = now.getFullYear() - 1;
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const startStr = `${lastYear}-${month}-${day}T00:00:00`;
      const endStr = `${lastYear}-${month}-${day}T23:59:59`;

      const res = await fetch("/api/photo");
      const allPhotos: Photo[] = await res.json();
      const matched = allPhotos.filter((p) => {
        const d = new Date(p.photoTime || p.createdAt);
        return d.getFullYear() === lastYear &&
          d.getMonth() + 1 === now.getMonth() + 1 &&
          d.getDate() === now.getDate();
      });

      if (matched.length > 0) {
        setLastYearPhoto(matched[Math.floor(Math.random() * matched.length)]);
        setHasLastYearPhoto(true);
      } else {
        setLastYearPhoto(null);
        setHasLastYearPhoto(false);
      }
    } catch {
      setError("加载失败，请刷新重试");
      setHasLastYearPhoto(false);
    }
  }

  const toggleFavorite = useCallback(async (photo: Photo, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch(`/api/photo/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !photo.isFavorite }),
      });
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id ? { ...p, isFavorite: !p.isFavorite } : p
        )
      );
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      }
    } catch { setError("收藏操作失败，请重试"); }
  }, [selectedPhoto]);

  const deletePhoto = useCallback(async (id: string) => {
    try {
      await fetch(`/api/photo/${id}`, { method: "DELETE" });
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      if (selectedPhoto?.id === id) setSelectedPhoto(null);
      setDeleteConfirm(null);
    } catch { setError("删除失败，请重试"); setDeleteConfirm(null); }
  }, [selectedPhoto]);

  async function handleAiSearch() {
    if (!searchQuery.trim()) return;
    setAiSearching(true);
    setAiResult("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `请根据以下描述找出照片分类关键词，只返回一个简短的分类词：${searchQuery}` }],
        }),
      });
      const data = await res.json();
      setAiResult(data.content || data.reply || "暂无结果");
    } catch {
      setError("AI搜索暂时不可用，请稍后再试～");
      setAiResult("AI搜索暂时不可用，请稍后再试～");
    } finally {
      setAiSearching(false);
    }
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

  const heroPhoto = searchFiltered[0];
  const gridPhotos = searchFiltered.slice(1);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const parseTags = (tags?: string) => {
    if (!tags) return [];
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  };

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center justify-between mb-5 pt-2 fade-in">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Images size={22} className="text-primary" /> 时光相册
          <span className="glass-badge bg-primary/15 text-primary ml-1">
            {photos.length} 张
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="glass-card p-2"
          >
            <Search size={18} className="text-muted-foreground" />
          </button>
          <Link href="/album/add" className="glass-button p-2 rounded-xl">
            <Plus size={18} />
          </Link>
        </div>
      </header>

      {error && (
        <div className="glass-card p-3 mb-4 bg-red-500/10 flex items-center justify-between fade-in">
          <span className="text-xs text-red-500">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      {showSearch && (
        <div className="mb-4 slide-up lg:mb-6">
          <div className="flex gap-2 lg:gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setAiResult("");
              }}
              placeholder="🔍 搜索照片（AI智能搜索）..."
              className="glass-input px-4 py-2.5 lg:px-5 lg:py-3 text-sm lg:text-base flex-1"
            />
          </div>
          {searchQuery && searchFiltered.length === 0 && (
            <div className="mt-2">
              <button
                onClick={handleAiSearch}
                disabled={aiSearching}
                className="glass-button px-4 py-2 lg:px-5 lg:py-2.5 text-xs lg:text-sm flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                {aiSearching ? "AI搜索中..." : "AI搜索"}
              </button>
              {aiResult && (
                <div className="glass-card p-3 lg:p-4 mt-2 text-xs lg:text-sm text-muted-foreground flex items-start gap-2">
                  <MessageSquare size={14} className="text-primary shrink-0 mt-0.5" />
                  {aiResult}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="glass-card p-4 mb-4 slide-up relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">
            🕰️
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="glass-badge bg-primary/15 text-primary">
                去年今天
              </span>
              <Sparkles size={12} className="text-primary" />
            </div>
            {hasLastYearPhoto && lastYearPhoto ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary/5 shrink-0 relative">
                  <Image
                    src={lastYearPhoto.url}
                    alt={lastYearPhoto.description || "去年今天"}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {lastYearPhoto.description || "去年今天的美好回忆"}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                去年今天你们还没有照片记录哦～
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 fade-in">
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

      {searchFiltered.length === 0 && (
        <div className="text-center py-12 fade-in">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-sm text-muted-foreground">还没有照片哦</p>
          <p className="text-xs text-muted-foreground mt-1">点击右上角记录美好时光吧！</p>
        </div>
      )}

      {searchFiltered.length > 0 && (
        <>
          {heroPhoto && (
            <div
              className="glass-card overflow-hidden mb-3 slide-up cursor-pointer relative group"
              onClick={() => setSelectedPhoto(heroPhoto)}
            >
              <div className="relative aspect-[16/9] bg-primary/5">
                <Image
                  src={heroPhoto.url}
                  alt={heroPhoto.description || "Photo"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm font-medium line-clamp-1">
                    {heroPhoto.description || "无描述"}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {heroPhoto.location && (
                      <span className="text-white/80 text-[10px] flex items-center gap-0.5">
                        <MapPin size={10} /> {heroPhoto.location}
                      </span>
                    )}
                    <span className="text-white/80 text-[10px] flex items-center gap-0.5">
                      <Calendar size={10} /> {formatDate(heroPhoto.photoTime || heroPhoto.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => toggleFavorite(heroPhoto, e)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center"
                >
                  <Heart
                    size={16}
                    className={heroPhoto.isFavorite ? "text-red-500 fill-red-500" : "text-white"}
                  />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {gridPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                className={`glass-card overflow-hidden scale-in stagger-${Math.min(idx % 5 + 1, 5)} cursor-pointer lg:hover:shadow-lg lg:hover:scale-[1.03] lg:transition-all lg:duration-300`}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative aspect-square bg-primary/5">
                  <Image
                    src={photo.url}
                    alt={photo.description || "Photo"}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={(e) => toggleFavorite(photo, e)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full glass flex items-center justify-center"
                  >
                    <Heart
                      size={14}
                      className={photo.isFavorite ? "text-red-500 fill-red-500" : "text-white/80"}
                    />
                  </button>
                </div>
                <div className="p-2.5">
                  <p className="text-xs line-clamp-1">{photo.description || "无描述"}</p>
                  <div className="flex items-center justify-between mt-1">
                    {photo.location && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin size={10} /> {photo.location}
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(photo.id);
                      }}
                      className="text-muted-foreground hover:text-red-500 transition-colors ml-auto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 scale-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-primary/5">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.description || "Photo"}
                fill
                className="object-cover"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center"
              >
                <X size={18} className="text-white" />
              </button>
              <button
                onClick={(e) => toggleFavorite(selectedPhoto, e)}
                className="absolute top-3 left-3 w-9 h-9 rounded-full glass flex items-center justify-center"
              >
                <Heart
                  size={18}
                  className={selectedPhoto.isFavorite ? "text-red-500 fill-red-500" : "text-white"}
                />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {selectedPhoto.description && (
                <p className="text-sm">{selectedPhoto.description}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {selectedPhoto.location && (
                  <span className="glass-badge bg-primary/10 text-primary flex items-center gap-1">
                    <MapPin size={11} /> {selectedPhoto.location}
                  </span>
                )}
                <span className="glass-badge bg-primary/10 text-primary flex items-center gap-1">
                  <Calendar size={11} /> {formatDate(selectedPhoto.photoTime || selectedPhoto.createdAt)}
                </span>
                <span className="glass-badge bg-primary/10 text-primary flex items-center gap-1">
                  <Clock size={11} /> {new Date(selectedPhoto.photoTime || selectedPhoto.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {parseTags(selectedPhoto.aiTags).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {parseTags(selectedPhoto.aiTags).map((tag) => (
                    <span key={tag} className="glass-badge bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  deletePhoto(selectedPhoto.id);
                  setSelectedPhoto(null);
                }}
                className="w-full glass-button-outline py-2.5 text-sm text-red-500 border-red-500/30 flex items-center justify-center gap-2"
              >
                <Trash2 size={15} /> 删除照片
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center fade-in">
          <div className="glass-card p-6 mx-4 max-w-xs w-full text-center slide-up">
            <p className="text-lg font-bold mb-2">确认删除</p>
            <p className="text-sm text-muted-foreground mb-5">删除后无法恢复，确定要删除吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="glass-button-outline flex-1 py-2 text-sm">取消</button>
              <button onClick={() => deleteConfirm && deletePhoto(deleteConfirm)} className="glass-button bg-red-500 text-white flex-1 py-2 text-sm">删除</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
