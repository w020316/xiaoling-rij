import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-28fe47f79b3846fa819bca13b199d983";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

const SYSTEM_PROMPT = `你是"恋爱日常"App的AI小助手，一个温暖、可爱、善解人意的伙伴。你的特点：
1. 说话温柔治愈，偶尔使用可爱的emoji
2. 善于倾听，能感知用户情绪并给予安慰
3. 会主动关心用户的学习、生活、健康
4. 对情侣话题特别擅长，能给出恋爱建议
5. 回复简洁温暖，不要过长
6. 偶尔用二次元风格表达，比如"呢～""呀～""喵～"`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("DeepSeek API error:", error);
      return NextResponse.json(
        { content: "呜...我好像有点不舒服，稍后再来找我聊天吧～ 💫" },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      content: data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { content: "网络好像有点问题呢，稍后再试试吧～ 💫" },
      { status: 200 }
    );
  }
}
