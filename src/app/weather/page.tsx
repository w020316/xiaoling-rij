"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, CloudSun, Search, MapPin, X, Droplets, Wind, Thermometer, Eye, Gauge, Sun, Navigation, RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  getStoredWeather,
  setStoredWeather,
  getStoredCity,
  setStoredCity,
  getStoredGeoLocation,
  setStoredGeoLocation,
  StoredWeatherCache,
} from "@/lib/weather-cache";
import { getWeatherIcon } from "@/lib/open-meteo";

interface CityItem {
  id: string;
  name: string;
  adm1: string;
  adm2: string;
  country: string;
  lat: number;
  lon: number;
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
  city?: string;
  aiTip?: string;
  uvIndex?: string;
  vis?: string;
  pressure?: string;
  precip?: string;
  isDay?: boolean;
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
  precipProbability?: string;
  uvIndexMax?: string;
}

// 根据天气和温度生成动态背景渐变
function getWeatherBackground(temp: number, desc: string, isDay?: boolean): string {
  if (isDay === false) {
    return "from-indigo-900 via-purple-900 to-slate-900";
  }
  if (temp >= 30) return "from-orange-400 via-red-400 to-pink-400";
  if (temp >= 25) return "from-yellow-300 via-orange-300 to-pink-300";
  if (temp >= 18) return "from-green-300 via-teal-300 to-cyan-300";
  if (temp >= 10) return "from-blue-300 via-cyan-300 to-teal-300";
  if (temp >= 0) return "from-slate-400 via-blue-400 to-indigo-400";
  return "from-slate-500 via-blue-600 to-indigo-700";
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
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

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
        city: cached.city,
      });
    }

    // 优先用缓存城市，否则尝试定位
    if (savedCity.locationId) {
      fetchWeather(savedCity.locationId);
    } else {
      const cachedGeo = getStoredGeoLocation();
      if (cachedGeo) {
        fetchWeatherByLocation(cachedGeo.lat, cachedGeo.lon);
      } else {
        autoLocate();
      }
    }
  }, []);

  function autoLocate() {
    setLocateError(null);
    const cachedGeo = getStoredGeoLocation();
    if (cachedGeo) {
      fetchWeatherByLocation(cachedGeo.lat, cachedGeo.lon);
      return;
    }

    if (!navigator.geolocation) {
      setLocateError("您的浏览器不支持定位，已为你通过 IP 定位");
      // 降级：交给服务端 IP 定位
      fetchWeatherByIpFallback();
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setStoredGeoLocation(latitude, longitude);
        fetchWeatherByLocation(latitude, longitude);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        // 降级：定位失败时调用服务端 IP 定位兜底，确保天气仍能显示
        fetchWeatherByIpFallback();
        if (err.code === err.PERMISSION_DENIED) {
          setLocateError("定位权限被拒绝，已为你切换到 IP 大致定位，也可手动搜索城市");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocateError("定位信息不可用，已为你切换到 IP 大致定位");
        } else if (err.code === err.TIMEOUT) {
          setLocateError("定位超时，已为你切换到 IP 大致定位");
        } else {
          setLocateError("定位失败，已为你切换到 IP 大致定位");
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }

  // IP 定位兜底：无坐标请求 /api/weather，服务端通过 x-forwarded-for 定位
  async function fetchWeatherByIpFallback() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?forecast=true`);
      const data = await res.json();
      if (data.temp && data.temp === "--") {
        setError("获取天气数据失败，请手动搜索城市");
        return;
      }
      setWeather(data);
      if (data.forecast) {
        setForecast(data.forecast);
      }
      if (data.city && data.locationId) {
        setCurrentCity({ city: data.city, locationId: data.locationId });
        setStoredCity(data.city, data.locationId);
      }
      setStoredWeather({
        id: data.locationId || "",
        city: data.city || "",
        locationId: data.locationId || "",
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
  }

  async function fetchWeatherByLocation(lat: number, lon: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}&forecast=true`);
      const data = await res.json();
      if (data.temp && data.temp === "--") {
        setError("获取天气数据失败，请稍后重试");
        return;
      }
      setWeather(data);

      if (data.forecast) {
        setForecast(data.forecast);
      }

      if (data.city && data.locationId) {
        setCurrentCity({ city: data.city, locationId: data.locationId });
        setStoredCity(data.city, data.locationId);
      }

      setStoredWeather({
        id: data.locationId || "",
        city: data.city || "",
        locationId: data.locationId || "",
        temperature: data.temp,
        feelsLike: data.feelsLike,
        description: data.desc,
        icon: data.emoji,
        humidity: data.humidity,
        windDir: data.windDir,
        windScale: data.windScale,
        advice: data.aiTip || "",
        fetchedAt: new Date().toISOString(),
        lat,
        lon,
      });
    } catch {
      setError("获取天气失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }

  const fetchWeather = useCallback(async (locationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?locationId=${encodeURIComponent(locationId)}&forecast=true`);
      const data = await res.json();
      if (data.temp && data.temp === "--") {
        setError("获取天气数据失败，请稍后重试");
        return;
      }
      setWeather(data);

      if (data.forecast) {
        setForecast(data.forecast);
      }

      setStoredWeather({
        id: locationId,
        city: currentCity.city || data.city || "",
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
    const locationId = `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`;
    setCurrentCity({ city: label, locationId });
    setStoredCity(label, locationId);
    setCities([]);
    setShowCityPicker(false);
    setSearchKeyword("");
    // 直接用经纬度获取天气
    fetchWeatherByLocation(city.lat, city.lon);
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

  const tempNum = weather ? parseInt(weather.temp) : 20;
  const bgGradient = getWeatherBackground(tempNum, weather?.desc || "", weather?.isDay);

  return (
    <main className="min-h-screen p-5 lg:p-8 pb-28 lg:pb-8 lg:max-w-2xl lg:mx-auto">
      {/* 动态背景层 */}
      <div className={`fixed inset-0 -z-10 bg-gradient-to-br ${bgGradient} opacity-35 transition-all duration-1000`} />

      <header className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/" className="p-1 -ml-1 rounded-xl hover:bg-muted/50 transition-colors">
          <ArrowLeft size={22} className="text-primary" />
        </Link>
        <h1 className="text-xl font-bold flex-1">天气</h1>
        <button
          onClick={autoLocate}
          disabled={locating}
          className="glass-button px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
          title="重新定位"
        >
          {locating ? <RefreshCw size={14} className="animate-spin" /> : <Navigation size={14} />}
          {locating ? "定位中" : "定位"}
        </button>
      </header>

      {/* 定位失败提示 */}
      {locateError && (
        <div className="glass-card p-3 mb-4 bg-amber-500/10 border-amber-400/30 fade-in">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-amber-600 dark:text-amber-400">{locateError}</p>
              <button onClick={() => { setLocateError(null); }} className="text-xs text-primary hover:underline mt-1">
                知道了，我去搜索城市
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card p-3 mb-4 bg-red-500/10 flex items-center justify-between fade-in">
          <span className="text-xs text-red-500">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* 搜索区 */}
        <section className="glass-card p-4 fade-in">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜索城市（如：北京、上海、杭州）"
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

        {/* 城市选择 */}
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
                  <span className="text-xs text-muted-foreground">{city.country}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 加载中 */}
        {loading && (
          <section className="glass-card p-6 fade-in">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">获取实时天气数据...</p>
            </div>
          </section>
        )}

        {/* 天气主卡片 */}
        {weather && !loading && (
          <>
            <section className="glass-card p-6 fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-bold gradient-text">{weather.temp}</span>
                      <span className="text-2xl text-muted-foreground">°C</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      体感 {weather.feelsLike}°C
                    </p>
                    <p className="text-base font-medium mt-2 flex items-center gap-2">
                      <span className="text-2xl">{weather.emoji}</span>
                      <span>{weather.desc}</span>
                    </p>
                    {weather.city && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin size={10} /> {weather.city}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                      <Droplets size={12} /> {weather.humidity}% 湿度
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                      <Wind size={12} /> {weather.windDir}风 {weather.windScale}级
                    </div>
                    {weather.vis && weather.vis !== "--" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <Eye size={12} /> {weather.vis}km 能见度
                      </div>
                    )}
                    {weather.pressure && weather.pressure !== "--" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <Gauge size={12} /> {weather.pressure}hPa
                      </div>
                    )}
                  </div>
                </div>

                {weather.aiTip && (
                  <div className="glass-card p-3 mt-3 bg-primary/8 border-primary/20">
                    <p className="text-sm text-center">
                      <span className="mr-1">💡</span>
                      {weather.aiTip}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 生活指数 */}
            {weather.uvIndex && weather.uvIndex !== "--" && (
              <section className="glass-card p-4 fade-in stagger-1">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Sun size={16} className="text-primary" /> 生活指数
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  <div className="glass-card p-3 text-center">
                    <p className="text-xs text-muted-foreground">紫外线</p>
                    <p className="text-lg font-bold text-primary mt-1">{weather.uvIndex}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {parseFloat(weather.uvIndex) >= 6 ? "强" : parseFloat(weather.uvIndex) >= 3 ? "中" : "弱"}
                    </p>
                  </div>
                  {weather.precip && weather.precip !== "--" && (
                    <div className="glass-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">降水量</p>
                      <p className="text-lg font-bold text-blue-500 mt-1">{weather.precip}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">mm</p>
                    </div>
                  )}
                  {weather.advice && (
                    <div className="glass-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">穿衣</p>
                      <p className="text-lg mt-1">{weather.advice.icon}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{weather.advice.level}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 穿衣建议 */}
            {weather.advice && (
              <section className="glass-card p-4 fade-in stagger-1">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Thermometer size={16} className="text-primary" />
                  气温建议
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {weather.advice.icon} {weather.advice.level}
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-2">
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

            {/* 7天预报 */}
            {forecast.length > 0 && (
              <section className="glass-card p-4 fade-in stagger-2">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <CloudSun size={16} className="text-primary" /> 7天预报
                </h2>
                <div className="flex flex-col gap-1">
                  {forecast.map((day) => (
                    <div
                      key={day.fxDate}
                      className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0"
                    >
                      <div className="w-20">
                        <p className="text-xs font-medium">{formatDate(day.fxDate)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-1 justify-center">
                        <span className="text-lg">{getWeatherIcon(day.iconDay)}</span>
                        <span className="text-xs text-muted-foreground">{day.textDay}</span>
                        {day.precipProbability && parseFloat(day.precipProbability) > 0 && (
                          <span className="text-[10px] text-blue-500">{day.precipProbability}%</span>
                        )}
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

        {/* 空状态 */}
        {!loading && !weather && !showCityPicker && (
          <section className="glass-card p-8 fade-in text-center">
            <CloudSun size={48} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground mb-3">
              {locating ? "正在获取您的位置..." : "获取天气需要定位或搜索城市"}
            </p>
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={autoLocate}
                disabled={locating}
                className="glass-button px-4 py-2 text-sm flex items-center gap-2"
              >
                {locating ? <RefreshCw size={14} className="animate-spin" /> : <Navigation size={14} />}
                {locating ? "定位中..." : "点击定位"}
              </button>
              <p className="text-xs text-muted-foreground">或在上方搜索框输入城市名</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
