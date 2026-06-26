import { NextRequest, NextResponse } from "next/server";
import { chatWithDeepSeek } from "@/lib/deepseek";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { totalCalories, totalProtein, totalFat, totalCarbs, records } = body;

    const calorieAdvice = totalCalories > 2500
      ? "今日热量摄入偏高，建议明天适当控制。"
      : totalCalories < 1200
        ? "今日热量摄入偏少，记得均衡饮食。"
        : "今日热量摄入适中，继续保持。";

    // 无 key 时直接返回本地建议，避免无效请求
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({
        suggestion: calorieAdvice,
        dailyTarget: 2000,
        calorieAdvice,
      });
    }

    const foodList = (records || []).map((r: any) => r.foodName).join("、");

    const aiResult = await chatWithDeepSeek([
      {
        role: "system",
        content: "你是一个专业营养师。根据用户今日的饮食记录，给出温暖简短的饮食建议（50字以内），包含当前饮食评价和改进建议。直接回复建议内容。",
      },
      {
        role: "user",
        content: `今日摄入：热量${totalCalories || 0}kcal，蛋白质${totalProtein || 0}g，脂肪${totalFat || 0}g，碳水${totalCarbs || 0}g。食物：${foodList || "暂无记录"}。`,
      },
    ], { temperature: 0.6, maxTokens: 150 });

    return NextResponse.json({
      suggestion: aiResult?.trim() || calorieAdvice,
      dailyTarget: 2000,
      calorieAdvice,
    });
  } catch {
    return NextResponse.json({
      suggestion: "保持均衡饮食，多吃蔬菜水果哦。",
      dailyTarget: 2000,
      calorieAdvice: "无法获取AI建议",
    });
  }
}