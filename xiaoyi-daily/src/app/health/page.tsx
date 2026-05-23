"use client";

import { useState, useEffect } from "react";
import {
  Droplets, Dumbbell, Apple, Moon, Thermometer,
  Plus, Camera, Sparkles
} from "lucide-react";

interface CalorieRecord {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  mealType: string;
}

interface PeriodRecord {
  id: string;
  startDate: string;
  endDate: string | null;
  cycleDays: number;
  symptoms: string | null;
}

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState<"water" | "exercise" | "calorie" | "period">("water");
  const [waterCups, setWaterCups] = useState(0);
  const [calorieRecords, setCalorieRecords] = useState<CalorieRecord[]>([]);
  const [periodRecords, setPeriodRecords] = useState<PeriodRecord[]>([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [newFood, setNewFood] = useState({ foodName: "", calories: 0, protein: 0, fat: 0, carbs: 0, mealType: "lunch" });
  const [newPeriod, setNewPeriod] = useState({ startDate: "", cycleDays: 28, symptoms: "" });

  useEffect(() => {
    if (activeTab === "calorie") {
      fetch("/api/calorie").then((r) => r.json()).then(setCalorieRecords);
    }
    if (activeTab === "period") {
      fetch("/api/health/period").then((r) => r.json()).then(setPeriodRecords);
    }
  }, [activeTab]);

  useEffect(() => {
    const saved = localStorage.getItem("lovedaily-water");
    const today = new Date().toDateString();
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === today) setWaterCups(data.cups);
    }
  }, []);

  function updateWater(cups: number) {
    setWaterCups(cups);
    localStorage.setItem("lovedaily-water", JSON.stringify({ date: new Date().toDateString(), cups }));
  }

  async function addFoodRecord() {
    if (!newFood.foodName) return;
    await fetch("/api/calorie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFood),
    });
    setShowAddFood(false);
    setNewFood({ foodName: "", calories: 0, protein: 0, fat: 0, carbs: 0, mealType: "lunch" });
    const res = await fetch("/api/calorie");
    setCalorieRecords(await res.json());
  }

  async function addPeriodRecord() {
    if (!newPeriod.startDate) return;
    await fetch("/api/health/period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPeriod),
    });
    setShowAddPeriod(false);
    setNewPeriod({ startDate: "", cycleDays: 28, symptoms: "" });
    const res = await fetch("/api/health/period");
    setPeriodRecords(await res.json());
  }

  const totalCalories = calorieRecords.reduce((sum, c) => sum + c.calories, 0);
  const totalProtein = calorieRecords.reduce((sum, c) => sum + c.protein, 0);
  const totalFat = calorieRecords.reduce((sum, c) => sum + c.fat, 0);
  const totalCarbs = calorieRecords.reduce((sum, c) => sum + c.carbs, 0);

  const lastPeriod = periodRecords[0];
  let nextPeriodDate: Date | null = null;
  if (lastPeriod) {
    nextPeriodDate = new Date(lastPeriod.startDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + lastPeriod.cycleDays);
  }

  return (
    <main className="min-h-screen p-5 pb-28">
      <header className="flex items-center gap-3 mb-5 pt-2">
        <Thermometer size={22} className="text-primary" />
        <h1 className="text-xl font-bold">健康管理</h1>
      </header>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { key: "water", label: "💧 喝水" },
          { key: "exercise", label: "🏃 运动" },
          { key: "calorie", label: "🍎 热量" },
          { key: "period", label: "🌸 生理期" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "water" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 text-center">
            <p className="text-5xl mb-3">💧</p>
            <h2 className="text-3xl font-bold text-primary">{waterCups}/8</h2>
            <p className="text-sm text-muted-foreground mt-1">杯水</p>
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <button key={i} onClick={() => updateWater(i + 1)}
                  className={`w-8 h-10 rounded-lg transition-all ${i < waterCups ? "bg-blue-400 text-white" : "bg-muted text-muted-foreground"} flex items-center justify-center text-xs`}>
                  💧
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4 justify-center">
              <button onClick={() => updateWater(Math.max(0, waterCups - 1))} className="glass-button-outline px-4 py-2 text-xs">-1 杯</button>
              <button onClick={() => updateWater(Math.min(8, waterCups + 1))} className="glass-button px-4 py-2 text-xs">+1 杯</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "exercise" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 text-center">
            <p className="text-5xl mb-3">🏃</p>
            <h2 className="text-3xl font-bold text-primary">30</h2>
            <p className="text-sm text-muted-foreground mt-1">分钟运动</p>
          </div>
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3">今日运动</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm"><span>🏃 跑步</span><span className="text-muted-foreground">20 分钟</span></div>
              <div className="flex items-center justify-between text-sm"><span>🧘 瑜伽</span><span className="text-muted-foreground">10 分钟</span></div>
            </div>
          </div>
          <button className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2"><Plus size={16} /> 记录运动</button>
        </div>
      )}

      {activeTab === "calorie" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-4">
            <div className="text-center mb-3">
              <p className="text-3xl font-bold text-primary">{totalCalories}</p>
              <p className="text-xs text-muted-foreground">今日摄入 (kcal)</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="glass-card p-2"><p className="text-sm font-bold text-blue-500">{totalProtein.toFixed(1)}g</p><p className="text-[10px] text-muted-foreground">蛋白质</p></div>
              <div className="glass-card p-2"><p className="text-sm font-bold text-yellow-500">{totalFat.toFixed(1)}g</p><p className="text-[10px] text-muted-foreground">脂肪</p></div>
              <div className="glass-card p-2"><p className="text-sm font-bold text-orange-500">{totalCarbs.toFixed(1)}g</p><p className="text-[10px] text-muted-foreground">碳水</p></div>
            </div>
          </div>

          <button onClick={() => setShowAddFood(true)} className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2"><Plus size={16} /> 手动记录</button>

          {showAddFood && (
            <div className="glass-card p-4 flex flex-col gap-3">
              <input type="text" value={newFood.foodName} onChange={(e) => setNewFood({ ...newFood, foodName: e.target.value })} placeholder="食物名称" className="glass-input px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={newFood.calories || ""} onChange={(e) => setNewFood({ ...newFood, calories: Number(e.target.value) })} placeholder="热量(kcal)" className="glass-input px-3 py-2 text-sm" />
                <select value={newFood.mealType} onChange={(e) => setNewFood({ ...newFood, mealType: e.target.value })} className="glass-input px-3 py-2 text-sm">
                  <option value="breakfast">早餐</option>
                  <option value="lunch">午餐</option>
                  <option value="dinner">晚餐</option>
                  <option value="snack">加餐</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={newFood.protein || ""} onChange={(e) => setNewFood({ ...newFood, protein: Number(e.target.value) })} placeholder="蛋白质g" className="glass-input px-3 py-2 text-sm" />
                <input type="number" value={newFood.fat || ""} onChange={(e) => setNewFood({ ...newFood, fat: Number(e.target.value) })} placeholder="脂肪g" className="glass-input px-3 py-2 text-sm" />
                <input type="number" value={newFood.carbs || ""} onChange={(e) => setNewFood({ ...newFood, carbs: Number(e.target.value) })} placeholder="碳水g" className="glass-input px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={addFoodRecord} className="glass-button flex-1 py-2 text-xs">保存</button>
                <button onClick={() => setShowAddFood(false)} className="glass-button-outline flex-1 py-2 text-xs">取消</button>
              </div>
            </div>
          )}

          {calorieRecords.map((record) => (
            <div key={record.id} className="glass-card p-3 flex items-center justify-between">
              <div><p className="text-sm font-medium">{record.foodName}</p><p className="text-[10px] text-muted-foreground">{record.mealType === "breakfast" ? "早餐" : record.mealType === "lunch" ? "午餐" : record.mealType === "dinner" ? "晚餐" : "加餐"}</p></div>
              <p className="text-sm font-bold text-primary">{record.calories}kcal</p>
            </div>
          ))}

          {calorieRecords.length === 0 && !showAddFood && (
            <p className="text-center text-sm text-muted-foreground py-8">还没有记录，点击上方添加 🍎</p>
          )}
        </div>
      )}

      {activeTab === "period" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 text-center">
            <p className="text-5xl mb-3">🌸</p>
            <h2 className="text-lg font-bold text-primary">生理期追踪</h2>
            {nextPeriodDate && (
              <p className="text-sm text-muted-foreground mt-1">
                预计下次经期还有 {Math.max(0, Math.ceil((nextPeriodDate.getTime() - Date.now()) / 86400000))} 天
              </p>
            )}
          </div>

          <button onClick={() => setShowAddPeriod(true)} className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2"><Plus size={16} /> 记录经期</button>

          {showAddPeriod && (
            <div className="glass-card p-4 flex flex-col gap-3">
              <input type="date" value={newPeriod.startDate} onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })} className="glass-input px-3 py-2 text-sm" />
              <input type="number" value={newPeriod.cycleDays} onChange={(e) => setNewPeriod({ ...newPeriod, cycleDays: Number(e.target.value) })} placeholder="周期天数" className="glass-input px-3 py-2 text-sm" />
              <input type="text" value={newPeriod.symptoms} onChange={(e) => setNewPeriod({ ...newPeriod, symptoms: e.target.value })} placeholder="症状（可选）" className="glass-input px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={addPeriodRecord} className="glass-button flex-1 py-2 text-xs">保存</button>
                <button onClick={() => setShowAddPeriod(false)} className="glass-button-outline flex-1 py-2 text-xs">取消</button>
              </div>
            </div>
          )}

          {lastPeriod && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold mb-3">AI 预测</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between"><span>上次经期</span><span className="text-primary">{new Date(lastPeriod.startDate).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>周期</span><span className="text-muted-foreground">{lastPeriod.cycleDays} 天</span></div>
                {nextPeriodDate && <div className="flex justify-between"><span>下次预计</span><span className="text-primary">{nextPeriodDate.toLocaleDateString()}</span></div>}
              </div>
            </div>
          )}

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3">健康建议</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>🥗 饮食：多补充铁质和维生素B</p>
              <p>🏃 运动：适度散步，避免剧烈运动</p>
              <p>😌 情绪：保持心情舒畅，适当休息</p>
              <p>🧴 护理：注意保暖，避免生冷食物</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
