"use client";

const DB_PREFIX = "xy_daily_";

function generateId(): string {
  return "local_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

function dbGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(DB_PREFIX + key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function dbSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
  } catch { /* ignore quota exceeded */ }
}

export interface StoredUser {
  id: string; nickname: string; avatar: string | null; checkInDays: number;
  lastCheckIn: string | null; theme: string; coupleId: string | null;
  createdAt: string; updatedAt: string;
}

export interface StoredTodo {
  id: string; title: string; description: string | null; dueDate: string | null;
  category: string; tags: string | null; priority: string; status: string;
  sortOrder: number; isRepeat: boolean; repeatRule: string | null;
  remindAt: string | null; attachments: string | null; isDone: boolean;
  aiGenerated: boolean; userId: string | null; createdAt: string; updatedAt: string;
}

export interface StoredDiary {
  id: string; title: string | null; content: string; tags: string | null;
  location: string | null; weather: string | null; mood: string | null;
  images: string | null; diaryType: string; aiExpanded: boolean;
  aiContent: string | null; userId: string | null; createdAt: string; updatedAt: string;
}

export interface StoredPhoto {
  id: string; url: string; thumbnail: string | null; description: string | null;
  location: string | null; photoTime: string | null; category: string;
  aiTags: string | null; aiScene: string | null; isFavorite: boolean;
  userId: string | null; createdAt: string;
}

export interface StoredCouple {
  id: string; inviteCode: string; startDate: string; nickname1: string;
  nickname2: string; createdAt: string; updatedAt: string;
}

export interface StoredAnniversary {
  id: string; title: string; date: string; remindDays: number; type: string;
  coupleId: string | null; createdAt: string;
}

export interface StoredWishList {
  id: string; title: string; isCompleted: boolean; completedAt: string | null;
  coupleId: string | null; createdAt: string;
}

export interface StoredSavingsGoal {
  id: string; title: string; target: number; current: number;
  coupleId: string | null; createdAt: string; updatedAt: string;
}

export interface StoredEmotion {
  id: string; mood: string; score: number; note: string | null;
  userId: string | null; createdAt: string;
}

export interface StoredCheckIn {
  id: string; type: string; userId: string | null; createdAt: string;
}

export interface StoredMessage {
  id: string; role: string; content: string; images: string | null;
  userId: string | null; createdAt: string;
}

export interface StoredPeriod {
  id: string; startDate: string; endDate: string | null; cycleDays: number;
  symptoms: string | null; flowLevel: string | null; notes: string | null;
  userId: string | null; createdAt: string;
}

export interface StoredCalorie {
  id: string; foodName: string; calories: number; protein: number;
  fat: number; carbs: number; mealType: string; date: string; userId: string | null;
}

export interface StoredSchedule {
  id: string; timeStart: string; timeEnd: string; title: string;
  dayOfWeek: number; classroom: string | null; createdAt: string;
}

