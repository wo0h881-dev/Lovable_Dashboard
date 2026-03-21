import { useEffect, useState } from "react";
import type { Novel, Platform, Genre } from "@/data/mockData";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

interface TodayCombinedRow {
  출처: string;
  오늘순위: number | string;
  제목: string;
  작가: string;
  날짜: string;
  장르: string;
  오늘조회수: string | number;
  전일순위: string | number;
  전일조회수: string | number;
  순위변화: string;
  조회수증감: string;
  조회수증감률: string;
  썸네일?: string;
  출판사?: string;
  평점?: string | number;
  댓글수?: string | number;
  총회차수?: string | number;
  [key: string]: any;
}

// --- 보조 함수들 ---

function toPlatform(src: string): Platform {
  const s = String(src || "").trim();
  if (s === "네이버" || s.includes("네이버") || s.toLowerCase().includes("naver")) return "naver";
  if (s === "리디" || s.includes("리디") || s.toLowerCase().includes("ridi")) return "ridi";
  if (s === "카카오" || s.includes("카카오") || s.toLowerCase().includes("kakao")) return "kakao";
  return "kakao";
}

function toGenreByPlatform(platform: Platform, rawGenre: string): Genre {
  const raw = (rawGenre || "").trim();
  if (platform === "naver" || platform === "kakao") {
    const validGenres = ["현판", "로판", "로맨스", "판타지", "무협", "BL", "현대물", "역사/시대물"];
    return validGenres.includes(raw) ? (raw as Genre) : "기타";
  }
  const upper = raw.toUpperCase();
  if (upper.startsWith("BL")) return "BL";
  if (raw.includes("로맨스") && raw.includes("현대물")) return "로맨스";
  if (raw.includes("서양풍") && raw.includes("로판")) return "로판";
  if (raw.includes("현대 판타지")) return "현판";
  if (raw.includes("퓨전 판타지")) return "판타지";
  if (raw.includes("무협")) return "무협";
  if (raw.includes("로맨스")) return "로맨스";
  if (raw.includes("판타지")) return "판타지";
  return "기타";
}

function parseRank(v: string | number): number | null {
  if (!v) return null;
  const s = String(v).trim();
  if (["NEW", "재진입", "유지"].includes(s)) return null;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

function parseViewsToNumber(v: string | number): number {
  if (v === null || v === undefined) return 0;
  let s = String(v).trim();
  if (!s) return 0;
  const regex = /([\d.,]+)\s*억|([\d.,]+)\s*만/g;
  let total = 0;
  let m;
  while ((m = regex.exec(s)) !== null) {
    if (m[1]) total += parseFloat(m[1].replace(/,/g, "")) * 100_000_000;
    if (m[2]) total += parseFloat(m[2].replace(/,/g, "")) * 10_000;
  }
  if (total > 0) return total;
  if (s.endsWith("억")) return (parseFloat(s.replace("억", "").replace(/,/g, "")) || 0) * 100_000_000;
  if (s.endsWith("만")) return (parseFloat(s.replace("만", "").replace(/,/g, "")) || 0) * 10_000;
  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseRankChange(label: string) {
  const s = (label || "").trim();
  if (s === "NEW") return { rankChange: null, isNew: true, isReEntry: false };
  if (s === "재진입") return { rankChange: null, isNew: false, isReEntry: true };
  if (s === "유지") return { rankChange: 0, isNew: false, isReEntry: false };
  if (s.startsWith("▲")) return { rankChange: parseInt(s.replace("▲", ""), 10) || null, isNew: false, isReEntry: false };
  if (s.startsWith("▼")) return { rankChange: -(parseInt(s.replace("▼", ""), 10) || 0), isNew: false, isReEntry: false };
  return { rankChange: null, isNew: false, isReEntry: false };
}

function parseCommentCount(raw: any): number {
  const s = String(raw || "").trim();
  if (s.endsWith("만")) return Math.round((parseFloat(s.replace("만", "")) || 0) * 10_000);
  return parseInt(s.replace(/,/g, ""), 10) || 0;
}

// --- 메인 매핑 함수 (하나만 존재해야 함) ---

function mapRowToNovel(row: TodayCombinedRow, index: number): Novel {
  const platform = toPlatform(row["출처"]);
  const todayRank = parseRank(row["오늘순위"]) ?? index + 1;
  const prevRank = parseRank(row["전일순위"]);
  const { rankChange, isNew, isReEntry } = parseRankChange(row["순위변화"]);

  const todayViewsNumber = platform === "ridi" 
    ? parseViewsToNumber(String(row["오늘조회수"]).replace(/,/g, "")) 
    : parseViewsToNumber(row["오늘조회수"]);
  const prevViewsNumber = platform === "ridi" 
    ? parseViewsToNumber(String(row["전일조회수"]).replace(/,/g, "")) 
    : parseViewsToNumber(row["전일조회수"]);

  return {
    id: `${platform}-${row["제목"]}-${todayRank}`,
    title: row["제목"] || "(제목 없음)",
    author: row["작가"] || "-",
    genre: toGenreByPlatform(platform, row["장르"] || "기타"),
    publisher: row["출판사"] || "-",
    platform,
    thumbnailUrl: row["썸네일"] || undefined,
    todayRank,
    prevRank,
    rankChange,
    isNew,
    isReEntry,
    todayViews: todayViewsNumber,
    viewsChange: todayViewsNumber - prevViewsNumber,
    viewsChangePct: prevViewsNumber > 0 ? ((todayViewsNumber - prevViewsNumber) / prevViewsNumber) * 100 : 0,
    rating: parseFloat(String(row["평점"])) || 0,
    commentCount: parseCommentCount(row["댓글수"]),
    episodeCount: parseInt(String(row["총회차수"]).match(/\d+/)?.[0] || "0", 10),
    firstAppeared: row["날짜"] || "",
    consecutiveDays: 0,
    peakRank: todayRank,
    rankHistory: row["rankHistory"] ?? [],
    viewsHistory: row["viewsHistory"] ?? [],
    coverGradient: platform === "naver" ? "from-emerald-900 to-green-700" : platform === "kakao" ? "from-amber-900 to-orange-700" : "from-blue-900 to-indigo-700",
    coverEmoji: platform === "naver" ? "📗" : platform === "kakao" ? "💛" : "📘",
  };
}

// --- Hook ---

export function useTodayCombined() {
  const [data, setData] = useState<Novel[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        if (!APPS_SCRIPT_URL) throw new Error("VITE_APPS_SCRIPT_URL 미설정");
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getTodayCombined`);
        const rows = (await res.json()) as TodayCombinedRow[];
        if (!rows || rows.length === 0) { setData([]); return; }

        const dates = rows.map(r => r.날짜).filter(Boolean).sort().reverse();
        const mostRecentDate = dates[0];
        setLatestDate(mostRecentDate);

        const novels = rows.filter(r => r.날짜 === mostRecentDate).map((row, idx) => mapRowToNovel(row, idx));
        setData(novels);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { data, isLoading, error, latestDate };
}
