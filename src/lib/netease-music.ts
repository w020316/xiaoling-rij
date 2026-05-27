import crypto from "crypto";

const FIXED_KEY = "0CoJUm6Qyw8W8jud";
const IV = "0102030405060708";

function getEnv(key: string): string {
  return process.env[key] || "";
}

function aesEncrypt(text: string, key: string): string {
  const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(key), Buffer.from(IV));
  return cipher.update(text, "utf-8", "base64") + cipher.final("base64");
}

function rsaEncrypt(text: string, publicKeyPem: string): string {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(text)
  );
  return encrypted.toString("hex");
}

export function encryptRequest(data: Record<string, unknown>): { params: string; encSecKey: string } {
  const text = JSON.stringify(data);
  const randomKey = crypto.randomBytes(8).toString("hex");
  const firstEncrypt = aesEncrypt(text, FIXED_KEY);
  const secondEncrypt = aesEncrypt(firstEncrypt, randomKey);
  const encSecKey = rsaEncrypt(randomKey.split("").reverse().join(""), getEnv("NETEASE_PUB_KEY"));
  return { params: secondEncrypt, encSecKey };
}

async function apiCall(path: string, data: Record<string, unknown>): Promise<any> {
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
    },
    body: formBody.toString(),
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

export interface NeteasePlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  description: string;
  trackCount: number;
}

export async function searchSongs(keyword: string, limit = 20): Promise<NeteaseSong[]> {
  const result = await apiCall("/weapi/search/get", {
    s: keyword,
    type: 1,
    limit,
    offset: 0,
    total: true,
    csrf_token: "",
  });
  if (result.code !== 200 || !result.result?.songs) return [];
  return result.result.songs.map((s: any) => ({
    id: s.id,
    name: s.name,
    artists: (s.ar || []).map((a: any) => a.name).join(" / "),
    album: s.al?.name || "",
    duration: s.dt || 0,
  }));
}

export async function getSongUrl(songId: number): Promise<string | null> {
  const result = await apiCall("/weapi/song/enhance/player/url/v1", {
    ids: `[${songId}]`,
    level: "standard",
    encodeType: "aac",
    csrf_token: "",
  });
  if (result.code !== 200 || !result.data?.[0]) return null;
  const url = result.data[0].url;
  if (!url) return null;
  return url;
}

export async function getPlaylistDetail(playlistId: number): Promise<{
  name: string;
  cover: string;
  tracks: NeteaseSong[];
} | null> {
  const result = await apiCall("/weapi/v6/playlist/detail", {
    id: playlistId,
    n: 50,
    csrf_token: "",
  });
  if (result.code !== 200 || !result.playlist) return null;
  return {
    name: result.playlist.name,
    cover: result.playlist.coverImgUrl,
    tracks: (result.playlist.tracks || []).slice(0, 50).map((t: any) => ({
      id: t.id,
      name: t.name,
      artists: (t.ar || []).map((a: any) => a.name).join(" / "),
      album: t.al?.name || "",
      duration: t.dt || 0,
    })),
  };
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