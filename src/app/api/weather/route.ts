import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentWeather,
  get7DayForecast,
  searchCityByKeyword,
  reverseGeocode,
  getTemperatureAdvice,
} from "@/lib/open-meteo";
import { chatWithDeepSeek } from "@/lib/deepseek";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

interface WeatherQuery {
  lat?: number;
  lon?: number;
  locationId?: string;
  loc?: string;
  forecast?: boolean;
  noAi?: boolean;
}

// 解析 locationId "lat,lon" 格式
function parseLocationId(id: string): { lat: number; lon: number } | null {
  const parts = id.split(",");
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
  }
  return null;
}

function buildWeatherResult(current: any, city?: string, locationId?: string): Record<string, any> {
  const tempNum = parseInt(current.temp);
  const advice = getTemperatureAdvice(tempNum);
  return {
    temp: current.temp,
    feelsLike: current.feelsLike,
    desc: current.desc,
    emoji: current.emoji,
    icon: current.icon,
    humidity: current.humidity,
    windDir: current.windDir,
    windScale: current.windScale,
    precip: current.precip,
    vis: current.vis,
    pressure: current.pressure,
    cloud: current.cloud,
    uvIndex: current.uvIndex,
    isDay: current.isDay,
    advice,
    locationId: locationId || "",
    city: city || "",
    aiTip: `${advice.icon} ${advice.level}天气，${advice.clothing}`,
  };
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

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const query: WeatherQuery = {
      lat: sp.get("lat") ? parseFloat(sp.get("lat")!) : undefined,
      lon: sp.get("lon") ? parseFloat(sp.get("lon")!) : undefined,
      locationId: sp.get("locationId") || undefined,
      loc: sp.get("loc") || undefined,
      forecast: sp.get("forecast") === "true",
      noAi: sp.get("noAi") === "true",
    };

    // 城市搜索
    if (query.loc) {
      const cities = await searchCityByKeyword(query.loc);
      return NextResponse.json({ cities });
    }

    // 确定经纬度
    let lat: number | undefined = query.lat;
    let lon: number | undefined = query.lon;
    let city = "";

    // 从 locationId 解析经纬度
    if (!lat || !lon) {
      if (query.locationId) {
        const parsed = parseLocationId(query.locationId);
        if (parsed) {
          lat = parsed.lat;
          lon = parsed.lon;
        }
      }
    }

    // 没有经纬度，尝试 IP 定位
    if ((!lat || !lon) && !query.locationId) {
      const ipLoc = await getIpLocation(req);
      if (ipLoc) {
        lat = ipLoc.lat;
        lon = ipLoc.lon;
      }
    }

    if (!lat || !lon) {
      return NextResponse.json(fallbackWeather());
    }

    // 并行化：逆向地理编码 + 当前天气 + 7天预报 同时发起，显著降低总耗时
    const [geo, current, daily] = await Promise.all([
      reverseGeocode(lat, lon).catch(() => null),
      getCurrentWeather(lat, lon).catch(() => null),
      query.forecast ? get7DayForecast(lat, lon).catch(() => null) : Promise.resolve(null),
    ]);

    if (geo && !city) {
      city = geo.adm1 ? `${geo.name}，${geo.adm1}` : geo.name;
      if (!query.locationId) {
        query.locationId = geo.id;
      }
    }

    if (!current) {
      console.error("[weather] getCurrentWeather returned null for", lat, lon);
      return NextResponse.json(fallbackWeather());
    }

    const result = buildWeatherResult(current, city, query.locationId);

    if (query.forecast && daily) {
      result.forecast = daily;
    }

    // AI 提示（可选）：非阻塞，用 Promise.race 限时 6s，超时则保留本地 aiTip
    if (!query.noAi && DEEPSEEK_API_KEY) {
      try {
        const aiPromise = chatWithDeepSeek([
          {
            role: "system",
            content: "你是一个贴心的生活助手。根据当前天气状况，用30字以内的温暖语气给用户一条简短的生活提示。直接回复提示语。",
          },
          {
            role: "user",
            content: `当前温度${current.temp}°C，体感${current.feelsLike}°C，天气${current.desc}，湿度${current.humidity}%，${current.windDir}风${current.windScale}级。`,
          },
        ], { temperature: 0.6, maxTokens: 80 });

        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("AI timeout")), 6000)
        );

        const aiSuggestion = await Promise.race([aiPromise, timeoutPromise]);
        result.aiTip = aiSuggestion.trim();
      } catch (aiErr) {
        // AI 超时或失败不阻塞天气主数据，保留本地 aiTip
        console.warn("[weather] AI tip skipped:", aiErr instanceof Error ? aiErr.message : aiErr);
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[weather] GET failed:", e);
    return NextResponse.json(fallbackWeather());
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "search" && body.keyword) {
      const cities = await searchCityByKeyword(body.keyword);
      return NextResponse.json({ cities });
    }
    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
