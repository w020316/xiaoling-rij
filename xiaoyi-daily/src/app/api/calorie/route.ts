import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await prisma.calorieRecord.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("Get calories error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await prisma.calorieRecord.create({
      data: {
        foodName: body.foodName,
        calories: body.calories || 0,
        protein: body.protein || 0,
        fat: body.fat || 0,
        carbs: body.carbs || 0,
        mealType: body.mealType || "lunch",
      },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("Create calorie error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少id" }, { status: 400 });
    await prisma.calorieRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete calorie error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
