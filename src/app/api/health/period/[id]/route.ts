import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const record = await prisma.periodRecord.update({
      where: { id },
      data: {
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.cycleDays !== undefined && { cycleDays: body.cycleDays }),
        ...(body.symptoms !== undefined && { symptoms: body.symptoms }),
      },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("Update period error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.periodRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete period error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
