import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(photos);
  } catch (error) {
    console.error("Get photos error:", error);
    return NextResponse.json({ error: "获取照片失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const photoTime = formData.get("photoTime") as string;
    const category = formData.get("category") as string;

    if (!file) {
      return NextResponse.json({ error: "请选择照片" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "照片不能超过5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const photo = await prisma.photo.create({
      data: {
        url: base64,
        description: description || null,
        location: location || null,
        photoTime: photoTime ? new Date(photoTime) : null,
        category: category || "all",
      },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Upload photo error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
