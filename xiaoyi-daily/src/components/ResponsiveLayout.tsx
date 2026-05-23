"use client";
import { ReactNode } from "react";

export function ResponsiveLayout({ children, title, actions }: {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col lg:border-r lg:border-border glass">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">💕 恋爱日常</h1>
          <p className="text-xs text-muted-foreground mt-1">Love Daily AI</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {[
            { href: "/", label: "首页", emoji: "🏠" },
            { href: "/todo", label: "待办", emoji: "✅" },
            { href: "/diary", label: "日记", emoji: "📔" },
            { href: "/album", label: "相册", emoji: "📸" },
            { href: "/ai", label: "AI助手", emoji: "🤖" },
            { href: "/health", label: "健康", emoji: "💪" },
            { href: "/couple", label: "情侣", emoji: "💑" },
            { href: "/schedule", label: "课程表", emoji: "📅" },
            { href: "/profile", label: "我的", emoji: "👤" },
          ].map((item) => (
            <a key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all">
              <span className="text-lg">{item.emoji}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">v2.1.0 · Made with 💕</p>
        </div>
      </aside>

      <main className="lg:pl-64">
        {title && (
          <header className="hidden lg:flex lg:items-center lg:justify-between lg:px-8 lg:py-4 lg:border-b lg:border-border glass">
            <div>{title}</div>
            {actions && <div>{actions}</div>}
          </header>
        )}
        <div className="pb-24 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
