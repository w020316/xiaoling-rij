import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || new Date().getFullYear();
    const month = searchParams.get("month") || (new Date().getMonth() + 1);
    const res = await fetch(`https://timor.tech/api/holiday/year/${year}-${month}`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ code: -1, holiday: {} });
  }
}
