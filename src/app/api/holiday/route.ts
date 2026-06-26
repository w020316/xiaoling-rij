import { NextResponse } from "next/server";

// 本地节假日兜底表（法定假日日期，每年元旦固定，其他按常见安排）
// 当第三方 API 不可用时使用，避免日历节假日标识完全失效
const FALLBACK_HOLIDAYS: Record<string, { name: string; holiday: boolean }> = {
  // 元旦（固定）
  "01-01": { name: "元旦", holiday: true },
  // 春节（按 2025-2026 近年常见日期，近似）
  "02-10": { name: "春节", holiday: true },
  "02-11": { name: "春节", holiday: true },
  "02-12": { name: "春节", holiday: true },
  "02-17": { name: "春节", holiday: true }, // 2026
  "02-18": { name: "春节", holiday: true },
  "02-19": { name: "春节", holiday: true },
  // 清明（固定 04-04 至 04-06 附近）
  "04-04": { name: "清明节", holiday: true },
  "04-05": { name: "清明节", holiday: true },
  "04-06": { name: "清明节", holiday: true },
  // 劳动节
  "05-01": { name: "劳动节", holiday: true },
  "05-02": { name: "劳动节", holiday: true },
  "05-03": { name: "劳动节", holiday: true },
  // 端午（近似）
  "06-19": { name: "端午节", holiday: true }, // 2026
  "06-20": { name: "端午节", holiday: true },
  // 中秋（近似）
  "09-25": { name: "中秋节", holiday: true }, // 2026
  // 国庆
  "10-01": { name: "国庆节", holiday: true },
  "10-02": { name: "国庆节", holiday: true },
  "10-03": { name: "国庆节", holiday: true },
  "10-04": { name: "国庆节", holiday: true },
  "10-05": { name: "国庆节", holiday: true },
  "10-06": { name: "国庆节", holiday: true },
  "10-07": { name: "国庆节", holiday: true },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || new Date().getFullYear();
    const month = searchParams.get("month") || (new Date().getMonth() + 1);

    try {
      const res = await fetch(`https://timor.tech/api/holiday/year/${year}-${month}`, {
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.code === 0) {
          return NextResponse.json(data);
        }
      }
      throw new Error("third-party unavailable");
    } catch {
      // 第三方失败时使用本地兜底
      const monthStr = String(month).padStart(2, "0");
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
      const holiday: Record<string, { name: string; holiday: boolean }> = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, "0");
        const key = `${monthStr}-${dayStr}`;
        if (FALLBACK_HOLIDAYS[key]) {
          holiday[String(day)] = FALLBACK_HOLIDAYS[key];
        }
      }
      return NextResponse.json({ code: 0, holiday, source: "fallback" });
    }
  } catch {
    return NextResponse.json({ code: -1, holiday: {} });
  }
}
