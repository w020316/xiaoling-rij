import { NextResponse } from "next/server";
import { getDailyQuote, getQuoteCount } from "@/lib/quotes";

export async function GET() {
  try {
    const quote = getDailyQuote();
    return NextResponse.json({ content: quote.content, theme: quote.theme, author: quote.author, total: getQuoteCount() });
  } catch {
    return NextResponse.json({ content: "心存温柔，山河浪漫。", theme: "life", author: null, total: 100 });
  }
}