const DEFAULT_USER: StoredUser = {
  id: "default-user", nickname: "小林", avatar: null, checkInDays: 0,
  lastCheckIn: null, theme: "theme-kuromi", coupleId: null,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

function getUserId(): string {
  return dbGet<StoredUser>("user", DEFAULT_USER).id;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isStaticMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.includes("github.io");
}

export const staticDB = {
  // ─── User ───
  getUser(): StoredUser {
    return dbGet<StoredUser>("user", { ...DEFAULT_USER });
  },
  updateUser(data: Partial<StoredUser>): StoredUser {
    const user = { ...staticDB.getUser(), ...data, updatedAt: new Date().toISOString() };
    dbSet("user", user);
    return user;
  },
  getUserStats() {
    const todos = staticDB.getTodos();
    const diaries = staticDB.getDiaries();
    const checkIns = dbGet<StoredCheckIn[]>("checkins", []);
    const photos = dbGet<StoredPhoto[]>("photos", []);
    const today = getToday();
    const todayTodos = todos.filter(t => t.createdAt?.slice(0, 10) === today);
    return {
      todoCount: todayTodos.length,
      pendingTodoCount: todayTodos.filter(t => !t.isDone).length,
      diaryCount: diaries.filter(d => d.createdAt?.slice(0, 10) === today).length,
      checkInDays: checkIns.length,
      photoCount: photos.length,
    };
  },

  // ─── Todo ───
  getTodos(): StoredTodo[] {
    return dbGet<StoredTodo[]>("todos", []);
  },
  createTodo(data: Partial<StoredTodo>): StoredTodo {
    const todo: StoredTodo = {
      id: generateId(), title: data.title || "", description: data.description || null,
      dueDate: data.dueDate || null, category: data.category || "默认",
      tags: data.tags || null, priority: data.priority || "normal",
      status: "pending", sortOrder: data.sortOrder || 0,
      isRepeat: data.isRepeat || false, repeatRule: data.repeatRule || null,
      remindAt: data.remindAt || null, attachments: data.attachments || null,
      isDone: false, aiGenerated: data.aiGenerated || false,
      userId: getUserId(), createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const todos = staticDB.getTodos();
    todos.unshift(todo);
    dbSet("todos", todos);
    return todo;
  },
  updateTodo(id: string, data: Partial<StoredTodo>): StoredTodo | null {
    const todos = staticDB.getTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return null;
    todos[idx] = { ...todos[idx], ...data, updatedAt: new Date().toISOString() };
    dbSet("todos", todos);
    return todos[idx];
  },
  deleteTodo(id: string): boolean {
    const todos = staticDB.getTodos().filter(t => t.id !== id);
    dbSet("todos", todos);
    return true;
  },

  // ─── Diary ───
  getDiaries(): StoredDiary[] {
    const diaries = dbGet<StoredDiary[]>("diaries", []);
    return diaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getDiary(id: string): StoredDiary | null {
    return staticDB.getDiaries().find(d => d.id === id) || null;
  },
  createDiary(data: Partial<StoredDiary>): StoredDiary {
    const diary: StoredDiary = {
      id: generateId(), title: data.title || null,
      content: data.content || "", tags: data.tags || null,
      location: data.location || null, weather: data.weather || null,
      mood: data.mood || null, images: data.images || null,
      diaryType: data.diaryType || "text", aiExpanded: data.aiExpanded || false,
      aiContent: data.aiContent || null,
      userId: getUserId(), createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const diaries = dbGet<StoredDiary[]>("diaries", []);
    diaries.unshift(diary);
    dbSet("diaries", diaries);
    return diary;
  },
  updateDiary(id: string, data: Partial<StoredDiary>): StoredDiary | null {
    const diaries = dbGet<StoredDiary[]>("diaries", []);
    const idx = diaries.findIndex(d => d.id === id);
    if (idx === -1) return null;
    diaries[idx] = { ...diaries[idx], ...data, updatedAt: new Date().toISOString() };
    dbSet("diaries", diaries);
    return diaries[idx];
  },
  deleteDiary(id: string): boolean {
    const diaries = dbGet<StoredDiary[]>("diaries", []).filter(d => d.id !== id);
    dbSet("diaries", diaries);
    return true;
  },

  // ─── Photo ───
  getPhotos(): StoredPhoto[] {
    return dbGet<StoredPhoto[]>("photos", []);
  },
  createPhoto(data: Partial<StoredPhoto>): StoredPhoto {
    const photo: StoredPhoto = {
      id: generateId(), url: data.url || "", thumbnail: data.thumbnail || null,
      description: data.description || null, location: data.location || null,
      photoTime: data.photoTime || new Date().toISOString(),
      category: data.category || "all", aiTags: data.aiTags || null,
      aiScene: data.aiScene || null, isFavorite: data.isFavorite || false,
      userId: getUserId(), createdAt: new Date().toISOString(),
    };
    const photos = staticDB.getPhotos();
    photos.unshift(photo);
    dbSet("photos", photos);
    return photo;
  },
  updatePhoto(id: string, data: Partial<StoredPhoto>): StoredPhoto | null {
    const photos = dbGet<StoredPhoto[]>("photos", []);
    const idx = photos.findIndex(p => p.id === id);
    if (idx === -1) return null;
    photos[idx] = { ...photos[idx], ...data };
    dbSet("photos", photos);
    return photos[idx];
  },
  deletePhoto(id: string): boolean {
    const photos = dbGet<StoredPhoto[]>("photos", []).filter(p => p.id !== id);
    dbSet("photos", photos);
    return true;
  },

  // ─── Couple ───
  getCouple(): StoredCouple | null {
    return dbGet<StoredCouple | null>("couple", null);
  },
  createCouple(data: Partial<StoredCouple>): StoredCouple {
    const couple: StoredCouple = {
      id: generateId(), inviteCode: data.inviteCode || Math.random().toString(36).slice(2, 8),
      startDate: data.startDate || new Date().toISOString(),
      nickname1: data.nickname1 || "TA", nickname2: data.nickname2 || "TA",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    dbSet("couple", couple);
    staticDB.updateUser({ coupleId: couple.id });
    return couple;
  },
  updateCouple(data: Partial<StoredCouple>): StoredCouple | null {
    const couple = staticDB.getCouple();
    if (!couple) return null;
    const updated = { ...couple, ...data, updatedAt: new Date().toISOString() };
    dbSet("couple", updated);
    return updated;
  },

  // ─── Anniversary ───
  getAnniversaries(): StoredAnniversary[] {
    return dbGet<StoredAnniversary[]>("anniversaries", []);
  },
  createAnniversary(data: Partial<StoredAnniversary>): StoredAnniversary {
    const a: StoredAnniversary = {
      id: generateId(), title: data.title || "", date: data.date || new Date().toISOString(),
      remindDays: data.remindDays || 3, type: data.type || "custom",
      coupleId: staticDB.getCouple()?.id || null, createdAt: new Date().toISOString(),
    };
    const arr = staticDB.getAnniversaries();
    arr.push(a);
    dbSet("anniversaries", arr);
    return a;
  },
  updateAnniversary(id: string, data: Partial<StoredAnniversary>): StoredAnniversary | null {
    const arr = dbGet<StoredAnniversary[]>("anniversaries", []);
    const idx = arr.findIndex(a => a.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...data };
    dbSet("anniversaries", arr);
    return arr[idx];
  },
  deleteAnniversary(id: string): boolean {
    const arr = dbGet<StoredAnniversary[]>("anniversaries", []).filter(a => a.id !== id);
    dbSet("anniversaries", arr);
    return true;
  },

  // ─── WishList ───
  getWishLists(): StoredWishList[] {
    return dbGet<StoredWishList[]>("wishlists", []);
  },
  createWishList(data: Partial<StoredWishList>): StoredWishList {
    const w: StoredWishList = {
      id: generateId(), title: data.title || "",
      isCompleted: data.isCompleted || false, completedAt: null,
      coupleId: staticDB.getCouple()?.id || null, createdAt: new Date().toISOString(),
    };
    const arr = staticDB.getWishLists();
    arr.push(w);
    dbSet("wishlists", arr);
    return w;
  },
  updateWishList(id: string, data: Partial<StoredWishList>): StoredWishList | null {
    const arr = dbGet<StoredWishList[]>("wishlists", []);
    const idx = arr.findIndex(w => w.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...data, completedAt: data.isCompleted ? new Date().toISOString() : (arr[idx].completedAt) };
    dbSet("wishlists", arr);
    return arr[idx];
  },
  deleteWishList(id: string): boolean {
    const arr = dbGet<StoredWishList[]>("wishlists", []).filter(w => w.id !== id);
    dbSet("wishlists", arr);
    return true;
  },

  // ─── SavingsGoal ───
  getSavingsGoals(): StoredSavingsGoal[] {
    return dbGet<StoredSavingsGoal[]>("savings", []);
  },
  createSavingsGoal(data: Partial<StoredSavingsGoal>): StoredSavingsGoal {
    const s: StoredSavingsGoal = {
      id: generateId(), title: data.title || "", target: data.target || 0,
      current: data.current || 0, coupleId: staticDB.getCouple()?.id || null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const arr = staticDB.getSavingsGoals();
    arr.push(s);
    dbSet("savings", arr);
    return s;
  },
  updateSavingsGoal(id: string, data: Partial<StoredSavingsGoal>): StoredSavingsGoal | null {
    const arr = dbGet<StoredSavingsGoal[]>("savings", []);
    const idx = arr.findIndex(s => s.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...data, updatedAt: new Date().toISOString() };
    dbSet("savings", arr);
    return arr[idx];
  },
  deleteSavingsGoal(id: string): boolean {
    const arr = dbGet<StoredSavingsGoal[]>("savings", []).filter(s => s.id !== id);
    dbSet("savings", arr);
    return true;
  },

  // ─── Emotion ───
  getEmotions(days?: number): StoredEmotion[] {
    const emotions = dbGet<StoredEmotion[]>("emotions", []);
    if (!days) return emotions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return emotions.filter(e => e.createdAt >= cutoff);
  },
  createEmotion(data: Partial<StoredEmotion>): StoredEmotion {
    const e: StoredEmotion = {
      id: generateId(), mood: data.mood || "😊", score: data.score || 5,
      note: data.note || null, userId: getUserId(), createdAt: new Date().toISOString(),
    };
    const arr = dbGet<StoredEmotion[]>("emotions", []);
    arr.unshift(e);
    dbSet("emotions", arr);
    return e;
  },
  updateEmotion(id: string, data: Partial<StoredEmotion>): StoredEmotion | null {
    const arr = dbGet<StoredEmotion[]>("emotions", []);
    const idx = arr.findIndex(e => e.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...data };
    dbSet("emotions", arr);
    return arr[idx];
  },
  deleteEmotion(id: string): boolean {
    const arr = dbGet<StoredEmotion[]>("emotions", []).filter(e => e.id !== id);
    dbSet("emotions", arr);
    return true;
  },

  // ─── CheckIn ───
  getCheckIns(): StoredCheckIn[] {
    return dbGet<StoredCheckIn[]>("checkins", []);
  },
  getTodayCheckIn(): StoredCheckIn | null {
    const today = getToday();
    return staticDB.getCheckIns().find(c => c.createdAt.slice(0, 10) === today) || null;
  },
  createCheckIn(): StoredCheckIn {
    const c: StoredCheckIn = {
      id: generateId(), type: "daily", userId: getUserId(), createdAt: new Date().toISOString(),
    };
    const arr = staticDB.getCheckIns();
    arr.unshift(c);
    dbSet("checkins", arr);
    const user = staticDB.getUser();
    const today = getToday();
    const todayCounted = arr.filter(ci => ci.createdAt.slice(0, 10) !== today).length;
    staticDB.updateUser({ checkInDays: todayCounted + 1, lastCheckIn: new Date().toISOString() });
    return c;
  },

  // ─── Message ───
  getMessages(): StoredMessage[] {
    return dbGet<StoredMessage[]>("messages", []);
  },
  createMessage(role: string, content: string): StoredMessage {
    const m: StoredMessage = {
      id: generateId(), role, content, images: null,
      userId: getUserId(), createdAt: new Date().toISOString(),
    };
    const arr = staticDB.getMessages();
    arr.push(m);
    dbSet("messages", arr);
    return m;
  },
  clearMessages(): void {
    dbSet("messages", []);
  },

  // ─── Period ───
  getPeriods(): StoredPeriod[] {
    return dbGet<StoredPeriod[]>("periods", []);
  },
  createPeriod(data: Partial<StoredPeriod>): StoredPeriod {
    const p: StoredPeriod = {
      id: generateId(), startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || null, cycleDays: data.cycleDays || 28,
      symptoms: data.symptoms || null, flowLevel: data.flowLevel || null,
      notes: data.notes || null, userId: getUserId(), createdAt: new Date().toISOString(),
    };
    const arr = staticDB.getPeriods();
    arr.push(p);
    dbSet("periods", arr);
    return p;
  },
  updatePeriod(id: string, data: Partial<StoredPeriod>): StoredPeriod | null {
    const arr = dbGet<StoredPeriod[]>("periods", []);
    const idx = arr.findIndex(p => p.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...data };
    dbSet("periods", arr);
    return arr[idx];
  },
  deletePeriod(id: string): boolean {
    const arr = dbGet<StoredPeriod[]>("periods", []).filter(p => p.id !== id);
    dbSet("periods", arr);
    return true;
  },

  // ─── Calorie ───
  getCalories(): StoredCalorie[] {
    return dbGet<StoredCalorie[]>("calories", []);
  },
  createCalorie(data: Partial<StoredCalorie>): StoredCalorie {
    const c: StoredCalorie = {
      id: generateId(), foodName: data.foodName || "", calories: data.calories || 0,
      protein: data.protein || 0, fat: data.fat || 0, carbs: data.carbs || 0,
      mealType: data.mealType || "lunch", date: data.date || new Date().toISOString(),
      userId: getUserId(),
    };
    const arr = staticDB.getCalories();
    arr.push(c);
    dbSet("calories", arr);
    return c;
  },
  updateCalorie(id: string, data: Partial<StoredCalorie>): StoredCalorie | null {
    const arr = dbGet<StoredCalorie[]>("calories", []);
    const idx = arr.findIndex(c => c.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...data };
    dbSet("calories", arr);
    return arr[idx];
  },
  deleteCalorie(id: string): boolean {
    const arr = dbGet<StoredCalorie[]>("calories", []).filter(c => c.id !== id);
    dbSet("calories", arr);
    return true;
  },

  // ─── Schedule ───
  getSchedules(): StoredSchedule[] {
    return dbGet<StoredSchedule[]>("schedules", []);
  },
  createSchedule(data: Partial<StoredSchedule>): StoredSchedule {
    const s: StoredSchedule = {
      id: generateId(), timeStart: data.timeStart || "", timeEnd: data.timeEnd || "",
      title: data.title || "", dayOfWeek: data.dayOfWeek || 1,
      classroom: data.classroom || null, createdAt: new Date().toISOString(),
    };
    const arr = staticDB.getSchedules();
    arr.push(s);
    dbSet("schedules", arr);
    return s;
  },
  updateSchedule(id: string, data: Partial<StoredSchedule>): StoredSchedule | null {
    const arr = dbGet<StoredSchedule[]>("schedules", []);
    const idx = arr.findIndex(s => s.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...data };
    dbSet("schedules", arr);
    return arr[idx];
  },
  deleteSchedule(id: string): boolean {
    const arr = dbGet<StoredSchedule[]>("schedules", []).filter(s => s.id !== id);
    dbSet("schedules", arr);
    return true;
  },
};