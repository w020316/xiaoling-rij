// Open-Meteo 免费天气 API（无需 key、支持经纬度精准定位）
// 文档: https://open-meteo.com/en/docs
// 优势: 无需 API key、HTTPS 可用、全球覆盖、精度高

export interface OpenMeteoCurrent {
  temp: string;
  feelsLike: string;
  desc: string;
  emoji: string;
  icon: string;
  humidity: string;
  windDir: string;
  windScale: string;
  precip: string;
  vis: string;
  pressure: string;
  cloud: string;
  uvIndex: string;
  isDay: boolean;
}

export interface OpenMeteoDaily {
  fxDate: string;
  tempMax: string;
  tempMin: string;
  textDay: string;
  iconDay: string;
  sunrise: string;
  sunset: string;
  humidity: string;
  windDirDay: string;
  windScaleDay: string;
  precipProbability: string;
  uvIndexMax: string;
}

export interface GeoLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  adm1: string; // 省
  adm2: string; // 市
  country: string;
}

// WMO 天气代码映射
const WMO_CODE_MAP: Record<number, { text: string; emoji: string; icon: string }> = {
  0: { text: "晴", emoji: "☀️", icon: "100" },
  1: { text: "晴间多云", emoji: "🌤️", icon: "101" },
  2: { text: "多云", emoji: "⛅", icon: "102" },
  3: { text: "阴", emoji: "☁️", icon: "104" },
  45: { text: "有雾", emoji: "🌫️", icon: "500" },
  48: { text: "雾凇", emoji: "🌫️", icon: "501" },
  51: { text: "毛毛雨", emoji: "🌦️", icon: "300" },
  53: { text: "毛毛雨", emoji: "🌦️", icon: "301" },
  55: { text: "毛毛雨", emoji: "🌧️", icon: "302" },
  56: { text: "冻毛毛雨", emoji: "🌨️", icon: "304" },
  57: { text: "冻毛毛雨", emoji: "🌨️", icon: "305" },
  61: { text: "小雨", emoji: "🌦️", icon: "306" },
  63: { text: "中雨", emoji: "🌧️", icon: "307" },
  65: { text: "大雨", emoji: "🌧️", icon: "310" },
  66: { text: "冻雨", emoji: "🌨️", icon: "311" },
  67: { text: "冻雨", emoji: "🌨️", icon: "312" },
  71: { text: "小雪", emoji: "🌨️", icon: "400" },
  73: { text: "中雪", emoji: "❄️", icon: "401" },
  75: { text: "大雪", emoji: "❄️", icon: "402" },
  77: { text: "阵雪", emoji: "🌨️", icon: "404" },
  80: { text: "阵雨", emoji: "🌦️", icon: "300" },
  81: { text: "阵雨", emoji: "🌧️", icon: "301" },
  82: { text: "雷阵雨", emoji: "⛈️", icon: "302" },
  85: { text: "阵雪", emoji: "🌨️", icon: "404" },
  86: { text: "阵雪", emoji: "❄️", icon: "405" },
  95: { text: "雷暴", emoji: "⛈️", icon: "303" },
  96: { text: "雷暴伴冰雹", emoji: "⛈️", icon: "304" },
  99: { text: "雷暴伴冰雹", emoji: "⛈️", icon: "305" },
};

function getWmoInfo(code: number): { text: string; emoji: string; icon: string } {
  return WMO_CODE_MAP[code] || { text: "未知", emoji: "🌤️", icon: "999" };
}

// 风速 m/s 转蒲福风级
function windSpeedToScale(speedMs: number): string {
  if (speedMs < 0.3) return "0";
  if (speedMs < 1.6) return "1";
  if (speedMs < 3.4) return "2";
  if (speedMs < 5.5) return "3";
  if (speedMs < 8.0) return "4";
  if (speedMs < 10.8) return "5";
  if (speedMs < 13.9) return "6";
  if (speedMs < 17.2) return "7";
  if (speedMs < 20.8) return "8";
  if (speedMs < 24.5) return "9";
  if (speedMs < 28.5) return "10";
  if (speedMs < 32.7) return "11";
  return "12";
}

// 风向角度转中文方向
function windDirToText(deg: number): string {
  const dirs = ["北", "东北偏北", "东北", "东北偏东", "东", "东南偏东", "东南", "东南偏南", "南", "西南偏南", "西南", "西南偏西", "西", "西北偏西", "西北", "西北偏北"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// 逆向地理编码（Open-Meteo 提供的免费地理编码 API）
export async function searchCityByKeyword(keyword: string): Promise<GeoLocation[]> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(keyword)}&count=10&language=zh&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map((r: any) => ({
      id: `${r.latitude.toFixed(4)},${r.longitude.toFixed(4)}`,
      name: r.name,
      lat: r.latitude,
      lon: r.longitude,
      adm1: r.admin1 || "",
      adm2: r.admin2 || "",
      country: r.country || "",
    }));
  } catch {
    return [];
  }
}

