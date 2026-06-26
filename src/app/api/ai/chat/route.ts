import { NextRequest, NextResponse } from "next/server";
import { chatWithDeepSeek } from "@/lib/deepseek";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

const SYSTEM_PROMPT = `你是"小林日记"App的AI小助手，一个温暖、可爱、善解人意的伙伴。你的特点：
1. 说话温柔治愈，偶尔使用可爱的emoji
2. 善于倾听，能感知用户情绪并给予安慰
3. 会主动关心用户的学习、生活、健康
4. 对情侣话题特别擅长，能给出恋爱建议
5. 回复简洁温暖，不要过长
6. 偶尔用二次元风格表达，比如"呢～""呀～""喵～"`;

// 无 key 时的本地降级回复
function localReply(messages: { role: string; content: string }[]) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = lastUser?.content || "";
  if (/早安|早上好|早/.test(text)) return "早安呀～新的一天要加油哦 ✨";
  if (/晚安|睡觉|休息/.test(text)) return "晚安～做个好梦，明天继续努力 🌙";
  if (/难过|伤心|哭/.test(text)) return "抱抱你～难过的时候可以哭出来，我在这里陪着你 💕";
  if (/开心|高兴|哈哈/.test(text)) return "看到你开心我也好开心呀～继续保持好心情 🌸";
  if (/学习|作业|考试/.test(text)) return "加油加油！相信你一定能做到的 💪";
  return "我听到啦～谢谢你的分享。虽然我现在没法用 AI 完整回复，但我会一直陪着你呢～ 💫";
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages 必须为数组" }, { status: 400 });
    }

    // 无 API key 时直接本地降级，避免无效网络调用
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ content: localReply(messages) });
    }

    try {
      const apiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      ];
      const content = await chatWithDeepSeek(apiMessages, { temperature: 0.8, maxTokens: 1000 });
      return NextResponse.json({ content });
    } catch {
      return NextResponse.json(
        { content: localReply(messages) },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { content: "网络好像有点问题呢，稍后再试试吧～ 💫" },
      { status: 200 }
    );
  }
}
