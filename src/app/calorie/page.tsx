"use client";

import { useState, useEffect, useRef } from "react";
import { Apple, Search, Trash2, X, Camera, ImageIcon, Loader2, Bot, Sparkles, Plus } from "lucide-react";

const foodDatabase: Record<string, { calories: number; protein: number; fat: number; carbs: number }> = {
  "鸡胸肉": { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
  "米饭": { calories: 232, protein: 4.3, fat: 0.4, carbs: 51 },
  "牛奶": { calories: 64, protein: 3.2, fat: 3.2, carbs: 4.8 },
  "鸡蛋": { calories: 78, protein: 6, fat: 5, carbs: 0.6 },
  "面包": { calories: 265, protein: 9, fat: 3.2, carbs: 49 },
  "牛肉": { calories: 250, protein: 26, fat: 15, carbs: 0 },
  "鱼": { calories: 206, protein: 22, fat: 12, carbs: 0 },
  "蔬菜沙拉": { calories: 45, protein: 2, fat: 0.5, carbs: 8 },
  "酸奶": { calories: 100, protein: 5, fat: 3, carbs: 12 },
  "苹果": { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
  "香蕉": { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
  "豆腐": { calories: 76, protein: 8, fat: 4.8, carbs: 1.9 },
  "面条": { calories: 280, protein: 8, fat: 1.5, carbs: 55 },
  "猪肉": { calories: 242, protein: 20, fat: 18, carbs: 0 },
  "虾": { calories: 99, protein: 24, fat: 0.3, carbs: 0.2 },
};

interface CalorieRecord {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  mealType: string;
}

interface AnalyzeResult {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  suggestion: string;
}

interface SuggestResult {
  suggestion: string;
  dailyTarget: number;
  calorieAdvice: string;
}

export default function CaloriePage() {
  const [search, setSearch] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("lunch");
  const [records, setRecords] = useState<CalorieRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [addingResult, setAddingResult] = useState(false);
  const [suggest, setSuggest] = useState<SuggestResult | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const meals = [
    { key: "breakfast", label: "早餐" },
    { key: "lunch", label: "午餐" },
    { key: "dinner", label: "晚餐" },
    { key: "snack", label: "加餐" },
  ];

  useEffect(() => {
    fetch("/api/calorie")
      .then((r) => r.json())
      .then((data) => {
        setRecords(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (records.length === 0) {
      setSuggest(null);
      return;
    }
    loadSuggestion();
  }, [records]);

  const filteredFoods = Object.entries(foodDatabase).filter(([name]) =>
    name.includes(search)
  );

  const totalCalories = records.reduce((sum, r) => sum + r.calories, 0);
  const totalProtein = records.reduce((sum, r) => sum + r.protein, 0);
  const totalFat = records.reduce((sum, r) => sum + r.fat, 0);
  const totalCarbs = records.reduce((sum, r) => sum + r.carbs, 0);

  const caloriePercent = Math.min((totalCalories / 2000) * 100, 100);

  async function addFood(name: string) {
    const food = foodDatabase[name];
    if (!food) return;
    try {
      const res = await fetch("/api/calorie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: name,
          calories: food.calories,
          protein: food.protein,
          fat: food.fat,
          carbs: food.carbs,
          mealType: selectedMeal,
        }),
      });
      const record = await res.json();
      setRecords((prev) => [...prev, record]);
      setSearch("");
    } catch {
      setError("添加食物失败，请重试");
    }
  }

  async function deleteRecord(id: string) {
    try {
      await fetch(`/api/calorie?id=${id}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("删除失败，请重试");
    }
    setDeleteId(null);
  }

  async function handleConfirmDelete() {
    if (deleteId) deleteRecord(deleteId);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setAnalyzeResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!imagePreview) return;
    setAnalyzing(true);
    setAnalyzeResult(null);
    setError(null);
    try {
      const res = await fetch("/api/calorie/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "识别失败，请重试");
        return;
      }
      setAnalyzeResult(data);
    } catch {
      setError("AI 识别请求失败，请检查网络");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAddResult() {
    if (!analyzeResult) return;
    setAddingResult(true);
    setError(null);
    try {
      const res = await fetch("/api/calorie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: analyzeResult.name,
          calories: analyzeResult.calories,
          protein: analyzeResult.protein,
          fat: analyzeResult.fat,
          carbs: analyzeResult.carbs,
          mealType: selectedMeal,
        }),
      });
      const record = await res.json();
      setRecords((prev) => [...prev, record]);
      setImageFile(null);
      setImagePreview(null);
      setAnalyzeResult(null);
    } catch {
      setError("添加记录失败，请重试");
    } finally {
      setAddingResult(false);
    }
  }

  async function loadSuggestion() {
    setSuggestLoading(true);
    try {
      const res = await fetch("/api/calorie/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalCalories,
          totalProtein,
          totalFat,
          totalCarbs,
          records,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuggest(data);
      }
    } catch {
      //
    } finally {
      setSuggestLoading(false);
    }
  }

  const mealLabel = (key: string) => meals.find((m) => m.key === key)?.label || key;

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-2xl lg:mx-auto">
      <header className="flex items-center gap-3 mb-5 pt-2">
        <Apple size={22} className="text-primary" />
        <h1 className="text-xl font-bold">热量管理</h1>
      </header>

      {error && (
        <div className="glass-card p-3 mb-4 bg-red-500/10 flex items-center justify-between fade-in border-red-500/30">
          <span className="text-xs text-red-500">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="glass-card p-4 mb-4">
        <div className="text-center mb-2">
          <p className="text-3xl font-bold text-primary">{totalCalories}</p>
          <p className="text-xs text-muted-foreground">今日摄入 (kcal)</p>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${caloriePercent}%`,
              background: caloriePercent > 80
                ? "linear-gradient(90deg, #f97316, #ef4444)"
                : "linear-gradient(90deg, var(--primary), var(--accent))",
            }}
          />
        </div>
        <p className="text-[10px] text-center text-muted-foreground">
          目标 2000kcal · {caloriePercent.toFixed(0)}%
        </p>
        <div className="grid grid-cols-3 gap-2 text-center mt-3">
          <div className="glass-card p-2">
            <p className="text-sm font-bold text-blue-500">{totalProtein.toFixed(1)}g</p>
            <p className="text-[10px] text-muted-foreground">蛋白质</p>
          </div>
          <div className="glass-card p-2">
            <p className="text-sm font-bold text-yellow-500">{totalFat.toFixed(1)}g</p>
            <p className="text-[10px] text-muted-foreground">脂肪</p>
          </div>
          <div className="glass-card p-2">
            <p className="text-sm font-bold text-orange-500">{totalCarbs.toFixed(1)}g</p>
            <p className="text-[10px] text-muted-foreground">碳水</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 mb-4">
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <Sparkles size={12} className="text-primary" />
          AI 食物识别
        </p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="glass-button-outline flex-1 py-2 text-sm flex items-center justify-center gap-1.5"
          >
            <Camera size={14} />
            拍照识别
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="glass-button-outline flex-1 py-2 text-sm flex items-center justify-center gap-1.5"
          >
            <ImageIcon size={14} />
            从相册选择
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {imagePreview && (
          <div className="fade-in">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={imagePreview}
                alt="预览"
                className="w-16 h-16 rounded-xl object-cover border border-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{imageFile?.name || "已选择图片"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {imageFile?.size ? `${(imageFile.size / 1024).toFixed(1)} KB` : ""}
                </p>
              </div>
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setAnalyzeResult(null);
                }}
                className="text-muted-foreground hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>

            {!analyzing && !analyzeResult && (
              <button onClick={handleAnalyze} className="glass-button w-full py-2 text-sm">
                <Sparkles size={14} className="inline mr-1" />
                开始识别
              </button>
            )}

            {analyzing && (
              <div className="glass-card p-4 text-center flex items-center justify-center gap-2">
                <Loader2 size={18} className="text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">AI 正在识别中... 🔍</span>
              </div>
            )}

            {analyzeResult && !analyzing && (
              <div className="glass-card p-4 fade-in">
                <p className="text-lg font-bold mb-1">{analyzeResult.name}</p>
                <p className="text-2xl font-bold text-primary mb-3">{analyzeResult.calories} kcal</p>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="glass-card p-2">
                    <p className="text-xs font-bold text-blue-500">{analyzeResult.protein}g</p>
                    <p className="text-[10px] text-muted-foreground">蛋白质</p>
                  </div>
                  <div className="glass-card p-2">
                    <p className="text-xs font-bold text-yellow-500">{analyzeResult.fat}g</p>
                    <p className="text-[10px] text-muted-foreground">脂肪</p>
                  </div>
                  <div className="glass-card p-2">
                    <p className="text-xs font-bold text-orange-500">{analyzeResult.carbs}g</p>
                    <p className="text-[10px] text-muted-foreground">碳水</p>
                  </div>
                </div>
                {analyzeResult.suggestion && (
                  <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                    💡 {analyzeResult.suggestion}
                  </p>
                )}
                <button
                  onClick={handleAddResult}
                  disabled={addingResult}
                  className="glass-button w-full py-2 text-sm flex items-center justify-center gap-1.5"
                >
                  {addingResult ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      添加中...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      添加到记录
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {meals.map((meal) => (
          <button
            key={meal.key}
            onClick={() => setSelectedMeal(meal.key)}
            className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
              selectedMeal === meal.key
                ? "bg-primary text-primary-foreground"
                : "glass-card text-muted-foreground"
            }`}
          >
            {meal.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索食物..."
            className="glass-input px-4 py-2 pl-8 text-sm w-full"
          />
        </div>
      </div>

      {search && (
        <div className="flex flex-col gap-2 mb-4">
          {filteredFoods.map(([name, data]) => (
            <button
              key={name}
              onClick={() => addFood(name)}
              className="glass-card p-3 flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-[10px] text-muted-foreground">
                  蛋白质{data.protein}g · 脂肪{data.fat}g · 碳水{data.carbs}g
                </p>
              </div>
              <span className="text-sm font-bold text-primary">{data.calories}kcal</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {records.map((record) => (
          <div key={record.id} className="glass-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{record.foodName}</p>
              <p className="text-[10px] text-muted-foreground">{mealLabel(record.mealType)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">{record.calories}kcal</span>
              <button onClick={() => setDeleteId(record.id)} className="text-muted-foreground hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {records.length === 0 && !loading && (
          <p className="text-center text-sm text-muted-foreground py-8">搜索食物或拍照识别添加到今日记录</p>
        )}
      </div>

      {records.length > 0 && (
        <div className="glass-card p-4 mt-4 fade-in" style={{
          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(236, 72, 153, 0.06))",
        }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">AI 饮食建议</p>
              <p className="text-[10px] text-muted-foreground">每日目标 2000kcal</p>
            </div>
          </div>
          {suggestLoading && (
            <div className="flex items-center gap-2 py-3">
              <Loader2 size={14} className="text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">AI 正在分析中...</span>
            </div>
          )}
          {suggest && !suggestLoading && (
            <>
              <p className="text-sm leading-relaxed mb-2">{suggest.suggestion}</p>
              <p className="text-[10px] text-muted-foreground">{suggest.calorieAdvice}</p>
            </>
          )}
          {!suggest && !suggestLoading && (
            <p className="text-xs text-muted-foreground py-2">保持均衡饮食，多吃蔬菜水果哦。</p>
          )}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center fade-in">
          <div className="glass-card p-6 mx-4 max-w-xs w-full text-center slide-up">
            <p className="text-lg font-bold mb-2">确认删除</p>
            <p className="text-sm text-muted-foreground mb-5">删除后无法恢复，确定要删除吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="glass-button-outline flex-1 py-2 text-sm">取消</button>
              <button onClick={handleConfirmDelete} className="glass-button bg-red-500 text-white flex-1 py-2 text-sm">删除</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}