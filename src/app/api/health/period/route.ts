import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const records = await prisma.periodRecord.findMany({
      orderBy: { startDate: "desc" },
      take: 6,
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("Get period error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.startDate) return NextResponse.json({ error: "缺少startDate字段" }, { status: 400 });
    const record = await prisma.periodRecord.create({
      data: {
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        cycleDays: body.cycleDays || 28,
        symptoms: body.symptoms || null,
        flowLevel: body.flowLevel || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("Create period error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
