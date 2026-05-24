import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        ...(body.timeStart !== undefined && { timeStart: body.timeStart }),
        ...(body.timeEnd !== undefined && { timeEnd: body.timeEnd }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.dayOfWeek !== undefined && { dayOfWeek: body.dayOfWeek }),
        ...(body.classroom !== undefined && { classroom: body.classroom }),
      },
    });
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Update schedule error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.schedule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
