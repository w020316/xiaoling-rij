import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    const todoCount = await prisma.todo.count();

    if (userCount === 0) {
      await prisma.user.create({
        data: { id: "default-user", nickname: "小林", theme: "theme-kuromi" },
      });
    }

    const couple = await prisma.couple.findFirst();
    if (!couple) {
      await prisma.couple.create({
        data: {
          inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          startDate: new Date("2025-05-12"),
          nickname1: "TA",
          nickname2: "TA",
        },
      });
    }

    return NextResponse.json({
      status: "connected",
      users: userCount,
      todos: todoCount,
      message: "数据库连接成功！",
    });
  } catch (error: unknown) {
    console.error("DB init error:", error);
    // 避免泄露内部 DB 错误信息（连接串/表结构等）
    const isDbUrlMissing = error instanceof Error && /DATABASE_URL|Can't reach database|PrismaClient/i.test(error.message);
    return NextResponse.json(
      {
        status: "error",
        message: isDbUrlMissing
          ? "数据库未初始化，请在 Vercel 环境变量中配置 DATABASE_URL"
          : "数据库连接失败，请检查配置",
      },
      { status: 500 }
    );
  }
}
