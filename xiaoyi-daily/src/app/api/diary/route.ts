import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const diaries = await prisma.diary.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(diaries);
  } catch (error) {
    console.error("Get diaries error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
