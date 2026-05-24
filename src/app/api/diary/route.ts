import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const diaries = await prisma.diary.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(diaries);
  } catch (error) {
    console.error("Get diaries error:", error);
    return NextResponse.json({ error: "获取日记失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.content) return NextResponse.json({ error: "缺少content字段" }, { status: 400 });
    const diary = await prisma.diary.create({
      data: {
        title: body.title || "无标题日记",
        content: body.content,
        tags: body.tags || null,
        location: body.location || null,
        weather: body.weather || null,
        mood: body.mood || null,
        images: body.images || null,
        diaryType: body.diaryType || "text",
        aiExpanded: body.aiExpanded || false,
        aiContent: body.aiContent || null,
      },
    });
    return NextResponse.json(diary);
  } catch (error) {
    console.error("Create diary error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
