"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, CloudSun, Search, MapPin, X, Droplets, Wind, Thermometer } from "lucide-react";
import Link from "next/link";
import {
  getStoredWeather,
  setStoredWeather,
  getStoredCity,
  setStoredCity,
  StoredWeatherCache,
} from "@/lib/weather-cache";
import { getWeatherIcon } from "@/lib/qweather";

interface CityItem {
  id: string;
  name: string;
  adm1: string;
  adm2: string;
}

interface WeatherData {
  temp: string;
  feelsLike: string;
  desc: string;
  emoji: string;
  icon: string;
  humidity: string;
  windDir: string;
  windScale: string;
  locationId: string;
  aiTip?: string;
  advice?: {
    level: string;
    icon: string;
    clothing: string;
    activity: string;
    health: string;
  };
  forecast?: ForecastDay[];
}

interface ForecastDay {
  fxDate: string;
  tempMax: string;
  tempMin: string;
  textDay: string;
  iconDay: string;
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [cities, setCities] = useState<CityItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState<{ city: string; locationId: string }>({ city: "", locationId: "" });
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    const savedCity = getStoredCity();
    setCurrentCity(savedCity);

    const cached = getStoredWeather();
    if (cached) {
      setWeather({
        temp: cached.temperature,
        feelsLike: cached.feelsLike,
        desc: cached.description,
        emoji: cached.icon,
        icon: "",
        humidity: cached.humidity,
        windDir: cached.windDir,
        windScale: cached.windScale,
        locationId: cached.locationId,
        aiTip: cached.advice,
      });
    }

    if (savedCity.locationId) {
      fetchWeather(savedCity.locationId);
    }
  }, []);

  const fetchWeather = useCallback(async (locationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?locationId=${locationId}&forecast=true`);
      const data = await res.json();

      setWeather(data);

      if (data.forecast) {
        setForecast(data.forecast);
      }

      setStoredWeather({
        id: locationId,
        city: currentCity.city || data.desc,
        locationId,
        temperature: data.temp,
        feelsLike: data.feelsLike,
        description: data.desc,
        icon: data.emoji,
        humidity: data.humidity,
        windDir: data.windDir,
        windScale: data.windScale,
        advice: data.aiTip || "",
        fetchedAt: new Date().toISOString(),
      });
    } catch {
      setError("获取天气失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }, [currentCity.city]);

  async function handleSearch() {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", keyword: searchKeyword.trim() }),
      });
      const data = await res.json();
      if (data.cities && data.cities.length > 0) {
        setCities(data.cities);
        setShowCityPicker(true);
      } else {
        setError("未找到匹配的城市，请尝试其他关键词");
      }
    } catch {
      setError("搜索城市失败，请重试");
    } finally {
      setSearching(false);
    }
  }

  function selectCity(city: CityItem) {
    const label = city.adm1 ? `${city.name}，${city.adm1}` : city.name;
    setCurrentCity({ city: label, locationId: city.id });
    setStoredCity(label, city.id);
    setCities([]);
    setShowCityPicker(false);
    setSearchKeyword("");
    fetchWeather(city.id);
  }

  function closeCityPicker() {
    setShowCityPicker(false);
    setCities([]);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr.replace(/-/g, "/"));
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = weekdays[d.getDay()];
    return `${month}/${day} ${weekday}`;
  }

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-2xl lg:mx-auto">
      <header className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/profile" className="p-1 -ml-1 rounded-xl hover:bg-muted/50 transition-colors">
          <ArrowLeft size={22} className="text-primary" />
        </Link>
        <h1 className="text-xl font-bold">天气</h1>
      </header>

      {error && (
        <div className="glass-card p-3 mb-4 bg-red-500/10 flex items-center justify-between fade-in">
          <span className="text-xs text-red-500">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <section className="glass-card p-4 fade-in">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜索城市..."
                className="glass-input px-3 py-2.5 text-sm w-full pl-9"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchKeyword.trim()}
              className="glass-button px-4 py-2.5 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              {searching ? "搜索中..." : "搜索"}
            </button>
          </div>

          {currentCity.city && (
            <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
              <MapPin size={14} className="text-primary" />
              <span>{currentCity.city}</span>
            </div>
          )}
        </section>

        {showCityPicker && cities.length > 0 && (
          <section className="glass-card p-4 fade-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold">选择城市</h2>
              <button onClick={closeCityPicker} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => selectCity(city)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium">{city.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {city.adm1} {city.adm2}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{city.id}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {loading && (
          <section className="glass-card p-6 fade-in">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">加载天气数据...</p>
            </div>
          </section>
        )}

        {weather && !loading && (
          <>
            <section className="glass-card p-5 fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/8 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-5xl font-bold text-primary">
                      {weather.temp}<span className="text-2xl">°C</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      体感 {weather.feelsLike}°C
                    </p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1">
                      <span className="text-xl">{weather.emoji}</span> {weather.desc}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground justify-end">
                      <Droplets size={14} /> {weather.humidity}% 湿度
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground justify-end mt-1">
                      <Wind size={14} /> {weather.windDir}风 {weather.windScale}级
                    </div>
                  </div>
                </div>

                {weather.aiTip && (
                  <div className="glass-card p-3 mt-3 bg-purple-500/8 border-purple-400/20">
                    <p className="text-sm text-center">
                      <span className="mr-1">💡</span>
                      {weather.aiTip}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {weather.advice && (
              <section className="glass-card p-4 fade-in stagger-1">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Thermometer size={16} className="text-primary" />
                  气温建议
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {weather.advice.icon} {weather.advice.level}
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  <div className="glass-card p-3 flex items-start gap-3">
                    <span className="text-lg mt-0.5">👔</span>
                    <div>
                      <p className="text-xs font-bold mb-0.5">衣着</p>
                      <p className="text-xs text-muted-foreground">{weather.advice.clothing}</p>
                    </div>
                  </div>
                  <div className="glass-card p-3 flex items-start gap-3">
                    <span className="text-lg mt-0.5">🏃</span>
                    <div>
                      <p className="text-xs font-bold mb-0.5">运动</p>
                      <p className="text-xs text-muted-foreground">{weather.advice.activity}</p>
                    </div>
                  </div>
                  <div className="glass-card p-3 flex items-start gap-3">
                    <span className="text-lg mt-0.5">❤️</span>
                    <div>
                      <p className="text-xs font-bold mb-0.5">健康</p>
                      <p className="text-xs text-muted-foreground">{weather.advice.health}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {forecast.length > 0 && (
              <section className="glass-card p-4 fade-in stagger-2">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <CloudSun size={16} className="text-primary" /> 7天预报
                </h2>
                <div className="flex flex-col gap-2">
                  {forecast.map((day) => (
                    <div
                      key={day.fxDate}
                      className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-b-0"
                    >
                      <div className="w-24">
                        <p className="text-sm font-medium">{formatDate(day.fxDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getWeatherIcon(day.iconDay)}</span>
                        <span className="text-xs text-muted-foreground">{day.textDay}</span>
                      </div>
                      <div className="text-sm font-mono">
                        <span className="text-red-400">{day.tempMax}°</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-blue-400">{day.tempMin}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {!loading && !weather && !showCityPicker && (
          <section className="glass-card p-8 fade-in text-center">
            <CloudSun size={48} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              搜索城市即可查看天气详情
            </p>
          </section>
        )}
      </div>
    </main>
  );
}