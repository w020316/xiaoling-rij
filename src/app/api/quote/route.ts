import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个温暖的治愈系文案师。每天生成一句简短的治愈系语录，要求：1.中文 2.20字以内 3.温暖治愈 4.与恋爱/成长/生活相关 5.不要重复常见句子。只输出语录本身，不要加引号或其他格式。" },
          { role: "user", content: `今天是${today}，请生成今日语录` },
        ],
        max_tokens: 50,
        temperature: 0.9,
      }),
    });
    const data = await res.json();
    const quote = data.choices?.[0]?.message?.content?.trim() || "心存温柔，山河浪漫。";
    return NextResponse.json({ content: quote, date: today });
  } catch {
    return NextResponse.json({ content: "心存温柔，山河浪漫。", date: new Date().toISOString().slice(0, 10) });
  }
}
