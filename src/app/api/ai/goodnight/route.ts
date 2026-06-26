import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chatWithDeepSeek } from "@/lib/deepseek";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

// 无 API key 时的本地降级总结
function localGoodnight(doneCount: number, pendingCount: number, todayDiaryContent?: string) {
  let summary = `今天你完成了 ${doneCount} 件事`;
  if (pendingCount > 0) summary += `，还有 ${pendingCount} 件待完成`;
  summary += "。";
  if (todayDiaryContent) summary += ` 今天的心情记录：${todayDiaryContent.slice(0, 80)}`;
  const goodnight = pendingCount > 0
    ? "未完成的事明天再努力，不要给自己太大压力，好好休息吧 🌙"
    : "今天表现很棒，奖励自己一个好梦吧 ✨";
  return {
    summary,
    tomorrow: "明天又是新的一天，继续加油呀 💪",
    goodnight,
  };
}

export async function POST(req: NextRequest) {
  try {
    const today = getTodayStr();
    const todos = await prisma.todo.findMany();
    const doneCount = todos.filter((t: { isDone: boolean }) => t.isDone).length;
    const pendingCount = todos.filter((t: { isDone: boolean }) => !t.isDone).length;
    const todayDiaries = await prisma.diary.findMany({
      where: { createdAt: { gte: new Date(today) } },
      take: 1,
    });
    const todayDiaryContent = todayDiaries[0]?.content;

    // 无 key 时直接返回本地降级
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(localGoodnight(doneCount, pendingCount, todayDiaryContent));
    }

    try {
      const context = `今日完成事项: ${doneCount}个, 待完成: ${pendingCount}个.${todayDiaryContent ? ` 今日日记: ${todayDiaryContent.slice(0, 200)}` : ""}`;
      const reply = await chatWithDeepSeek([
        { role: "system", content: "你是一个温暖的AI伴侣小灵。用户结束了一天的学习生活，请根据TA的完成情况，生成一段100-150字的温暖晚安总结，包含鼓励、安慰和明天的小建议。语气温柔治愈，适当使用emoji。" },
        { role: "user", content: context },
      ], { temperature: 0.8, maxTokens: 300 });
      return NextResponse.json({ reply });
    } catch {
      // AI 调用失败时降级
      return NextResponse.json(localGoodnight(doneCount, pendingCount, todayDiaryContent));
    }
  } catch {
    return NextResponse.json(localGoodnight(0, 0));
  }
}
