import crypto from "crypto";

const FIXED_KEY = "0CoJUm6Qyw8W8jud";
const IV = "0102030405060708";
const RSA_MODULUS = "00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7";
const RSA_PUBKEY = "010001";

function aesEncrypt(text: string, key: string): string {
  const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(key), Buffer.from(IV));
  return cipher.update(text, "utf-8", "base64") + cipher.final("base64");
}

function rsaEncrypt(text: string): string {
  const reversed = text.split("").reverse().join("");
  const hexText = Buffer.from(reversed).toString("hex");
  const bigText = BigInt("0x" + hexText);
  const bigPubKey = BigInt("0x" + RSA_PUBKEY);
  const bigModulus = BigInt("0x" + RSA_MODULUS);
  let result = 1n;
  let base = bigText % bigModulus;
  let exp = bigPubKey;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % bigModulus;
    }
    exp = exp / 2n;
    base = (base * base) % bigModulus;
  }
  return result.toString(16).padStart(256, "0");
}

function encryptRequest(data: Record<string, unknown>): { params: string; encSecKey: string } {
  const text = JSON.stringify(data);
  const randomKey = crypto.randomBytes(8).toString("hex");
  const firstEncrypt = aesEncrypt(text, FIXED_KEY);
  const secondEncrypt = aesEncrypt(firstEncrypt, randomKey);
  const encSecKey = rsaEncrypt(randomKey);
  return { params: secondEncrypt, encSecKey };
}

async function weapiCall(path: string, data: Record<string, unknown>): Promise<any> {
  const url = `https://music.163.com${path}`;
  const { params, encSecKey } = encryptRequest(data);

  const formBody = new URLSearchParams();
  formBody.append("params", params);
  formBody.append("encSecKey", encSecKey);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: "https://music.163.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Cookie: "MUSIC_U=; __remember_me=true",
    },
    body: formBody.toString(),
  });

  return res.json();
}

async function apiGet(path: string, params: Record<string, string> = {}): Promise<any> {
  const search = new URLSearchParams(params).toString();
  const url = `https://music.163.com${path}${search ? "?" + search : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Referer: "https://music.163.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Cookie: "MUSIC_U=; __remember_me=true",
    },
  });

  return res.json();
}

export interface NeteaseSong {
  id: number;
  name: string;
  artists: string;
  album: string;
  duration: number;
}

function mapSong(s: any): NeteaseSong {
  return {
    id: s.id,
    name: s.name,
    artists: (s.ar || []).map((a: any) => a.name).join(" / "),
    album: s.al?.name || "",
    duration: s.dt || 0,
  };
}

export async function searchSongs(keyword: string, limit = 20): Promise<NeteaseSong[]> {
  try {
    const result = await apiGet("/api/search/get", {
      s: keyword,
      type: "1",
      limit: String(limit),
      offset: "0",
    });
    if (result.code === 200 && result.result?.songs) {
      return result.result.songs.map(mapSong);
    }
  } catch {
    console.warn("[Music] api/search/get failed, trying weapi");
  }

  try {
    const result = await weapiCall("/weapi/search/get", {
      s: keyword,
      type: 1,
      limit,
      offset: 0,
      total: true,
      csrf_token: "",
    });
    if (result.code === 200 && result.result?.songs) {
      return result.result.songs.map(mapSong);
    }
  } catch {
    console.warn("[Music] weapi search also failed, trying cloudsearch");
  }

  try {
    const result = await weapiCall("/weapi/cloudsearch/get/web", {
      s: keyword,
      type: 1,
      limit,
      offset: 0,
      total: true,
      csrf_token: "",
    });
    if (result.code === 200 && result.result?.songs) {
      return result.result.songs.map(mapSong);
    }
  } catch {
    console.warn("[Music] all search methods failed");
  }

  return [];
}

export async function getSongUrl(songId: number): Promise<string | null> {
  try {
    const result = await weapiCall("/weapi/song/enhance/player/url/v1", {
      ids: `[${songId}]`,
      level: "standard",
      encodeType: "aac",
      csrf_token: "",
    });
    if (result.code === 200 && result.data?.[0]?.url) {
      return result.data[0].url;
    }
  } catch {
    console.warn("[Music] weapi url failed, trying api fallback");
  }

  try {
    const result = await apiGet("/api/song/enhance/player/url", {
      id: String(songId),
      ids: `[${songId}]`,
      br: "320000",
    });
    if (result.code === 200 && result.data?.[0]?.url) {
      return result.data[0].url;
    }
  } catch {
    console.warn("[Music] api url fallback also failed, using outer url");
  }

  return `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
}

export async function getPlaylistDetail(playlistId: number): Promise<{
  name: string;
  cover: string;
  tracks: NeteaseSong[];
} | null> {
  try {
    const result = await weapiCall("/weapi/v6/playlist/detail", {
      id: playlistId,
      n: 50,
      csrf_token: "",
    });
    if (result.code === 200 && result.playlist) {
      return {
        name: result.playlist.name,
        cover: result.playlist.coverImgUrl,
        tracks: (result.playlist.tracks || []).slice(0, 50).map(mapSong),
      };
    }
  } catch {
    console.warn("[Music] weapi playlist failed, trying api fallback");
  }

  try {
    const result = await apiGet("/api/playlist/detail", {
      id: String(playlistId),
    });
    if (result.code === 200 && result.playlist) {
      return {
        name: result.playlist.name,
        cover: result.playlist.coverImgUrl,
        tracks: (result.playlist.tracks || []).slice(0, 50).map(mapSong),
      };
    }
  } catch {
    console.warn("[Music] all playlist methods failed");
  }

  return null;
}

export const MOOD_PLAYLISTS: Record<string, { id: number; name: string }> = {
  healing: { id: 427781278, name: "治愈系纯音乐" },
  love: { id: 2061306122, name: "甜蜜恋爱" },
  morning: { id: 2655405412, name: "清晨" },
  relax: { id: 3548159091, name: "放松轻音乐" },
  rain: { id: 3166521164, name: "雨天" },
  coffee: { id: 3418802399, name: "咖啡时光" },
  sleep: { id: 3253723813, name: "助眠" },
  reading: { id: 3558129283, name: "看书" },
};
