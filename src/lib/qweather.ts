const QWEATHER_HOST =
  process.env.QWEATHER_HOST || process.env.NEXT_PUBLIC_QWEATHER_HOST || "devapi.qweather.com";

function getApiKey(): string {
  return process.env.QWEATHER_KEY || process.env.NEXT_PUBLIC_QWEATHER_KEY || "";
}

function buildUrl(path: string, params: Record<string, string>): string {
  const search = new URLSearchParams(params).toString();
  return `https://${QWEATHER_HOST}${path}?${search}`;
}

async function qweatherFetch(path: string, params: Record<string, string>) {
  const apiKey = getApiKey();
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["X-QW-Api-Key"] = apiKey;
  }
  const url = buildUrl(path, params);
  const res = await fetch(url, { headers });
  return res.json();
}

export interface QWeatherNow {
  temp: string;
  feelsLike: string;
  icon: string;
  text: string;
  windDir: string;
  windScale: string;
  humidity: string;
  precip: string;
  vis: string;
  pressure: string;
  cloud: string;
}

export interface QWeatherDaily {
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
}

export interface QWeatherCity {
  id: string;
  name: string;
  lat: string;
  lon: string;
  adm1: string;
  adm2: string;
}

export async function searchCity(keyword: string): Promise<QWeatherCity[]> {
  try {
    const data = await qweatherFetch("/v2/city/lookup", {
      location: keyword,
      range: "cn",
      number: "10",
    });
    if (data.code === "200" && data.location) {
      return (data.location || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lon: loc.lon,
        adm1: loc.adm1,
        adm2: loc.adm2,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function searchCityByLocation(lat: number, lon: number): Promise<QWeatherCity | null> {
  try {
    const data = await qweatherFetch("/v2/city/lookup", {
      location: `${lat},${lon}`,
      range: "cn",
      number: "1",
    });
    if (data.code === "200" && data.location && data.location.length > 0) {
      const loc = data.location[0];
      return {
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lon: loc.lon,
        adm1: loc.adm1,
        adm2: loc.adm2,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getNowWeather(locationId: string): Promise<QWeatherNow | null> {
  try {
    const data = await qweatherFetch("/v7/weather/now", {
      location: locationId,
    });
    if (data.code === "200" && data.now) {
      return {
        temp: data.now.temp,
        feelsLike: data.now.feelsLike,
        icon: data.now.icon,
        text: data.now.text,
        windDir: data.now.windDir,
        windScale: data.now.windScale,
        humidity: data.now.humidity,
        precip: data.now.precip,
        vis: data.now.vis,
        pressure: data.now.pressure,
        cloud: data.now.cloud,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function get7DayWeather(locationId: string): Promise<QWeatherDaily[]> {
  try {
    const data = await qweatherFetch("/v7/weather/7d", {
      location: locationId,
    });
    if (data.code === "200" && data.daily) {
      return data.daily.map((d: any) => ({
        fxDate: d.fxDate,
        tempMax: d.tempMax,
        tempMin: d.tempMin,
        textDay: d.textDay,
        iconDay: d.iconDay,
        sunrise: d.sunrise,
        sunset: d.sunset,
        humidity: d.humidity,
        windDirDay: d.windDirDay,
        windScaleDay: d.windScaleDay,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export function getWeatherIcon(iconCode: string): string {
  const iconMap: Record<string, string> = {
    "100": "☀️", "101": "☁️", "102": "⛅", "103": "🌥️",
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