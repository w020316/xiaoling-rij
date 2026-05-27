import { NextRequest, NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/deepseek";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;
    
    if (!image) {
      return NextResponse.json({ error: "请上传食物图片" }, { status: 400 });
    }
    
    const result = await analyzeFoodImage(image);
    
    if (!result) {
      return NextResponse.json({ 
        name: "未能识别", 
        calories: 0, 
        protein: 0, 
        fat: 0, 
        carbs: 0,
        suggestion: "图片识别失败，请重新上传清晰的照片" 
      });
    }
    
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ 
      name: "识别失败", 
      calories: 0, 
      protein: 0, 
      fat: 0, 
      carbs: 0,
      suggestion: "AI识别服务不可用，请稍后重试" 
    });
  }
}