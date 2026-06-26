import { NextResponse } from "next/server";
import { getDailyQuote, getQuoteCount } from "@/lib/quotes";

// 每日一句：优先调用 Hitokoto（一言）免费真实 API，失败时降级到本地语录库
export async function GET() {
  // 尝试从 Hitokoto 获取真实语录（免费、无需 key）
  try {
    const res = await fetch("https://v1.hitokoto.cn/?c=k&c=d&c=i&encode=json", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.hitokoto) {
        return NextResponse.json({
          content: data.hitokoto,
          theme: "life",
          author: data.from_who || data.from || null,
          total: getQuoteCount(),
          source: "hitokoto",
        });
      }
    }
  } catch {
    // 网络失败或超时，降级到本地语录
  }

  // 降级：本地语录库（按日期轮询，保证每天稳定）
  try {
    const quote = getDailyQuote();
    return NextResponse.json({
      content: quote.content,
      theme: quote.theme,
      author: quote.author,
      total: getQuoteCount(),
      source: "local",
    });
  } catch {
    return NextResponse.json({
      content: "心存温柔，山河浪漫。",
      theme: "life",
      author: null,
      total: getQuoteCount(),
      source: "local",
    });
  }
}
