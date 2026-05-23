"use client";

import { useState } from "react";
import {
  Droplets, Dumbbell, Apple, Moon, Thermometer,
  Plus, Camera, Sparkles
} from "lucide-react";

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState<"water" | "exercise" | "calorie" | "period">("water");
  const [waterCups, setWaterCups] = useState(4);

  const mockCalories = [
    { name: "鸡胸肉", calories: 165, protein: 31, fat: 3.6, carbs: 0, meal: "午餐" },
    { name: "米饭(一碗)", calories: 232, protein: 4.3, fat: 0.4, carbs: 51, meal: "午餐" },
    { name: "牛奶(250ml)", calories: 160, protein: 8, fat: 8, carbs: 12, meal: "早餐" },
  ];

  const totalCalories = mockCalories.reduce((sum, c) => sum + c.calories, 0);
  const totalProtein = mockCalories.reduce((sum, c) => sum + c.protein, 0);
  const totalFat = mockCalories.reduce((sum, c) => sum + c.fat, 0);
  const totalCarbs = mockCalories.reduce((sum, c) => sum + c.carbs, 0);

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
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "glass-card text-muted-foreground"
            }`}
          >
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
                <button
                  key={i}
                  onClick={() => setWaterCups(i + 1)}
                  className={`w-8 h-10 rounded-lg transition-all ${
                    i < waterCups
                      ? "bg-blue-400 text-white"
                      : "bg-muted text-muted-foreground"
                  } flex items-center justify-center text-xs`}
                >
                  💧
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={() => setWaterCups(Math.max(0, waterCups - 1))}
                className="glass-button-outline px-4 py-2 text-xs"
              >
                -1 杯
              </button>
              <button
                onClick={() => setWaterCups(Math.min(8, waterCups + 1))}
                className="glass-button px-4 py-2 text-xs"
              >
                +1 杯
              </button>
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
              <div className="flex items-center justify-between text-sm">
                <span>🏃 跑步</span>
                <span className="text-muted-foreground">20 分钟</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>🧘 瑜伽</span>
                <span className="text-muted-foreground">10 分钟</span>
              </div>
            </div>
          </div>
          <button className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> 记录运动
          </button>
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

          <div className="flex gap-2">
            <button className="glass-button flex-1 py-2 text-xs flex items-center justify-center gap-1">
              <Plus size={14} /> 手动记录
            </button>
            <button className="glass-button-outline flex-1 py-2 text-xs flex items-center justify-center gap-1">
              <Camera size={14} /> AI识图
            </button>
          </div>

          {mockCalories.map((item, i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.meal}</p>
                </div>
                <p className="text-sm font-bold text-primary">{item.calories} kcal</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "period" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 text-center">
            <p className="text-5xl mb-3">🌸</p>
            <h2 className="text-lg font-bold text-primary">生理期追踪</h2>
            <p className="text-sm text-muted-foreground mt-1">预计下次经期还有 12 天</p>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3">AI 预测</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span>下次经期</span>
                <span className="text-primary">6月4日</span>
              </div>
              <div className="flex justify-between">
                <span>排卵期</span>
                <span className="text-muted-foreground">5月22日-5月27日</span>
              </div>
              <div className="flex justify-between">
                <span>易水肿期</span>
                <span className="text-muted-foreground">5月30日-6月3日</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3">AI 建议</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>🥗 饮食：多补充铁质和维生素B</p>
              <p>🏃 运动：适度散步，避免剧烈运动</p>
              <p>😌 情绪：保持心情舒畅，适当休息</p>
              <p>🧴 护理：注意保暖，避免生冷食物</p>
            </div>
          </div>

          <button className="glass-button-outline py-2 text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> 记录经期
          </button>
        </div>
      )}
    </main>
  );
}
