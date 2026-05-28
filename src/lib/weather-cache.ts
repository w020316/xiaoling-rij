import { getTimeOffset } from "./time-manager";

export interface StoredWeatherCache {
  id: string;
  city: string;
  locationId: string;
  temperature: string;
  feelsLike: string;
  description: string;
  icon: string;
  humidity: string;
  windDir: string;
  windScale: string;
  advice: string;
  fetchedAt: string;
}

export function getStoredWeather(): StoredWeatherCache | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem("xy_weather");
    if (!v) return null;
    const data: StoredWeatherCache = JSON.parse(v);
    const fetchedTime = new Date(data.fetchedAt).getTime();
    const now = Date.now() + getTimeOffset();
    if (now - fetchedTime > 1800000) return null;
    return data;
  } catch {
    return null;
  }
}

export function setStoredWeather(data: StoredWeatherCache): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("xy_weather", JSON.stringify(data));
  } catch {
    // storage full
  }
}

export function getStoredCity(): { city: string; locationId: string } {
  if (typeof window === "undefined") return { city: "", locationId: "" };
  try {
    const v = localStorage.getItem("xy_weather_city");
    if (v) return JSON.parse(v);
  } catch {
  }
  return { city: "", locationId: "" };
}

export function setStoredCity(city: string, locationId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("xy_weather_city", JSON.stringify({ city, locationId }));
  } catch {
  }
}

export interface StoredGeoLocation {
  lat: number;
  lon: number;
  fetchedAt: string;
}

export function getStoredGeoLocation(): StoredGeoLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem("xy_weather_geo");
    if (!v) return null;
    const data: StoredGeoLocation = JSON.parse(v);
    const fetchedTime = new Date(data.fetchedAt).getTime();
    if (Date.now() - fetchedTime > 86400000) return null;
    return data;
  } catch {
    return null;
  }
}

export function setStoredGeoLocation(lat: number, lon: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("xy_weather_geo", JSON.stringify({ lat, lon, fetchedAt: new Date().toISOString() }));
  } catch {
  }
}

export function getStoredCalorieImage(imageId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("xy_cal_img_" + imageId);
  } catch {
    return null;
  }
}

export function setStoredCalorieImage(imageId: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  try {
    const limit = 5 * 1024 * 1024;
    if (dataUrl.length > limit) return;
    localStorage.setItem("xy_cal_img_" + imageId, dataUrl);
  } catch {
    // storage full
  }
}