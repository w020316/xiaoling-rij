import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const photo = await prisma.photo.update({
      where: { id },
      data: {
        isFavorite: body.isFavorite,
        description: body.description,
        location: body.location,
        category: body.category,
      },
    });
    return NextResponse.json(photo);
  } catch (error) {
    console.error("Update photo error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.photo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete photo error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