// 经纬度逆向地理编码（获取城市名）
export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation | null> {
  try {
    // Open-Meteo 的 geocoding 不支持经纬度反查，用 BigDataCloud 免费反查
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const name = data.city || data.locality || data.principalSubdivision || "当前位置";
    return {
      id: `${lat.toFixed(4)},${lon.toFixed(4)}`,
      name,
      lat,
      lon,
      adm1: data.principalSubdivision || "",
      adm2: data.locality || "",
      country: data.countryName || "",
    };
  } catch {
    // 兜底：返回纯坐标
    return {
      id: `${lat.toFixed(4)},${lon.toFixed(4)}`,
      name: "当前位置",
      lat,
      lon,
      adm1: "",
      adm2: "",
      country: "",
    };
  }
}

// 获取实时天气
export async function getCurrentWeather(lat: number, lon: number): Promise<OpenMeteoCurrent | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility,uv_index",
      timezone: "Asia/Shanghai",
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    if (!c) return null;
    const wmo = getWmoInfo(c.weather_code);
    const windSpeed = c.wind_speed_10m;
    return {
      temp: String(Math.round(c.temperature_2m)),
      feelsLike: String(Math.round(c.apparent_temperature)),
      desc: wmo.text,
      emoji: c.is_day ? wmo.emoji : wmo.emoji.replace("☀️", "🌙").replace("🌤️", "🌙"),
      icon: wmo.icon,
      humidity: String(c.relative_humidity_2m),
      windDir: windDirToText(c.wind_direction_10m),
      windScale: windSpeedToScale(windSpeed),
      precip: String(c.precipitation || 0),
      vis: c.visibility ? String(Math.round(c.visibility / 1000)) : "--",
      pressure: String(Math.round(c.pressure_msl)),
      cloud: String(c.cloud_cover),
      uvIndex: c.uv_index ? String(Math.round(c.uv_index)) : "--",
      isDay: c.is_day === 1,
    };
  } catch {
    return null;
  }
}

// 获取 7 天预报
export async function get7DayForecast(lat: number, lon: number): Promise<OpenMeteoDaily[]> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,relative_humidity_2m_max,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_probability_max,uv_index_max",
      timezone: "Asia/Shanghai",
      forecast_days: "7",
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    const d = data.daily;
    if (!d) return [];
    const result: OpenMeteoDaily[] = [];
    for (let i = 0; i < d.time.length; i++) {
      const wmo = getWmoInfo(d.weather_code[i]);
      result.push({
        fxDate: d.time[i],
        tempMax: String(Math.round(d.temperature_2m_max[i])),
        tempMin: String(Math.round(d.temperature_2m_min[i])),
        textDay: wmo.text,
        iconDay: wmo.icon,
        sunrise: d.sunrise[i] ? d.sunrise[i].slice(11, 16) : "--",
        sunset: d.sunset[i] ? d.sunset[i].slice(11, 16) : "--",
        humidity: String(d.relative_humidity_2m_max[i] || 0),
        windDirDay: windDirToText(d.wind_direction_10m_dominant[i]),
        windScaleDay: windSpeedToScale(d.wind_speed_10m_max[i]),
        precipProbability: String(d.precipitation_probability_max[i] || 0),
        uvIndexMax: d.uv_index_max[i] ? String(Math.round(d.uv_index_max[i])) : "--",
      });
    }
    return result;
  } catch {
    return [];
  }
}

// 综合获取天气（当前 + 7天预报）
export async function getFullWeather(lat: number, lon: number): Promise<{
  current: OpenMeteoCurrent | null;
  forecast: OpenMeteoDaily[];
}> {
  const [current, forecast] = await Promise.all([
    getCurrentWeather(lat, lon),
    get7DayForecast(lat, lon),
  ]);
  return { current, forecast };
}

// 兼容旧代码的图标映射
export function getWeatherIcon(iconCode: string): string {
  const iconMap: Record<string, string> = {
    "100": "☀️", "101": "🌤️", "102": "⛅", "103": "🌥️",
    "104": "☁️", "150": "🌙", "151": "☁️", "152": "⛅",
    "153": "🌥️", "154": "☁️",
    "300": "🌦️", "301": "🌦️", "302": "⛈️", "303": "⛈️",
    "304": "🌧️", "305": "🌧️", "306": "🌧️", "307": "🌧️",
    "308": "🌧️", "309": "🌧️", "310": "🌧️", "311": "🌧️",
    "312": "🌧️", "313": "🌧️", "314": "🌨️", "315": "🌨️",
    "316": "🌨️", "317": "🌨️", "318": "🌨️",
    "399": "🌧️", "400": "❄️", "401": "❄️", "402": "❄️",
    "403": "❄️", "404": "🌨️", "405": "🌨️", "406": "🌨️",
    "407": "❄️", "499": "❄️", "500": "🌫️", "501": "🌫️",
    "502": "🌫️", "503": "🌫️", "504": "🌫️", "507": "🌫️",
    "508": "🌫️", "509": "🌫️", "510": "🌫️", "511": "🌫️",
    "512": "🌫️", "513": "🌫️", "514": "🌫️", "515": "🌫️",
  };
  return iconMap[iconCode] || "🌤️";
}

