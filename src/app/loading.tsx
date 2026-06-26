// 路由级 loading：慢网络下提供轻量骨架，避免白屏
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
