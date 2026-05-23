import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [todoCount, diaryCount, photoCount, checkInCount] = await Promise.all([
      prisma.todo.count(),
      prisma.diary.count(),
      prisma.photo.count(),
      prisma.checkIn.count(),
    ]);

    const todayTodos = await prisma.todo.count({
      where: { isDone: false },
    });

    const user = await prisma.user.findFirst();

    return NextResponse.json({
      diaryCount,
      photoCount,
      checkInDays: user?.checkInDays || 0,
      todoCount,
      pendingTodoCount: todayTodos,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({
      diaryCount: 0,
      photoCount: 0,
      checkInDays: 0,
      todoCount: 0,
      pendingTodoCount: 0,
    });
  }
}
