"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookHeart, Images, Bot, CheckSquare, MoreHorizontal, X } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "首页" },
  { href: "/todo", icon: CheckSquare, label: "待办" },
  { href: "/diary", icon: BookHeart, label: "日记" },
  { href: "/album", icon: Images, label: "相册" },
  { href: "/ai", icon: Bot, label: "AI" },
];

const moreItems = [
  { href: "/health", label: "健康", emoji: "💪" },
  { href: "/couple", label: "情侣", emoji: "💑" },
  { href: "/schedule", label: "课程表", emoji: "📅" },
  { href: "/calorie", label: "卡路里", emoji: "🍜" },
  { href: "/weather", label: "天气", emoji: "🌤️" },
  { href: "/profile", label: "我的", emoji: "👤" },
  { href: "/settings", label: "设置", emoji: "⚙️" },
  { href: "/admin", label: "管理后台", emoji: "🛠️" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // 路由切换时关闭更多菜单
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // 锁定背景滚动
  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [moreOpen]);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav">
        <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 ease-out ${
                  isActive
                    ? "text-primary scale-110"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="transition-all duration-200" />
                <span className={`text-[10px] transition-all duration-200 ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
                <div className={`w-1 h-1 rounded-full bg-primary mt-0.5 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`} />
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 ${
              moreOpen ? "text-primary scale-110" : "text-muted-foreground active:scale-95"
            }`}
          >
            <MoreHorizontal size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">更多</span>
          </button>
        </div>
      </nav>

      {/* 更多菜单 - 滑出底部 Sheet */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm fade-in"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 glass-nav rounded-t-3xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "70vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">更多功能</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {moreItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 ${
                      isActive ? "bg-primary/10 ring-2 ring-primary/40" : "bg-muted/40"
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className={`text-[10px] ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
