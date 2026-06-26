"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart, BookHeart, Bot, Dumbbell, Calendar, Camera,
  CheckSquare, Star, CloudSun, Sparkles, ExternalLink,
  Palette, Shield, Smartphone, Monitor, Zap, Globe
} from "lucide-react";

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const features = [
  { icon: <CheckSquare size={20} />, title: "智能待办", desc: "AI 驱动的任务管理，自动生成学习计划", color: "text-blue-500 bg-blue-500/10" },
  { icon: <BookHeart size={20} />, title: "心情日记", desc: "记录每一天的情绪与成长，AI 智能扩写", color: "text-pink-500 bg-pink-500/10" },
  { icon: <Camera size={20} />, title: "时光相册", desc: "永久保存甜蜜瞬间，AI 智能搜索照片", color: "text-purple-500 bg-purple-500/10" },
  { icon: <Bot size={20} />, title: "AI 伴侣", desc: "DeepSeek 驱动的智能聊天与晚安总结", color: "text-green-500 bg-green-500/10" },
  { icon: <Dumbbell size={20} />, title: "健康管理", desc: "喝水/运动/睡眠/学习/经期全方位追踪", color: "text-orange-500 bg-orange-500/10" },
  { icon: <Heart size={20} />, title: "情侣空间", desc: "纪念日倒计时、愿望清单、共同存钱", color: "text-red-500 bg-red-500/10" },
  { icon: <Calendar size={20} />, title: "课程表", desc: "每周课程管理，教室信息一目了然", color: "text-cyan-500 bg-cyan-500/10" },
  { icon: <CloudSun size={20} />, title: "天气打卡", desc: "实时天气查询，每日签到打卡", color: "text-yellow-500 bg-yellow-500/10" },
];

const techStack = [
  { name: "Next.js 16", desc: "React 19 全栈框架" },
  { name: "Prisma", desc: "类型安全 ORM" },
  { name: "PostgreSQL", desc: "Neon 云数据库" },
  { name: "DeepSeek AI", desc: "智能对话引擎" },
  { name: "Tailwind CSS 4", desc: "毛玻璃设计系统" },
  { name: "Vercel", desc: "零成本部署" },
];

const themes = [
  { name: "库洛米", emoji: "💜", gradient: "from-purple-900 to-purple-600" },
  { name: "美乐蒂", emoji: "🎀", gradient: "from-pink-300 to-pink-500" },
  { name: "玉桂狗", emoji: "☁️", gradient: "from-blue-200 to-blue-400" },
  { name: "暗黑", emoji: "🌙", gradient: "from-gray-800 to-gray-600" },
];

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <nav className="glass sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💕</span>
            <span className="font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              恋爱日常
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/w020316/xiaoling-rij"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitHubIcon size={16} /> GitHub
            </a>
            <Link
              href="/"
              className="glass-button px-4 py-2 text-sm flex items-center gap-1.5"
            >
              <Zap size={14} /> 开始使用
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass-badge bg-pink-500/10 text-pink-600 mb-6 px-4 py-2 rounded-full text-sm">
            <Sparkles size={14} /> 治愈系 AI 日常管理应用
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              记录每一天的
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 bg-clip-text text-transparent">
              甜蜜与成长
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            管理学习与生活，记录情绪和成长，保存情侣甜蜜回忆。
            AI 驱动的智能伴侣体验，让每一天都充满温暖。
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/" className="glass-button px-8 py-3 text-base flex items-center gap-2">
              <Globe size={18} /> 立即体验
            </Link>
            <a
              href="https://github.com/w020316/xiaoling-rij"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button-outline px-8 py-3 text-base flex items-center gap-2"
            >
              <GitHubIcon size={18} /> 查看源码
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">✨ 核心功能</h2>
          <p className="text-center text-muted-foreground mb-12">8 大功能模块，覆盖日常管理方方面面</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`glass-card p-5 transition-all duration-300 cursor-default ${
                  hoveredFeature === i ? "scale-105 shadow-lg" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-3`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">🎨 四款治愈主题</h2>
          <p className="text-center text-muted-foreground mb-12">三丽鸥风格 × 毛玻璃设计，随心切换</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {themes.map((t) => (
              <div key={t.name} className="glass-card p-5 text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg`}>
                  {t.emoji}
                </div>
                <p className="font-bold text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">🛠️ 技术架构</h2>
          <p className="text-center text-muted-foreground mb-12">现代化全栈技术，零成本部署</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((t) => (
              <div key={t.name} className="glass-card p-4 text-center">
                <p className="font-bold text-sm text-primary">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">📱 双端适配</h2>
          <p className="text-center text-muted-foreground mb-12">移动端底部导航 + 桌面端侧边栏</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 text-center">
              <Smartphone size={40} className="mx-auto text-primary mb-3" />
              <h3 className="font-bold mb-2">移动端</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5 text-left max-w-[200px] mx-auto">
                <li className="flex items-center gap-2"><span>✅</span> 底部导航栏</li>
                <li className="flex items-center gap-2"><span>✅</span> 触摸优化交互</li>
                <li className="flex items-center gap-2"><span>✅</span> 安全区域适配</li>
                <li className="flex items-center gap-2"><span>✅</span> PWA 离线支持</li>
              </ul>
            </div>
            <div className="glass-card p-6 text-center">
              <Monitor size={40} className="mx-auto text-primary mb-3" />
              <h3 className="font-bold mb-2">桌面端</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5 text-left max-w-[200px] mx-auto">
                <li className="flex items-center gap-2"><span>✅</span> 侧边栏导航</li>
                <li className="flex items-center gap-2"><span>✅</span> 宽屏内容适配</li>
                <li className="flex items-center gap-2"><span>✅</span> 键盘快捷操作</li>
                <li className="flex items-center gap-2"><span>✅</span> 悬停交互反馈</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto glass-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">🚀 立即开始</h2>
          <p className="text-muted-foreground mb-6">免费开源，零成本部署，即刻拥有你的治愈系日常管理应用</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/" className="glass-button px-8 py-3 flex items-center gap-2">
              <Globe size={18} /> 在线体验
            </Link>
            <a
              href="https://github.com/w020316/xiaoling-rij"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button-outline px-8 py-3 flex items-center gap-2"
            >
              <ExternalLink size={18} /> GitHub 仓库
            </a>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Shield size={14} /> 安全可靠</span>
            <span className="flex items-center gap-1"><Zap size={14} /> 零成本</span>
            <span className="flex items-center gap-1"><Palette size={14} /> 开源</span>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💕</span>
            <span className="font-bold">恋爱日常</span>
            <span className="text-xs text-muted-foreground">v2.4.2</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="https://github.com/w020316/xiaoling-rij" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
              <GitHubIcon size={14} /> GitHub
            </a>
            <Link href="/" className="hover:text-primary transition-colors">应用首页</Link>
          </div>
          <p className="text-xs text-muted-foreground">Made with 💕 by Love Daily AI</p>
        </div>
      </footer>
    </div>
  );
}
