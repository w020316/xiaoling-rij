import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const couple = await prisma.couple.findFirst();
    if (!couple) return NextResponse.json([]);
    const anniversaries = await prisma.anniversary.findMany({
      where: { coupleId: couple.id },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(anniversaries);
  } catch (error) {
    console.error("Get anniversaries error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.date) return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    let couple = await prisma.couple.findFirst();
    if (!couple) {
      couple = await prisma.couple.create({
        data: { inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() },
      });
    }
    const anniversary = await prisma.anniversary.create({
      data: {
        title: body.title,
        date: new Date(body.date),
        remindDays: body.remindDays || 3,
        type: body.type || "custom",
        coupleId: couple.id,
      },
    });
    return NextResponse.json(anniversary);
  } catch (error) {
    console.error("Create anniversary error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少id" }, { status: 400 });
    await prisma.anniversary.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete anniversary error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
