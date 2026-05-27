import { NextRequest, NextResponse } from "next/server";
import { getNowWeather, get7DayWeather, searchCity, getWeatherIcon, getTemperatureAdvice } from "@/lib/qweather";
import { chatWithDeepSeek } from "@/lib/deepseek";

export async function GET(req: NextRequest) {
  try {
    const city = req.nextUrl.searchParams.get("city") || "";
    const locationId = req.nextUrl.searchParams.get("locationId") || "";
    const forecast = req.nextUrl.searchParams.get("forecast") === "true";
    const loc = req.nextUrl.searchParams.get("loc") || "";

    if (loc && !locationId) {
      const cities = await searchCity(loc);
      return NextResponse.json({ cities });
    }

    if (locationId) {
      const now = await getNowWeather(locationId);
      if (!now) {
        const fallback = fallbackWeather();
        return NextResponse.json(fallback);
      }

      const emoji = getWeatherIcon(now.icon);
      const tempNum = parseFloat(now.temp);
      const advice = getTemperatureAdvice(tempNum);

      let result: any = {
        temp: now.temp,
        feelsLike: now.feelsLike,
        desc: now.text,
        emoji,
        icon: now.icon,
        humidity: now.humidity,
        windDir: now.windDir,
        windScale: now.windScale,
        precip: now.precip,
        vis: now.vis,
        pressure: now.pressure,
        advice,
        locationId,
      };

      if (forecast) {
        const daily = await get7DayWeather(locationId);
        result.forecast = daily;
      }

      try {
        const aiSuggestion = await chatWithDeepSeek([
          {
            role: "system",
            content: "你是一个贴心的生活助手。根据当前天气状况，用30字以内的温暖语气给用户一条简短的生活提示（如穿衣、出行建议）。直接回复提示语，不要加引号或其他格式。",
          },
          {
            role: "user",
            content: `当前温度${now.temp}°C，体感${now.feelsLike}°C，天气${now.text}，湿度${now.humidity}%，风向${now.windDir}，风力${now.windScale}级。`,
          },
        ], { temperature: 0.6, maxTokens: 80 });
        result.aiTip = aiSuggestion.trim();
      } catch {
        result.aiTip = `${advice.icon} ${advice.level}天气，${advice.clothing}`;
      }

      return NextResponse.json(result);
    }

    const now = await getNowWeather("101010100");
    if (now) {
      const emoji = getWeatherIcon(now.icon);
      const tempNum = parseFloat(now.temp);
      const advice = getTemperatureAdvice(tempNum);
      return NextResponse.json({
        temp: now.temp,
        feelsLike: now.feelsLike,
        desc: now.text,
        emoji,
        icon: now.icon,
        humidity: now.humidity,
        windDir: now.windDir,
        windScale: now.windScale,
        advice,
        locationId: "101010100",
      });
    }

    return NextResponse.json(fallbackWeather());
  } catch {
    return NextResponse.json(fallbackWeather());
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "search" && body.keyword) {
      const cities = await searchCity(body.keyword);
      return NextResponse.json({ cities });
    }
    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

function fallbackWeather() {
  return {
    temp: "--",
    feelsLike: "--",
    desc: "获取天气失败",
    emoji: "🌤️",
    icon: "999",
    humidity: "--",
    windDir: "--",
    windScale: "--",
    advice: getTemperatureAdvice(20),
  };
}