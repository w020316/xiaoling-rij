import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    const messages = [
      {
        role: "system",
        content:
          "你是一个温暖的日记助手。用户会给你一段简短的日记内容，你需要扩写成一篇完整、温馨的日记。同时生成一段朋友圈文案和一段小红书文案。以JSON格式返回：{diary: '扩写后的日记', moments: '朋友圈文案', xiaohongshu: '小红书文案', memorial: '纪念文字'}。只返回JSON，不要其他文字。",
      },
      { role: "user", content },
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
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { diary: content, moments: "", xiaohongshu: "", memorial: "" },
        { status: 200 }
      );
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
    } catch {}

    return NextResponse.json({
      diary: result,
      moments: "",
      xiaohongshu: "",
      memorial: "",
    });
  } catch (error) {
    console.error("Diary AI error:", error);
    return NextResponse.json(
      { diary: "生成失败，请稍后再试", moments: "", xiaohongshu: "", memorial: "" },
      { status: 200 }
    );
  }
}
