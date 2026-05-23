import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const couple = await prisma.couple.findFirst();
    if (!couple) return NextResponse.json([]);
    const goals = await prisma.savingsGoal.findMany({
      where: { coupleId: couple.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error("Get savings error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let couple = await prisma.couple.findFirst();
    if (!couple) {
      couple = await prisma.couple.create({
        data: { inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() },
      });
    }
    const goal = await prisma.savingsGoal.create({
      data: {
        title: body.title,
        target: body.target || 0,
        current: 0,
        coupleId: couple.id,
      },
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error("Create savings error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const goal = await prisma.savingsGoal.update({
      where: { id: body.id },
      data: { current: body.current },
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error("Update savings error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
