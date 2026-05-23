import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const diary = await prisma.diary.findUnique({ where: { id } });
    if (!diary) return NextResponse.json({ error: "未找到" }, { status: 404 });
    return NextResponse.json(diary);
  } catch (error) {
    console.error("Get diary error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.diary.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete diary error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
