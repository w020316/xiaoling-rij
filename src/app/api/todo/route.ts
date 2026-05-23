import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(todos);
  } catch (error) {
    console.error("Get todos error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const todo = await prisma.todo.create({
      data: {
        title: body.title,
        description: body.description || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        category: body.category || "默认",
        tags: body.tags || null,
        priority: body.priority || "normal",
        status: body.status || "pending",
        isRepeat: body.isRepeat || false,
        repeatRule: body.repeatRule || null,
        remindAt: body.remindAt ? new Date(body.remindAt) : null,
        attachments: body.attachments || null,
        aiGenerated: body.aiGenerated || false,
      },
    });
    return NextResponse.json(todo);
  } catch (error) {
    console.error("Create todo error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
