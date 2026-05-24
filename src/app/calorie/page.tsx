"use client";

import { useState, useEffect } from "react";
import { Apple, Plus, Camera, Search, Trash2 } from "lucide-react";

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

export default function CaloriePage() {
  const [search, setSearch] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("lunch");
  const [records, setRecords] = useState<CalorieRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredFoods = Object.entries(foodDatabase).filter(([name]) =>
    name.includes(search)
  );

  const totalCalories = records.reduce((sum, r) => sum + r.calories, 0);
  const totalProtein = records.reduce((sum, r) => sum + r.protein, 0);
  const totalFat = records.reduce((sum, r) => sum + r.fat, 0);
  const totalCarbs = records.reduce((sum, r) => sum + r.carbs, 0);

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
    } catch {}
  }

  async function deleteRecord(id: string) {
    try {
      await fetch(`/api/calorie?id=${id}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  }

  const mealLabel = (key: string) => meals.find((m) => m.key === key)?.label || key;

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center gap-3 mb-5 pt-2">
        <Apple size={22} className="text-primary" />
        <h1 className="text-xl font-bold">热量管理</h1>
      </header>

      <div className="glass-card p-4 mb-4">
        <div className="text-center mb-3">
          <p className="text-3xl font-bold text-primary">{totalCalories}</p>
          <p className="text-xs text-muted-foreground">今日摄入 (kcal)</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
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
              <button onClick={() => deleteRecord(record.id)} className="text-muted-foreground hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {records.length === 0 && !loading && (
          <p className="text-center text-sm text-muted-foreground py-8">搜索食物添加到今日记录</p>
        )}
      </div>
    </main>
  );
}
