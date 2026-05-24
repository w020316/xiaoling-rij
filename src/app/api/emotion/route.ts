import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await prisma.emotionRecord.create({
      data: {
        mood: body.mood,
        score: body.score || 5,
        note: body.note || null,
      },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("Create emotion error:", error);
    return NextResponse.json({ error: "记录失败" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "1");
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const records = await prisma.emotionRecord.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });
    if (days === 1) return NextResponse.json(records[0] || null);
    return NextResponse.json(records);
  } catch (error) {
    console.error("Get emotion error:", error);
    return NextResponse.json(null);
  }
}
