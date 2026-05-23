"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookHeart, Images, Bot, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "首页" },
  { href: "/diary", icon: BookHeart, label: "日记" },
  { href: "/album", icon: Images, label: "相册" },
  { href: "/ai", icon: Bot, label: "AI助手" },
  { href: "/profile", icon: User, label: "我的" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
