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

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await prisma.emotionRecord.findMany({
      where: { createdAt: { gte: today } },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    return NextResponse.json(records[0] || null);
  } catch (error) {
    console.error("Get emotion error:", error);
    return NextResponse.json(null);
  }
}
