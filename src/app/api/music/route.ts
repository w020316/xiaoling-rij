import { NextRequest, NextResponse } from "next/server";
import { searchSongs, getSongUrl, getPlaylistDetail, MOOD_PLAYLISTS } from "@/lib/netease-music";

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action") || "";
    const keyword = req.nextUrl.searchParams.get("keyword") || "";
    const songId = req.nextUrl.searchParams.get("songId") || "";
    const playlistId = req.nextUrl.searchParams.get("playlistId") || "";
    const mood = req.nextUrl.searchParams.get("mood") || "";

    if (action === "search" && keyword) {
      const songs = await searchSongs(keyword, 20);
      return NextResponse.json({ songs });
    }

    if (action === "url" && songId) {
      const url = await getSongUrl(parseInt(songId));
      if (url) {
        return NextResponse.json({ url });
      }
      const fallbackUrl = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
      return NextResponse.json({ url: fallbackUrl });
    }

    if (action === "playlist") {
      if (playlistId) {
        const playlist = await getPlaylistDetail(parseInt(playlistId));
        if (playlist) return NextResponse.json(playlist);
        return NextResponse.json({ error: "歌单不存在" }, { status: 404 });
      }
      if (mood && MOOD_PLAYLISTS[mood]) {
        const playlist = await getPlaylistDetail(MOOD_PLAYLISTS[mood].id);
        if (playlist) return NextResponse.json(playlist);
        return NextResponse.json({ error: "歌单加载失败" }, { status: 500 });
      }
      return NextResponse.json({ error: "请提供playlistId或mood参数" }, { status: 400 });
    }

    if (action === "moods") {
      return NextResponse.json({ moods: MOOD_PLAYLISTS });
    }

    if (action === "search") {
      return NextResponse.json({ songs: [] });
    }

    return NextResponse.json({
      actions: ["search", "url", "playlist", "moods"],
      usage: {
        search: "/api/music?action=search&keyword=关键词",
        url: "/api/music?action=url&songId=歌曲ID",
        playlist: "/api/music?action=playlist&mood=healing",
        moods: "/api/music?action=moods",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "音乐服务暂时不可用" },
      { status: 500 }
    );
  }
}