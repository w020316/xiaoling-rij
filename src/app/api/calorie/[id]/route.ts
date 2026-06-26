import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await prisma.calorieRecord.update({
      where: { id },
      data: {
        ...(body.foodName !== undefined && { foodName: body.foodName }),
        ...(body.calories !== undefined && { calories: body.calories }),
        ...(body.mealType !== undefined && { mealType: body.mealType }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update calorie error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.calorieRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete calorie error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
