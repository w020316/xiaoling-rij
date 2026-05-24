import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const anniversary = await prisma.anniversary.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.remindDays !== undefined && { remindDays: body.remindDays }),
        ...(body.type !== undefined && { type: body.type }),
      },
    });
    return NextResponse.json(anniversary);
  } catch (error) {
    console.error("Update anniversary error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.anniversary.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete anniversary error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
