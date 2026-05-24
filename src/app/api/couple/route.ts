import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let couple = await prisma.couple.findFirst({
      include: {
        anniversaries: { orderBy: { date: "asc" } },
        wishLists: { orderBy: { createdAt: "desc" } },
        savingsGoals: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!couple) {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      couple = await prisma.couple.create({
        data: { inviteCode },
        include: {
          anniversaries: true,
          wishLists: true,
          savingsGoals: true,
        },
      });
    }
    return NextResponse.json(couple);
  } catch (error) {
    console.error("Get couple error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const couple = await prisma.couple.create({
      data: {
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        nickname1: body.nickname1 || "TA",
        nickname2: body.nickname2 || "TA",
      },
    });
    return NextResponse.json(couple);
  } catch (error) {
    console.error("Create couple error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const couple = await prisma.couple.findFirst();
    if (!couple) return NextResponse.json({ error: "未找到情侣" }, { status: 404 });
    const updated = await prisma.couple.update({
      where: { id: couple.id },
      data: {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        nickname1: body.nickname1,
        nickname2: body.nickname2,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update couple error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
