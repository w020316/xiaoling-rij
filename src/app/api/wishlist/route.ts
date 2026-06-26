import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const couple = await prisma.couple.findFirst();
    if (!couple) return NextResponse.json([]);
    const wishLists = await prisma.wishList.findMany({
      where: { coupleId: couple.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(wishLists);
  } catch (error) {
    console.error("Get wishlists error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "title 为必填项" }, { status: 400 });
    }
    let couple = await prisma.couple.findFirst();
    if (!couple) {
      couple = await prisma.couple.create({
        data: { inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() },
      });
    }
    const wish = await prisma.wishList.create({
      data: {
        title: body.title,
        coupleId: couple.id,
      },
    });
    return NextResponse.json(wish);
  } catch (error) {
    console.error("Create wishlist error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const wish = await prisma.wishList.update({
      where: { id: body.id },
      data: {
        isCompleted: body.isCompleted,
        completedAt: body.isCompleted ? new Date() : null,
      },
    });
    return NextResponse.json(wish);
  } catch (error) {
    console.error("Update wishlist error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
