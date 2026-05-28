import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, syncKey, data } = body;

    if (action === "push" && syncKey) {
      let record = await prisma.syncRecord.findUnique({ where: { syncKey } });

      if (record) {
        const existingItems = JSON.parse(record.data || "{}");
        const incomingItems = typeof data === "object" ? data : {};
        const merged = mergeData(existingItems, incomingItems);

        record = await prisma.syncRecord.update({
          where: { syncKey },
          data: {
            data: JSON.stringify(merged),
            version: String(Date.now()),
          },
        });
      } else {
        const items = typeof data === "object" ? data : {};
        record = await prisma.syncRecord.create({
          data: {
            syncKey,
            data: JSON.stringify(items),
            version: String(Date.now()),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "数据已同步到云端",
        version: record.version,
        itemCount: Object.keys(JSON.parse(record.data)).length,
      });
    }

    if (action === "pull" && syncKey) {
      const record = await prisma.syncRecord.findUnique({ where: { syncKey } });

      if (!record) {
        return NextResponse.json({
          success: true,
          message: "云端暂无数据",
          data: {},
          version: "",
          lastSync: null,
        });
      }

      return NextResponse.json({
        success: true,
        message: "已拉取云端数据",
        data: JSON.parse(record.data),
        version: record.version,
        lastSync: record.updatedAt.toISOString(),
      });
    }

    if (action === "merge" && syncKey) {
      let record = await prisma.syncRecord.findUnique({ where: { syncKey } });

      if (record) {
        const existingItems = JSON.parse(record.data || "{}");
        const incomingItems = typeof data === "object" ? data : {};
        const merged = mergeData(existingItems, incomingItems);

        record = await prisma.syncRecord.update({
          where: { syncKey },
          data: {
            data: JSON.stringify(merged),
            version: String(Date.now()),
          },
        });
      } else {
        const items = typeof data === "object" ? data : {};
        record = await prisma.syncRecord.create({
          data: {
            syncKey,
            data: JSON.stringify(items),
            version: String(Date.now()),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "数据已合并到云端",
        mergedCount: data ? Object.keys(data).length : 0,
        version: record.version,
      });
    }

    return NextResponse.json({ error: "未知操作，请提供 action 和 syncKey" }, { status: 400 });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ success: false, message: "同步失败，请检查网络连接" });
  }
}

export async function GET() {
  try {
    const count = await prisma.syncRecord.count();
    return NextResponse.json({
      syncAvailable: true,
      message: "云端同步服务已就绪",
      recordCount: count,
    });
  } catch {
    return NextResponse.json({
      syncAvailable: false,
      message: "同步服务暂不可用",
    });
  }
}

function mergeData(
  existing: Record<string, string>,
  incoming: Record<string, string>
): Record<string, string> {
  const merged: Record<string, string> = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value !== "string") continue;

    const existingValue = merged[key];

    if (!existingValue) {
      merged[key] = value;
      continue;
    }

    if (existingValue === value) {
      continue;
    }

    try {
      const existingParsed = JSON.parse(existingValue);
      const incomingParsed = JSON.parse(value);

      const existingUpdated =
        existingParsed.updatedAt || existingParsed.updated_at || "";
      const incomingUpdated =
        incomingParsed.updatedAt || incomingParsed.updated_at || "";

      if (incomingUpdated && (!existingUpdated || incomingUpdated > existingUpdated)) {
        merged[key] = value;
      } else if (existingUpdated && incomingUpdated && incomingUpdated <= existingUpdated) {
        continue;
      } else {
        if (Array.isArray(existingParsed) && Array.isArray(incomingParsed)) {
          const existingIds = new Set(existingParsed.map((i: any) => i.id));
          const newItems = incomingParsed.filter((i: any) => !existingIds.has(i.id));
          merged[key] = JSON.stringify([...existingParsed, ...newItems]);
        } else {
          merged[key] = value;
        }
      }
    } catch {
      if (value.length > existingValue.length) {
        merged[key] = value;
      }
    }
  }

  return merged;
}
