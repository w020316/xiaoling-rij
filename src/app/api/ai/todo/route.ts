import { NextRequest, NextResponse } from "next/server";
import { chatWithDeepSeek } from "@/lib/deepseek";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

// 无 key 时的本地任务模板
function localTodoPlan(goal: string) {
  return [
    { title: `${goal} - 制定计划`, description: "明确目标与时间节点", priority: "important", dueOffset: 0 },
    { title: `${goal} - 资料收集`, description: "搜集学习资料与参考", priority: "normal", dueOffset: 1 },
    { title: `${goal} - 每日练习`, description: "坚持每日 30 分钟练习", priority: "normal", dueOffset: 3 },
    { title: `${goal} - 阶段复盘`, description: "回顾进度并调整计划", priority: "important", dueOffset: 7 },
    { title: `${goal} - 完成目标`, description: "达成阶段性成果", priority: "urgent", dueOffset: 14 },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const { goal } = await request.json();
    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return NextResponse.json({ error: "goal 为必填项" }, { status: 400 });
    }

    // 无 API key 时直接返回本地任务模板
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(localTodoPlan(goal));
    }

    try {
      const messages = [
        {
          role: "system",
          content:
            "你是一个学习计划助手。用户会告诉你一个目标，你需要生成一个详细的学习计划，以JSON数组格式返回。每个任务包含title(标题)、description(描述)、priority(优先级: normal/important/urgent)、dueOffset(距今天数)字段。只返回JSON数组，不要其他文字。",
        },
        { role: "user", content: goal },
      ];
      const result = await chatWithDeepSeek(messages, { temperature: 0.6, maxTokens: 2000 });
      try {
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return NextResponse.json(JSON.parse(jsonMatch[0]));
        }
      } catch { /* 解析失败时降级 */ }
      return NextResponse.json(localTodoPlan(goal));
    } catch {
      return NextResponse.json(localTodoPlan(goal), { status: 200 });
    }
  } catch (error) {
    console.error("AI Todo error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
