"use client";

import { staticDB, isStaticMode } from "./static-db";

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

async function getBody(req: RequestInit): Promise<Record<string, unknown>> {
  try {
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

function generateLocalId(): string {
  return "local_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const FAKE_WEATHER = { emoji: "☁️", temp: 25, description: "多云", city: "北京" };
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
        const photo = staticDB.createPhoto(body as Record<string, unknown> as Partial<import("./static-db").StoredPhoto>);
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
        const couple = staticDB.getCouple();
        return jsonResponse(couple || {});
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
        return jsonResponse({ success: !!today, checkedIn: !!today });
      }
      if (pathname === "/api/checkin" && method === "POST") {
        const already = staticDB.getTodayCheckIn();
        if (already) return jsonResponse({ success: false, message: "今日已打卡" });
        staticDB.createCheckIn();
        return jsonResponse({ success: true, message: "打卡成功" });
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
        return jsonResponse({ content: getFallbackQuote() });
      }

      // ─── Weather ───
      if (pathname === "/api/weather") {
        return jsonResponse(FAKE_WEATHER);
      }

      // ─── Holiday ───
      if (pathname === "/api/holiday") {
        return jsonResponse({ holiday: null });
      }

      // ─── AI endpoints (direct DeepSeek calls from browser) ───
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
  const apiKey = "sk-28fe47f79b3846fa819bca13b199d983";
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "deepseek-chat", messages, max_tokens: 1000, temperature: 0.8 }),
    });
    if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || "抱歉，我暂时无法回答。";
  } catch {
    return "抱歉，AI 服务暂时不可用，请稍后再试。";
  }
}

async function handleAIChat(init?: RequestInit): Promise<Response> {
  const body = await getBody(init!);
  const messages = body.messages as Array<{ role: string; content: string }> | undefined;
  if (!Array.isArray(messages)) return jsonResponse({ error: "messages 必须为数组" }, 400);
  staticDB.createMessage("user", messages[messages.length - 1]?.content || "");
  const reply = await callDeepSeek([
    { role: "system", content: "你是一个温暖治愈的AI伴侣，名叫小灵。你可以帮助用户管理待办事项、记录日记、健康提醒等。回复语气温柔可爱，适当使用emoji。" },
    ...messages,
  ]);
  staticDB.createMessage("assistant", reply);
  return jsonResponse({ reply });
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
  if (!goal) return jsonResponse({ tasks: [] });
  const text = await callDeepSeek([
    { role: "system", content: "你是一个任务分解助手。将用户的目标拆解为3-5个具体可执行的步骤。返回JSON数组格式：[{\"title\": \"任务名\", \"description\": \"描述\", \"priority\": \"high|normal|low\"}]，只返回JSON数组，不要其他内容。" },
    { role: "user", content: goal },
  ]);
  try {
    const tasks = JSON.parse(text);
    return jsonResponse({ tasks: Array.isArray(tasks) ? tasks : [] });
  } catch {
    const lines = text.split("\n").filter(Boolean).slice(0, 5);
    return jsonResponse({ tasks: lines.map((t: string) => ({ title: t.replace(/^[\d\.\-\s]+/, ""), description: "", priority: "normal" })) });
  }
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