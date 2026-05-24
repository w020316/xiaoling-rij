import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { timeStart: "asc" }],
    });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Get schedule error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.timeStart || !body.timeEnd || !body.title) return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    const schedule = await prisma.schedule.create({
      data: {
        timeStart: body.timeStart,
        timeEnd: body.timeEnd,
        title: body.title,
        dayOfWeek: body.dayOfWeek || 1,
        classroom: body.classroom || null,
      },
    });
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Create schedule error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
