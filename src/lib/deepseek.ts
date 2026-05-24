const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatWithDeepSeek(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
) {
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("DeepSeek API error:", error);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek chat error:", error);
    throw error;
  }
}

export async function generateTodoPlan(userGoal: string) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "你是一个学习计划助手。用户会告诉你一个目标，你需要生成一个详细的学习计划，以JSON数组格式返回。每个任务包含title(标题)、description(描述)、priority(优先级: normal/important/urgent)、dueOffset(距今天数)字段。只返回JSON数组，不要其他文字。",
    },
    {
      role: "user",
      content: userGoal,
    },
  ];

  const result = await chatWithDeepSeek(messages, { temperature: 0.6 });
  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    return [];
  }
}

export async function expandDiary(briefContent: string) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "你是一个温暖的日记助手。用户会给你一段简短的日记内容，你需要扩写成一篇完整、温馨的日记。同时生成一段朋友圈文案和一段小红书文案。以JSON格式返回：{diary: '扩写后的日记', moments: '朋友圈文案', xiaohongshu: '小红书文案', memorial: '纪念文字'}。只返回JSON，不要其他文字。",
    },
    {
      role: "user",
      content: briefContent,
    },
  ];

  const result = await chatWithDeepSeek(messages, { temperature: 0.8 });
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { diary: result, moments: "", xiaohongshu: "", memorial: "" };
  } catch {
    return { diary: result, moments: "", xiaohongshu: "", memorial: "" };
  }
}

export async function analyzeEmotion(text: string) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "你是一个情感分析助手。分析用户输入的情绪状态，返回JSON：{emotion: '情绪类型', score: 1-10分数, stress: 1-10压力指数, suggestion: '建议', comfort: '安慰的话'}。只返回JSON。",
    },
    {
      role: "user",
      content: text,
    },
  ];

  const result = await chatWithDeepSeek(messages, { temperature: 0.5 });
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { emotion: "平静", score: 5, stress: 3, suggestion: "保持好心情", comfort: "你很棒" };
  } catch {
    return { emotion: "平静", score: 5, stress: 3, suggestion: "保持好心情", comfort: "你很棒" };
  }
}

export async function generateGoodnightSummary(data: {
  completedTodos: number;
  totalTodos: number;
  studyMinutes: number;
  exerciseMinutes: number;
  moodScore: number;
}) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "你是一个温暖的晚安助手。根据用户今天的数据生成一段温馨的晚安总结和明日建议。返回JSON：{summary: '今日总结', tomorrow: '明日建议', goodnight: '晚安寄语'}。只返回JSON。",
    },
    {
      role: "user",
      content: JSON.stringify(data),
    },
  ];

  const result = await chatWithDeepSeek(messages, { temperature: 0.7 });
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { summary: "今天辛苦了", tomorrow: "明天继续加油", goodnight: "晚安，好梦" };
  } catch {
    return { summary: "今天辛苦了", tomorrow: "明天继续加油", goodnight: "晚安，好梦" };
  }
}

export async function analyzeFoodImage(imageBase64: string) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "你是一个食物识别助手。根据图片识别食物，返回JSON：{name: '食物名称', calories: 估算热量, protein: 蛋白质g, fat: 脂肪g, carbs: 碳水g, suggestion: '饮食建议'}。只返回JSON。",
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: imageBase64 },
        },
      ] as any,
    },
  ];

  const result = await chatWithDeepSeek(messages);
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch {
    return null;
  }
}
