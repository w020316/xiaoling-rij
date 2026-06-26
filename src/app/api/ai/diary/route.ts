import { NextRequest, NextResponse } from "next/server";
import { chatWithDeepSeek } from "@/lib/deepseek";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "content 为必填项" }, { status: 400 });
    }

    // 无 API key 时直接返回原文作为降级
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({
        diary: content,
        moments: "",
        xiaohongshu: "",
        memorial: "",
      });
    }

    try {
      const messages = [
        {
          role: "system",
          content:
            "你是一个温暖的日记助手。用户会给你一段简短的日记内容，你需要扩写成一篇完整、温馨的日记。同时生成一段朋友圈文案和一段小红书文案。以JSON格式返回：{diary: '扩写后的日记', moments: '朋友圈文案', xiaohongshu: '小红书文案', memorial: '纪念文字'}。只返回JSON，不要其他文字。",
        },
        { role: "user", content },
      ];
      const result = await chatWithDeepSeek(messages, { temperature: 0.8, maxTokens: 2000 });
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return NextResponse.json(JSON.parse(jsonMatch[0]));
        }
      } catch { /* 解析失败时使用原文 */ }
      return NextResponse.json({
        diary: result,
        moments: "",
        xiaohongshu: "",
        memorial: "",
      });
    } catch {
      return NextResponse.json(
        { diary: content, moments: "", xiaohongshu: "", memorial: "" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Diary AI error:", error);
    return NextResponse.json(
      { diary: "生成失败，请稍后再试", moments: "", xiaohongshu: "", memorial: "" },
      { status: 200 }
    );
  }
}
