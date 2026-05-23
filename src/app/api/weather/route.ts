import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://wttr.in/?format=j1", {
      next: { revalidate: 1800 },
    });
    const data = await res.json();
    const current = data.current_condition[0];
    const weatherMap: Record<string, string> = {
      "Sunny": "☀️", "Clear": "🌙", "Partly cloudy": "⛅",
      "Cloudy": "☁️", "Overcast": "☁️", "Mist": "🌫️",
      "Fog": "🌫️", "Light rain": "🌦️", "Rain": "🌧️",
      "Heavy rain": "⛈️", "Snow": "❄️", "Thunderstorm": "⛈️",
    };
    const desc = current.weatherDesc[0].value;
    const emoji = Object.entries(weatherMap).find(([k]) => desc.includes(k))?.[1] || "🌤️";
    return NextResponse.json({
      temp: current.temp_C,
      desc: desc,
      emoji: emoji,
      humidity: current.humidity,
      feelsLike: current.FeelsLikeC,
    });
  } catch {
    return NextResponse.json({ temp: "--", desc: "未知", emoji: "🌤️", humidity: "--", feelsLike: "--" });
  }
}
