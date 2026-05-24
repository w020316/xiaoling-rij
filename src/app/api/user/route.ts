import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { nickname: "小林" },
      });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "获取用户失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { nickname: body.nickname || "小林" } });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.nickname !== undefined && { nickname: body.nickname }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
        ...(body.theme !== undefined && { theme: body.theme }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
