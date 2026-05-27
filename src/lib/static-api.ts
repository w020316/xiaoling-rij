"use client";

import { staticDB, isStaticMode } from "./static-db";
import { getTemperatureAdvice, getWeatherIcon } from "./qweather";
import { getStoredWeather, setStoredWeather, getStoredCity, setStoredCity } from "./weather-cache";
import { getDailyQuote } from "./quotes";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getQueryParam(url: string, name: string): string | null {
  try {
    var p = new URL(url, "http://localhost");
    return p.searchParams.get(name);
  } catch {
    return null;
  }
}

function extractIdFromPath(pathname: string, prefix: string): string | null {
  const match = pathname.match(new RegExp(`${prefix}/([^/?]+)`));
  return match ? match[1] : null;
}

async function getBody(req?: RequestInit): Promise<Record<string, unknown>> {
  try {
    if (!req) return {};
    if (typeof FormData !== "undefined" && req.body instanceof FormData) {
      const formBody: Record<string, unknown> = {};
      for (const [key, value] of req.body.entries()) {
        formBody[key] = value;
      }
      return formBody;
    }
    if (typeof req.body === "string") return JSON.parse(req.body);
    if (req.body instanceof ReadableStream) {
      const reader = req.body.getReader();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
      }
      return result ? JSON.parse(result) : {};
    }
    return {};
  } catch {
    return {};
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${file.type || "image/jpeg"};base64,${btoa(binary)}`;
}

function generateLocalId(): string {
  return "local_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const CITY_WEATHER_MAP: Record<string, { temp: number; desc: string; icon: string }> = {
  "101010100": { temp: 22, desc: "晴", icon: "100" },
  "101020100": { temp: 20, desc: "多云", icon: "101" },
  "101210101": { temp: 23, desc: "小雨", icon: "305" },
  "101280101": { temp: 28, desc: "多云", icon: "101" },
  "101190101": { temp: 21, desc: "阴", icon: "104" },
  "101110101": { temp: 25, desc: "晴", icon: "100" },
  "101270101": { temp: 18, desc: "小雨", icon: "305" },
  "101230101": { temp: 13, desc: "多云", icon: "101" },
  "101040101": { temp: 24, desc: "阴", icon: "104" },
  "101160101": { temp: 19, desc: "晴", icon: "100" },
  "101070101": { temp: 21, desc: "多云", icon: "101" },
  "101200101": { temp: 22, desc: "晴", icon: "100" },
  "101250101": { temp: 27, desc: "多云", icon: "101" },
  "101240101": { temp: 23, desc: "小雨", icon: "305" },
  "101260101": { temp: 21, desc: "阴", icon: "104" },
};
const FALLBACK_QUOTES = [
  "心存温柔，山河浪漫。",
  "每一天都是新的开始，带着笑容出发吧 ✨",
  "努力让自己发光，对的人会迎光而来。",
  "生活明朗，万物可爱，人间值得。",
  "所有的美好都会如期而至。",
  "慢慢来，谁不是翻山越岭去相爱。",
  "今天也要做最棒的自己！",
  "温柔半两，从容一生。",
  "星光不问赶路人，时光不负有心人。",
  "保持热爱，奔赴山海。",
  "愿你被这个世界温柔以待。",
  "心之所向，素履以往。",
  "凡是过往，皆为序章。",
  "你值得世间所有的美好。",
  "今天的不开心就到此为止。",
  "日子常新，未来不远。",
  "愿你眼中有光，心中有爱。",
  "山高路远，看世界也找自己。",
  "好事总会发生在下个转弯。",
  "把身体照顾好，把喜欢的事做好。",
  "最好的时光在路上。",
  "生活原本沉闷，但跑起来就有风。",
  "希望今天的你比昨天更快乐。",
  "一切尽意，百事从欢。",
  "你只管努力，剩下的交给时间。",
  "少研究别人，多塑造自己。",
  "种一棵树最好的时间是十年前，其次是现在。",
  "愿你在平凡的日子里闪闪发光。",
  "放慢脚步，感受生活的温度。",
  "每天给自己一个微笑的理由。",
  "哪怕只有一点点进步，也值得庆祝。",
  "前路漫漫亦灿灿。",
  "做自己的太阳，无需凭借谁的光。",
];

function getFallbackQuote(): string {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
}

export function initStaticAPI(): boolean {
  if (!isStaticMode()) return false;

  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : (input as Request).url;
    const method = (init?.method || "GET").toUpperCase();

    if (!url.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    const pathname = url.split("?")[0];

    return (async () => {
      // ─── User ───
      if (pathname === "/api/user" && method === "GET") {
        return jsonResponse(staticDB.getUser());
      }
      if (pathname === "/api/user" && method === "PATCH") {
        const body = await getBody(init!);
        const updated = staticDB.updateUser(body as Record<string, unknown> as Partial<import("./static-db").StoredUser>);
        return jsonResponse(updated);
      }
      if (pathname === "/api/user/stats") {
        return jsonResponse(staticDB.getUserStats());
      }

      // ─── Todo ───
      if (pathname === "/api/todo" && method === "GET") {
        return jsonResponse(staticDB.getTodos());
      }
      if (pathname === "/api/todo" && method === "POST") {
        const body = await getBody(init!);
        const todo = staticDB.createTodo(body as Record<string, unknown> as Partial<import("./static-db").StoredTodo>);
        return jsonResponse(todo);
      }
      if (pathname.startsWith("/api/todo/") && method === "PATCH") {
        const id = extractIdFromPath(pathname, "/api/todo");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const body = await getBody(init!);
        const allowed: Record<string, unknown> = {};
        for (const k of ["title", "description", "status", "priority", "isDone", "dueDate", "category", "tags"]) {
          if (body[k] !== undefined) allowed[k] = body[k];
        }
        const todo = staticDB.updateTodo(id, allowed as Partial<import("./static-db").StoredTodo>);
        return jsonResponse(todo);
      }
      if (pathname.startsWith("/api/todo/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/todo");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteTodo(id);
        return jsonResponse({ success: true });
      }

      // ─── Diary ───
      if (pathname === "/api/diary" && method === "GET") {
        return jsonResponse(staticDB.getDiaries());
      }
      if (pathname === "/api/diary" && method === "POST") {
        const body = await getBody(init!);
        const diary = staticDB.createDiary(body as Record<string, unknown> as Partial<import("./static-db").StoredDiary>);
        return jsonResponse(diary);
      }
      if (pathname.startsWith("/api/diary/") && method === "GET") {
        const id = extractIdFromPath(pathname, "/api/diary");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const diary = staticDB.getDiary(id);
        return jsonResponse(diary);
      }
      if (pathname.startsWith("/api/diary/") && method === "PATCH") {
        const id = extractIdFromPath(pathname, "/api/diary");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const body = await getBody(init!);
        const diary = staticDB.updateDiary(id, body as Partial<import("./static-db").StoredDiary>);
        return jsonResponse(diary);
      }
      if (pathname.startsWith("/api/diary/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/diary");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteDiary(id);
        return jsonResponse({ success: true });
      }

      // ─── Photo ───
      if (pathname === "/api/photo" && method === "GET") {
        return jsonResponse(staticDB.getPhotos());
      }
      if (pathname === "/api/photo" && method === "POST") {
        const body = await getBody(init!);
        let url = typeof body.url === "string" ? body.url : "";
        if (!url && typeof File !== "undefined" && body.file instanceof File) {
          url = await fileToDataUrl(body.file);
        }
        if (!url) return jsonResponse({ error: "缺少图片数据" }, 400);
        const photo = staticDB.createPhoto({
          url,
          description: typeof body.description === "string" ? body.description : null,
          location: typeof body.location === "string" ? body.location : null,
          photoTime: typeof body.photoTime === "string" ? body.photoTime : new Date().toISOString(),
          category: typeof body.category === "string" ? body.category : "all",
        } as Partial<import("./static-db").StoredPhoto>);
        return jsonResponse(photo);
      }
      if (pathname.startsWith("/api/photo/") && method === "PATCH") {
        const id = extractIdFromPath(pathname, "/api/photo");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const body = await getBody(init!);
        const photo = staticDB.updatePhoto(id, body as Partial<import("./static-db").StoredPhoto>);
        return jsonResponse(photo);
      }
      if (pathname.startsWith("/api/photo/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/photo");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deletePhoto(id);
        return jsonResponse({ success: true });
      }

      // ─── Couple ───
      if (pathname === "/api/couple" && method === "GET") {
        let couple = staticDB.getCouple();
        if (!couple) {
          couple = staticDB.createCouple({
            nickname1: "小林",
            nickname2: "TA",
          });
        }
        return jsonResponse({
          ...couple,
          anniversaries: staticDB.getAnniversaries(),
          wishLists: staticDB.getWishLists(),
          savingsGoals: staticDB.getSavingsGoals(),
        });
      }
      if (pathname === "/api/couple" && method === "POST") {
        const body = await getBody(init!);
        const couple = staticDB.createCouple(body as Record<string, unknown> as Partial<import("./static-db").StoredCouple>);
        return jsonResponse(couple);
      }
      if (pathname === "/api/couple" && method === "PATCH") {
        const body = await getBody(init!);
        const couple = staticDB.updateCouple(body as Record<string, unknown> as Partial<import("./static-db").StoredCouple>);
        return jsonResponse(couple);
      }

      // ─── Anniversary ───
      if (pathname === "/api/anniversary" && method === "GET") {
        return jsonResponse(staticDB.getAnniversaries());
      }
      if (pathname === "/api/anniversary" && method === "POST") {
        const body = await getBody(init!);
        const a = staticDB.createAnniversary(body as Record<string, unknown> as Partial<import("./static-db").StoredAnniversary>);
        return jsonResponse(a);
      }
      if (pathname === "/api/anniversary" && method === "DELETE") {
        const id = getQueryParam(url, "id");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteAnniversary(id);
        return jsonResponse({ success: true });
      }
      if (pathname.startsWith("/api/anniversary/") && method === "PATCH") {
        const id = extractIdFromPath(pathname, "/api/anniversary");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const body = await getBody(init!);
        const a = staticDB.updateAnniversary(id, body as Partial<import("./static-db").StoredAnniversary>);
        return jsonResponse(a);
      }
      if (pathname.startsWith("/api/anniversary/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/anniversary");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteAnniversary(id);
        return jsonResponse({ success: true });
      }

      // ─── WishList ───
      if (pathname === "/api/wishlist" && method === "GET") {
        return jsonResponse(staticDB.getWishLists());
      }
      if (pathname === "/api/wishlist" && method === "POST") {
        const body = await getBody(init!);
        const w = staticDB.createWishList(body as Record<string, unknown> as Partial<import("./static-db").StoredWishList>);
        return jsonResponse(w);
      }
      if (pathname.startsWith("/api/wishlist/") && method === "PATCH") {
        const id = extractIdFromPath(pathname, "/api/wishlist");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const body = await getBody(init!);
        const w = staticDB.updateWishList(id, body as Partial<import("./static-db").StoredWishList>);
        return jsonResponse(w);
      }
      if (pathname.startsWith("/api/wishlist/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/wishlist");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteWishList(id);
        return jsonResponse({ success: true });
      }

      // ─── Savings ───
      if (pathname === "/api/savings" && method === "GET") {
        return jsonResponse(staticDB.getSavingsGoals());
      }
      if (pathname === "/api/savings" && method === "POST") {
        const body = await getBody(init!);
        const s = staticDB.createSavingsGoal(body as Record<string, unknown> as Partial<import("./static-db").StoredSavingsGoal>);
        return jsonResponse(s);
      }
      if (pathname.startsWith("/api/savings/") && method === "PATCH") {
        const id = extractIdFromPath(pathname, "/api/savings");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const body = await getBody(init!);
        const s = staticDB.updateSavingsGoal(id, body as Partial<import("./static-db").StoredSavingsGoal>);
        return jsonResponse(s);
      }
      if (pathname.startsWith("/api/savings/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/savings");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteSavingsGoal(id);
        return jsonResponse({ success: true });
      }

      // ─── Emotion ───
      if (pathname === "/api/emotion" && method === "GET") {
        const days = getQueryParam(url, "days");
        return jsonResponse(staticDB.getEmotions(days ? parseInt(days) : undefined));
      }
      if (pathname === "/api/emotion" && method === "POST") {
        const body = await getBody(init!);
        const e = staticDB.createEmotion(body as Record<string, unknown> as Partial<import("./static-db").StoredEmotion>);
        return jsonResponse(e);
      }
      if (pathname.startsWith("/api/emotion/") && method === "PATCH") {
        const id = extractIdFromPath(pathname, "/api/emotion");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const body = await getBody(init!);
        const e = staticDB.updateEmotion(id, body as Partial<import("./static-db").StoredEmotion>);
        return jsonResponse(e);
      }
      if (pathname.startsWith("/api/emotion/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/emotion");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteEmotion(id);
        return jsonResponse({ success: true });
      }

      // ─── CheckIn ───
      if (pathname === "/api/checkin" && method === "GET") {
        const today = staticDB.getTodayCheckIn();
        return jsonResponse({
          success: !!today,
          checkedIn: !!today,
          checkInDays: staticDB.getUser().checkInDays,
        });
      }
      if (pathname === "/api/checkin" && method === "POST") {
        const already = staticDB.getTodayCheckIn();
        if (already) {
          return jsonResponse({
            success: false,
            message: "今日已打卡",
            checkInDays: staticDB.getUser().checkInDays,
          });
        }
        staticDB.createCheckIn();
        return jsonResponse({
          success: true,
          message: "打卡成功",
          checkInDays: staticDB.getUser().checkInDays,
        });
      }

      // ─── Period ───
      if (pathname === "/api/health/period" && method === "GET") {
        return jsonResponse(staticDB.getPeriods());
      }
      if (pathname === "/api/health/period" && method === "POST") {
        const body = await getBody(init!);
        const p = staticDB.createPeriod(body as Record<string, unknown> as Partial<import("./static-db").StoredPeriod>);
        return jsonResponse(p);
      }
      if (pathname.startsWith("/api/health/period/") && method === "PATCH") {
        const id = extractIdFromPath(pathname, "/api/health/period");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const body = await getBody(init!);
        const p = staticDB.updatePeriod(id, body as Partial<import("./static-db").StoredPeriod>);
        return jsonResponse(p);
      }
      if (pathname.startsWith("/api/health/period/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/health/period");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deletePeriod(id);
        return jsonResponse({ success: true });
      }

      // ─── Calorie ───
      if (pathname === "/api/calorie" && method === "GET") {
        return jsonResponse(staticDB.getCalories());
      }
      if (pathname === "/api/calorie" && method === "POST") {
        const body = await getBody(init!);
        const c = staticDB.createCalorie(body as Record<string, unknown> as Partial<import("./static-db").StoredCalorie>);
        return jsonResponse(c);
      }
      if (pathname === "/api/calorie" && method === "DELETE") {
        const id = getQueryParam(url, "id");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteCalorie(id);
        return jsonResponse({ success: true });
      }
      if (pathname.startsWith("/api/calorie/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/calorie");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteCalorie(id);
        return jsonResponse({ success: true });
      }
      if (pathname === "/api/calorie/analyze" && method === "POST") {
        const body = await getBody(init!);
        return jsonResponse({
          name: "识别为日常餐食",
          calories: 350,
          protein: 20,
          fat: 12,
          carbs: 40,
          suggestion: "静态模式下无法使用AI识别图片，请手动搜索食物添加。这是一份营养均衡的建议摄入。",
        });
      }
      if (pathname === "/api/calorie/suggest" && method === "POST") {
        const body = await getBody(init!);
        const totalCalories = body.totalCalories as number || 0;
        const suggestion = totalCalories > 2500
          ? "今日热量摄入偏高，建议明天多运动、少油腻。"
          : totalCalories < 1200
            ? "今日热量偏低，记得多吃一些蛋白质。"
            : "今日饮食均衡，继续保持！多吃蔬菜水果。";
        return jsonResponse({ suggestion, dailyTarget: 2000, calorieAdvice: suggestion });
      }

      // ─── Schedule ───
      if (pathname === "/api/schedule" && method === "GET") {
        return jsonResponse(staticDB.getSchedules());
      }
      if (pathname === "/api/schedule" && method === "POST") {
        const body = await getBody(init!);
        const s = staticDB.createSchedule({
          ...body as Record<string, unknown>,
          dayOfWeek: (body as Record<string, unknown>).dayOfWeek as number || new Date().getDay() || 7,
        } as Partial<import("./static-db").StoredSchedule>);
        return jsonResponse(s);
      }
      if (pathname.startsWith("/api/schedule/") && method === "PATCH") {
        const id = extractIdFromPath(pathname, "/api/schedule");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        const body = await getBody(init!);
        const s = staticDB.updateSchedule(id, body as Partial<import("./static-db").StoredSchedule>);
        return jsonResponse(s);
      }
      if (pathname.startsWith("/api/schedule/") && method === "DELETE") {
        const id = extractIdFromPath(pathname, "/api/schedule");
        if (!id) return jsonResponse({ error: "缺少id" }, 400);
        staticDB.deleteSchedule(id);
        return jsonResponse({ success: true });
      }

      // ─── Quote ───
      if (pathname === "/api/quote") {
        const quote = getDailyQuote();
        return jsonResponse({
          content: quote.content,
          theme: quote.theme,
          author: quote.author || null,
          total: 100
        });
      }

      // ─── Weather ───
      if (pathname === "/api/weather" && method === "GET") {
        const locationParam = getQueryParam(url, "location");
        const storedCity = getStoredCity();
        const locId = locationParam || storedCity.locationId;
        const cityData = CITY_WEATHER_MAP[locId] || CITY_WEATHER_MAP["101010100"];

        const cityNames: Record<string, string> = {
          "101010100": "北京", "101020100": "上海", "101210101": "杭州",
          "101280101": "广州", "101190101": "南京", "101110101": "西安",
          "101270101": "成都", "101230101": "福州", "101040101": "重庆",
          "101160101": "兰州", "101070101": "沈阳", "101200101": "武汉",
          "101250101": "深圳", "101240101": "厦门", "101260101": "贵阳",
        };
        const cityName = cityNames[locId] || storedCity.city;
        const feelsLike = String(cityData.temp + (cityData.temp > 20 ? 2 : 1));
        const advice = getTemperatureAdvice(cityData.temp);
        const emoji = getWeatherIcon(cityData.icon);

        return jsonResponse({
          hot: cityData.temp,
          feelsLike,
          desc: cityData.desc,
          emoji,
          humidity: "45",
          windDir: "东南风",
          windScale: "3",
          advice: `${advice.clothing}；${advice.activity}`,
          aiTip: `当前温度 ${cityData.temp}°C，${advice.level}。${advice.clothing}。${advice.health}`,
          city: cityName,
        });
      }

      if (pathname === "/api/weather" && method === "POST") {
        const body = await getBody(init!);
        const action = body.action as string;

        if (action === "search") {
          const keyword = (body.keyword as string || "").toLowerCase();
          const cityList = [
            { id: "101010100", name: "北京", adm1: "北京", adm2: "北京" },
            { id: "101020100", name: "上海", adm1: "上海", adm2: "上海" },
            { id: "101210101", name: "杭州", adm1: "浙江", adm2: "杭州" },
            { id: "101280101", name: "广州", adm1: "广东", adm2: "广州" },
            { id: "101190101", name: "南京", adm1: "江苏", adm2: "南京" },
            { id: "101110101", name: "西安", adm1: "陕西", adm2: "西安" },
            { id: "101270101", name: "成都", adm1: "四川", adm2: "成都" },
            { id: "101230101", name: "福州", adm1: "福建", adm2: "福州" },
            { id: "101040101", name: "重庆", adm1: "重庆", adm2: "重庆" },
            { id: "101160101", name: "兰州", adm1: "甘肃", adm2: "兰州" },
            { id: "101070101", name: "沈阳", adm1: "辽宁", adm2: "沈阳" },
            { id: "101200101", name: "武汉", adm1: "湖北", adm2: "武汉" },
            { id: "101250101", name: "深圳", adm1: "广东", adm2: "深圳" },
            { id: "101240101", name: "厦门", adm1: "福建", adm2: "厦门" },
            { id: "101260101", name: "贵阳", adm1: "贵州", adm2: "贵阳" },
          ];
          const filtered = keyword
            ? cityList.filter(c => c.name.toLowerCase().includes(keyword) || c.adm2.toLowerCase().includes(keyword))
            : cityList;
          return jsonResponse(filtered);
        }

        if (action === "setCity") {
          const city = body.city as string;
          const locationId = body.locationId as string;
          if (!city || !locationId) {
            return jsonResponse({ error: "缺少城市信息" }, 400);
          }
          setStoredCity(city, locationId);
          return jsonResponse({ success: true });
        }

        return jsonResponse({ error: "未知操作" }, 400);
      }

      // ─── Holiday ───
      if (pathname === "/api/holiday") {
        return jsonResponse({ holiday: null });
      }

      // ─── AI endpoints (static mode fallback) ───
      if (pathname === "/api/ai/chat") {
        return handleAIChat(init);
      }
      if (pathname === "/api/ai/diary") {
        return handleAIDiary(init);
      }
      if (pathname === "/api/ai/todo") {
        return handleAITodo(init);
      }
      if (pathname === "/api/ai/goodnight") {
        return handleAIGoodnight(init);
      }
      if (pathname === "/api/ai/weekly") {
        return handleAIWeekly(init);
      }

      // ─── Sync ───
      if (pathname === "/api/sync" && method === "GET") {
        return jsonResponse({
          syncAvailable: false,
          message: "静态模式下不支持云端同步，请使用数据导出/导入功能",
        });
      }

      if (pathname === "/api/sync" && method === "POST") {
        const body = await getBody(init!);
        const action = body.action as string;
        if (action === "merge") {
          return jsonResponse({
            success: true,
            message: "本地数据已合并",
            mergedCount: body.data ? Object.keys(body.data as object).length : 0,
          });
        }
        if (action === "pull") {
          return jsonResponse({
            success: true,
            message: "已拉取本地备份数据",
            data: {},
            lastSync: new Date().toISOString(),
          });
        }
        return jsonResponse({ error: "未知操作" }, 400);
      }

      // ─── DB Init ───
      if (pathname === "/api/db/init") {
        return jsonResponse({ success: true, message: "本地存储已就绪" });
      }

      return jsonResponse({ error: `未知API: ${method} ${pathname}` }, 404);
    })() as Promise<Response>;
  };

  console.log("[StaticAPI] GitHub Pages 模式已激活，所有数据保存在本地浏览器");
  return true;
}

async function callDeepSeek(messages: Array<{ role: string; content: string }>): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.content || "";
  if (lastMessage.includes("晚安")) {
    return "今天也辛苦啦，记得把烦恼轻轻放下，明天会有新的好心情等着你。晚安，好梦呀。";
  }
  if (lastMessage.includes("情绪") || lastMessage.includes("难过")) {
    return "我有在认真听你说话。先让自己慢一点、轻一点，去喝口水，深呼吸一下，你已经很棒了。";
  }
  return "静态模式下 AI 会使用本地温柔回复陪伴你，完整智能能力请在支持服务端 API 的环境中使用。";
}

async function handleAIChat(init?: RequestInit): Promise<Response> {
  const body = await getBody(init!);
  const messages = body.messages as Array<{ role: string; content: string }> | undefined;
  if (!Array.isArray(messages)) return jsonResponse({ error: "messages 必须为数组" }, 400);
  staticDB.createMessage("user", messages[messages.length - 1]?.content || "");
  const reply = await callDeepSeek([
    { role: "system", content: "你是一个温暖治愈的AI伴侣，名叫小林。你可以帮助用户管理待办事项、记录日记、健康提醒等。回复语气温柔可爱，适当使用emoji。" },
    ...messages,
  ]);
  staticDB.createMessage("assistant", reply);
  return jsonResponse({ content: reply });
}

async function handleAIDiary(init?: RequestInit): Promise<Response> {
  const body = await getBody(init!);
  const content = body.content as string;
  if (!content) return jsonResponse({ error: "缺少content" }, 400);
  const expanded = await callDeepSeek([
    { role: "system", content: "你是一个温暖的日记助手。根据用户简短的描述，扩展成一篇温暖、有深度的日记。保持第一人称，添加情感细节。回复格式：直接返回扩展后的日记内容，不要加任何前缀。" },
    { role: "user", content },
  ]);
  return jsonResponse({ expanded });
}

async function handleAITodo(init?: RequestInit): Promise<Response> {
  const body = await getBody(init!);
  const goal = body.goal as string;
  if (!goal) return jsonResponse([]);
  const tasks = [
    { title: `明确目标：${goal}`, description: "先把目标拆成可执行的小步骤。", priority: "important" },
    { title: "安排时间块", description: "给每一步分配可执行时间。", priority: "normal" },
    { title: "开始第一步", description: "先完成最容易启动的一项任务。", priority: "normal" },
  ];
  return jsonResponse(tasks);
}

async function handleAIGoodnight(init?: RequestInit): Promise<Response> {
  const body = await getBody(init!);
  const today = getTodayStr();
  const todos = staticDB.getTodos();
  const pendingCount = todos.filter(t => !t.isDone).length;
  const doneCount = todos.filter(t => t.isDone).length;
  const diaries = staticDB.getDiaries();
  const todayDiary = diaries.find(d => d.createdAt?.slice(0, 10) === today);

  const context = `今日完成事项: ${doneCount}个, 待完成: ${pendingCount}个.${todayDiary ? ` 今日日记: ${todayDiary.content?.slice(0, 200)}` : ""}`;
  const reply = await callDeepSeek([
    { role: "system", content: "你是一个温暖的AI伴侣小灵。用户结束了一天的学习生活，请根据TA的完成情况，生成一段100-150字的温暖晚安总结，包含鼓励、安慰和明天的小建议。语气温柔治愈，适当使用emoji。" },
    { role: "user", content: context },
  ]);
  return jsonResponse({ reply });
}

async function handleAIWeekly(init?: RequestInit): Promise<Response> {
  const body = await getBody(init!);
  const today = getTodayStr();
  const emotions = staticDB.getEmotions(7);
  const diaries = staticDB.getDiaries().filter(d => {
    const d7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    return d.createdAt?.slice(0, 10) >= d7;
  });

  const moodSummary = emotions.map(e => `${e.mood}(${e.score}分)`).join(", ") || "暂无记录";
  const diaryTitles = diaries.map(d => d.title || "无标题").slice(0, 5).join("、") || "暂无记录";

  const reply = await callDeepSeek([
    { role: "system", content: "你是一个温暖的AI助手小灵。用户需要一份本周总结。请根据情绪数据和日记，生成一段150字左右的温暖周报，包含本周亮点、情绪分析和下周建议。语气温柔治愈，适当使用emoji。" },
    { role: "user", content: `本周情绪: ${moodSummary}。日记关键词: ${diaryTitles}。` },
  ]);
  return jsonResponse({ reply });
}

let _initialized = false;

export function ensureStaticAPI(): boolean {
  if (_initialized) return isStaticMode();
  _initialized = true;
  return initStaticAPI();
}
