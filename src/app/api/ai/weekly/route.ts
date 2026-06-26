import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chatWithDeepSeek } from "@/lib/deepseek";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

// 无 API key 时的本地降级周报
function localWeekly(emotionCount: number, diaryCount: number, avgScore: number) {
  let summary = `本周记录了 ${emotionCount} 条情绪、${diaryCount} 篇日记。`;
  if (avgScore > 0) {
    if (avgScore >= 7) summary += " 整体情绪积极，状态不错 ✨";
    else if (avgScore >= 5) summary += " 情绪平稳，继续保持 💪";
    else summary += " 本周情绪偏低，记得多照顾自己 🌿";
  }
  return {
    summary,
    highlight: "本周坚持记录生活，本身就是一种成长",
    suggestion: "下周继续保持记录习惯，关注情绪变化",
  };
}

export async function POST(req: NextRequest) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const emotions = await prisma.emotionRecord.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    });
    const diaries = await prisma.diary.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    });

    const avgScore = emotions.length > 0
      ? Math.round(emotions.reduce((s: number, e: { score: number }) => s + e.score, 0) / emotions.length * 10) / 10
      : 0;

    // 无 key 时直接返回本地降级
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(localWeekly(emotions.length, diaries.length, avgScore));
    }

    try {
      const moodSummary = emotions.map((e: { mood: string; score: number }) => `${e.mood}(${e.score}分)`).join(", ") || "暂无记录";
      const diaryTitles = diaries.map((d: { title: string | null }) => d.title || "无标题").slice(0, 5).join("、") || "暂无记录";

      const reply = await chatWithDeepSeek([
        { role: "system", content: "你是一个温暖的AI助手小灵。用户需要一份本周总结。请根据情绪数据和日记，生成一段150字左右的温暖周报，包含本周亮点、情绪分析和下周建议。语气温柔治愈，适当使用emoji。" },
        { role: "user", content: `本周情绪: ${moodSummary}。日记关键词: ${diaryTitles}。` },
      ], { temperature: 0.8, maxTokens: 400 });
      return NextResponse.json({ reply });
    } catch {
      return NextResponse.json(localWeekly(emotions.length, diaries.length, avgScore));
    }
  } catch {
    return NextResponse.json(localWeekly(0, 0, 0));
  }
}
