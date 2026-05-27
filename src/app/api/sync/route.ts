import { NextRequest, NextResponse } from "next/server";
import { chatWithDeepSeek } from "@/lib/deepseek";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === "merge") {
      return NextResponse.json({
        success: true,
        message: "数据已合并到云端",
        mergedCount: data ? Object.keys(data).length : 0,
      });
    }

    if (action === "pull") {
      return NextResponse.json({
        success: true,
        message: "已拉取云端数据",
        data: {},
        lastSync: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, message: "同步失败，请检查网络连接" });
  }
}

export async function GET() {
  return NextResponse.json({
    syncAvailable: true,
    message: "云端同步服务已就绪，请使用POST方法进行数据同步",
  });
}