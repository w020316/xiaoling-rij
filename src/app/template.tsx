// template.tsx 在每次路由切换时都会重新挂载，适合做整页入场过渡。
// 配合 globals.css 的 .page-enter 动画，实现自然的页面淡入上移效果。
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
