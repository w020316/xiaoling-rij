"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { getThemeMeta } from "@/lib/themes";

const navItems = [
  { href: "/", label: "首页", emoji: "🏠" },
  { href: "/todo", label: "待办", emoji: "✅" },
  { href: "/diary", label: "日记", emoji: "📔" },
  { href: "/album", label: "相册", emoji: "📸" },
  { href: "/ai", label: "AI助手", emoji: "🤖" },
  { href: "/health", label: "健康", emoji: "💪" },
  { href: "/couple", label: "情侣", emoji: "💑" },
  { href: "/schedule", label: "课程表", emoji: "📅" },
  { href: "/calorie", label: "卡路里", emoji: "🍜" },
  { href: "/profile", label: "我的", emoji: "👤" },
];

export function ResponsiveLayout({ children }: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const themeMeta = getThemeMeta(theme);

  return (
    <div className="min-h-screen">
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col lg:border-r lg:border-border glass z-40">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="gradient-text">💕 小林日记</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">XiaoLin Diary</p>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "text-foreground bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:translate-x-1"
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${themeMeta.color}`}>
              {themeMeta.emoji}
            </div>
            <span className="text-xs text-muted-foreground">当前主题 · {themeMeta.label}</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">v2.4.2 · Made with 💕</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <div className="max-w-md mx-auto lg:max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}
