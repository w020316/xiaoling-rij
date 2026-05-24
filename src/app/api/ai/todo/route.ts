import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

export async function POST(request: NextRequest) {
  try {
    const { goal } = await request.json();

    const messages = [
      {
        role: "system",
        content:
          "你是一个学习计划助手。用户会告诉你一个目标，你需要生成一个详细的学习计划，以JSON数组格式返回。每个任务包含title(标题)、description(描述)、priority(优先级: normal/important/urgent)、dueOffset(距今天数)字段。只返回JSON数组，不要其他文字。",
      },
      { role: "user", content: goal },
    ];

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.6,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
    } catch {}

    return NextResponse.json([]);
  } catch (error) {
    console.error("AI Todo error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
