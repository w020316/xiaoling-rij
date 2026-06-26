import { NextRequest, NextResponse } from "next/server";
import { getNowWeather, get7DayWeather, searchCity, searchCityByLocation, getWeatherIcon, getTemperatureAdvice } from "@/lib/qweather";
import { chatWithDeepSeek } from "@/lib/deepseek";

async function getIpLocation(req: NextRequest): Promise<{ lat: number; lon: number } | null> {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "";
    if (!ip || ip === "127.0.0.1" || ip === "::1") return null;
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lon: data.longitude };
    }
  } catch {}
  return null;
}

function buildWeatherResult(now: any, locationId: string, city?: string): Record<string, any> {
  const emoji = getWeatherIcon(now.icon);
  const tempNum = parseFloat(now.temp);
  const advice = getTemperatureAdvice(tempNum);
  return {
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
    city: city || "",
    aiTip: `${advice.icon} ${advice.level}天气，${advice.clothing}`,
  };
}

export async function GET(req: NextRequest) {
  try {
    const locationId = req.nextUrl.searchParams.get("locationId") || "";
    const forecast = req.nextUrl.searchParams.get("forecast") === "true";
    const loc = req.nextUrl.searchParams.get("loc") || "";
    const lat = req.nextUrl.searchParams.get("lat") || "";
    const lon = req.nextUrl.searchParams.get("lon") || "";
    const noAi = req.nextUrl.searchParams.get("noAi") === "true";

    if (loc && !locationId) {
      const cities = await searchCity(loc);
      return NextResponse.json({ cities });
    }

    let resolvedLocationId = locationId;
    let resolvedCity = "";

    if (!resolvedLocationId && lat && lon) {
      const cityInfo = await searchCityByLocation(parseFloat(lat), parseFloat(lon));
      if (cityInfo) {
        resolvedLocationId = cityInfo.id;
        resolvedCity = cityInfo.adm1 ? `${cityInfo.name}，${cityInfo.adm1}` : cityInfo.name;
      }
    }

    if (!resolvedLocationId) {
      const ipLoc = await getIpLocation(req);
      if (ipLoc) {
        const cityInfo = await searchCityByLocation(ipLoc.lat, ipLoc.lon);
        if (cityInfo) {
          resolvedLocationId = cityInfo.id;
          resolvedCity = cityInfo.adm1 ? `${cityInfo.name}，${cityInfo.adm1}` : cityInfo.name;
        }
      }
    }

    if (!resolvedLocationId) {
      return NextResponse.json(fallbackWeather());
    }

    const now = await getNowWeather(resolvedLocationId);
    if (!now) {
      return NextResponse.json(fallbackWeather());
    }

    const result = buildWeatherResult(now, resolvedLocationId, resolvedCity);

    if (forecast) {
      const daily = await get7DayWeather(resolvedLocationId);
      result.forecast = daily;
    }

    if (!noAi) {
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
        // AI 调用失败时保留 buildWeatherResult 中已生成的本地 aiTip
      }
    }

    return NextResponse.json(result);
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