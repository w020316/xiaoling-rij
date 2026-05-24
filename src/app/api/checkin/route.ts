import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user || !user.lastCheckIn) {
      return NextResponse.json({ checkedIn: false, checkInDays: 0 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDay = new Date(user.lastCheckIn);
    lastDay.setHours(0, 0, 0, 0);
    const checkedIn = lastDay.getTime() === today.getTime();
    return NextResponse.json({ checkedIn, checkInDays: user.checkInDays || 0 });
  } catch (error) {
    console.error("Get checkin status error:", error);
    return NextResponse.json({ checkedIn: false, checkInDays: 0 });
  }
}

export async function POST() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      const newUser = await prisma.user.create({
        data: { nickname: "小林", checkInDays: 1, lastCheckIn: new Date() },
      });
      await prisma.checkIn.create({ data: { type: "daily" } });
      return NextResponse.json({ checkInDays: 1, success: true });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null;
    const lastCheckInDay = lastCheckIn ? new Date(new Date(lastCheckIn).setHours(0, 0, 0, 0)) : null;

    if (lastCheckInDay && lastCheckInDay.getTime() === today.getTime()) {
      return NextResponse.json({ checkInDays: user.checkInDays, success: false, message: "今日已打卡" });
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastCheckInDay && lastCheckInDay.getTime() === yesterday.getTime();

    const newCheckInDays = isConsecutive ? user.checkInDays + 1 : 1;

    await prisma.user.update({
      where: { id: user.id },
      data: { checkInDays: newCheckInDays, lastCheckIn: new Date() },
    });
    await prisma.checkIn.create({ data: { type: "daily", userId: user.id } });

    return NextResponse.json({ checkInDays: newCheckInDays, success: true });
  } catch (error) {
    console.error("Checkin error:", error);
    return NextResponse.json({ error: "打卡失败" }, { status: 500 });
  }
}
