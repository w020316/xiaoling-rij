export type Theme =
  | "theme-kuromi"
  | "theme-melody"
  | "theme-cinnamoroll"
  | "theme-dark"
  | "theme-matcha"
  | "theme-sunset"
  | "theme-ocean"
  | "theme-rose"
  | "theme-cyber";

export interface ThemeMeta {
  key: Theme;
  label: string;
  emoji: string;
  color: string; // 用于侧边栏指示器背景
}

export const THEMES: ThemeMeta[] = [
  { key: "theme-kuromi", label: "库洛米", emoji: "💜", color: "bg-purple-900" },
  { key: "theme-melody", label: "美乐蒂", emoji: "🎀", color: "bg-pink-300" },
  { key: "theme-cinnamoroll", label: "玉桂狗", emoji: "☁️", color: "bg-blue-200" },
  { key: "theme-dark", label: "暗黑", emoji: "🌙", color: "bg-gray-800" },
  { key: "theme-matcha", label: "抹茶", emoji: "🍵", color: "bg-green-700" },
  { key: "theme-sunset", label: "夕阳", emoji: "🌅", color: "bg-orange-500" },
  { key: "theme-ocean", label: "海洋", emoji: "🌊", color: "bg-cyan-600" },
  { key: "theme-rose", label: "玫瑰金", emoji: "🌹", color: "bg-rose-400" },
  { key: "theme-cyber", label: "赛博朋克", emoji: "⚡", color: "bg-fuchsia-600" },
];

export const DEFAULT_THEME: Theme = "theme-kuromi";

export function getThemeMeta(theme: Theme): ThemeMeta {
  return THEMES.find((t) => t.key === theme) || THEMES[0];
}

// 统一版本号，避免各页面不一致
export const APP_VERSION = "v2.4.2";