export function getTemperatureAdvice(temp: number): { level: string; icon: string; clothing: string; activity: string; health: string } {
  if (temp >= 35) {
    return {
      level: "炎热", icon: "🥵",
      clothing: "短袖短裤，注意防晒，出门打伞",
      activity: "避免高强度户外运动，选择清晨或傍晚活动",
      health: "多喝水，注意防暑降温，留意中暑症状",
    };
  }
  if (temp >= 30) {
    return {
      level: "热", icon: "😎",
      clothing: "轻薄T恤、短裤，戴帽子和墨镜",
      activity: "游泳、清晨跑步都是好选择",
      health: "及时补水，避免中午暴晒",
    };
  }
  if (temp >= 25) {
    return {
      level: "温暖", icon: "😊",
      clothing: "单衣或薄外套，早晚可搭一件外套",
      activity: "非常适合户外运动，跑步骑行皆宜",
      health: "注意早晚温差，随身带件薄外套",
    };
  }
  if (temp >= 18) {
    return {
      level: "舒适", icon: "🌸",
      clothing: "长袖T恤或薄卫衣，轻便舒适",
      activity: "最佳运动温度，尽情享受户外吧",
      health: "花粉过敏注意防护",
    };
  }
  if (temp >= 10) {
    return {
      level: "微凉", icon: "🧥",
      clothing: "卫衣、夹克搭配，早晚加一件外套",
      activity: "户外跑步前充分热身",
      health: "注意关节保暖，预防感冒",
    };
  }
  if (temp >= 0) {
    return {
      level: "冷", icon: "🥶",
      clothing: "厚外套或羽绒服，围巾手套准备起来",
      activity: "室内运动为主，外出注意防滑",
      health: "做好保暖，尤其注意头部和脚部",
    };
  }
  return {
    level: "严寒", icon: "❄️",
    clothing: "厚羽绒服+保暖内衣，全副武装",
    activity: "尽量选择室内运动",
    health: "减少外出，注意防冻伤，多喝热饮",
  };
}

// 根据天气数据生成生活指数
export function getLifeIndex(current: OpenMeteoCurrent): {
  uv: { level: string; advice: string };
  comfort: { level: string; advice: string };
  dressing: { level: string; advice: string };
} {
  const temp = parseInt(current.temp);
  const uv = parseFloat(current.uvIndex);
  const humidity = parseInt(current.humidity);

  // 紫外线指数
  let uvLevel = "弱", uvAdvice = "无需特别防护";
  if (uv >= 8) { uvLevel = "很强"; uvAdvice = "避免暴晒，涂防晒霜 SP50+"; }
  else if (uv >= 6) { uvLevel = "强"; uvAdvice = "建议涂防晒霜，戴帽子"; }
  else if (uv >= 3) { uvLevel = "中等"; uvAdvice = "适度防护"; }

  // 舒适度
  let comfortLevel = "舒适", comfortAdvice = "体感舒适";
  if (temp >= 33 || temp <= 0) { comfortLevel = "不舒适"; comfortAdvice = "体感较差，注意防寒或防暑"; }
  else if (temp >= 28 || temp <= 5) { comfortLevel = "较不舒适"; comfortAdvice = "体感偏热或偏冷"; }
  else if (humidity > 80) { comfortLevel = "较闷"; comfortAdvice = "湿度较高，注意通风"; }

  // 穿衣指数
  let dressingLevel = "薄短袖", dressingAdvice = "短袖短裤即可";
  if (temp <= 5) { dressingLevel = "厚冬装"; dressingAdvice = "羽绒服+保暖内衣"; }
  else if (temp <= 10) { dressingLevel = "冬装"; dressingAdvice = "厚外套或羽绒服"; }
  else if (temp <= 18) { dressingLevel = "秋装"; dressingAdvice = "卫衣+薄外套"; }
  else if (temp <= 25) { dressingLevel = "春装"; dressingAdvice = "长袖T恤或薄卫衣"; }

  return {
    uv: { level: uvLevel, advice: uvAdvice },
    comfort: { level: comfortLevel, advice: comfortAdvice },
    dressing: { level: dressingLevel, advice: dressingAdvice },
  };
}
