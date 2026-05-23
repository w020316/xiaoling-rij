import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(photos);
  } catch (error) {
    console.error("Get photos error:", error);
    return NextResponse.json([], { status: 200 });
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const photo = await prisma.photo.create({
      data: {
        url: `/uploads/${fileName}`,
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
