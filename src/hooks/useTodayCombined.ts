// src/hooks/useTodayCombined.ts
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
  [key: string]: any;
}

interface UseTodayCombinedResult {
  data: Novel[] | null;
  isLoading: boolean;
  error: string | null;
}

function rankToScore(rank: number | null | undefined): number {
  const n = typeof rank === "number" ? rank : Number(rank);
  if (!n || Number.isNaN(n)) return 0;
  return 21 - n; // 1위=20, 20위=1
}

function toPlatform(src: string): Platform {
  const s = src.trim();
  if (s === "네이버") return "naver";
  if (s === "카카오") return "kakao";
  if (s === "리디")   return "ridi";
  // 기본값은 카카오로
  return "kakao";
}

function toGenre(g: string): Genre {
  const raw = (g || "").trim();

  // BL
  if (raw.startsWith("BL")) return "BL";

  // 로맨스: "로맨스 · 현대물", "현대 로맨스" 등
  if (raw.startsWith("로맨스") || raw.includes("로맨스")) return "로맨스";

  // 로판: "서양풍 로판", "동양풍 로판", "로맨스판타지"
  if (raw.includes("로판") || raw.includes("로맨스판타지")) return "로판";

  // 판타지 계열(현대 판타지, 퓨전 판타지 등)
  if (raw.includes("판타지")) return "판타지";

  // 현판/무협은 기존 규칙 유지
  if (raw.includes("현대물")) return "현판";
  if (raw.includes("무협")) return "무협";

  return "기타";
}


function parseRank(v: string | number): number | null {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).trim();
  if (s === "NEW" || s === "재진입" || s === "유지") return null;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

function parseViewsToNumber(v: string | number): number {
  if (v === null || v === undefined) return 0;
  let s = String(v).trim();
  if (!s) return 0;

  // 3.5억, 571.4만, 0 같은 형식 처리
  if (s.endsWith("억")) {
    const n = parseFloat(s.replace("억", "").replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n * 100000000;
  }
  if (s.endsWith("만")) {
    const n = parseFloat(s.replace("만", "").replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n * 10000;
  }
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function parsePercent(v: string): number {
  if (!v) return 0;
  const s = v.replace("%", "").trim();
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

function parseRankChange(label: string): { rankChange: number | null; isNew: boolean; isReEntry: boolean } {
  const s = (label || "").trim();
  if (!s) return { rankChange: null, isNew: false, isReEntry: false };
  if (s === "NEW") return { rankChange: null, isNew: true, isReEntry: false };
  if (s === "재진입") return { rankChange: null, isNew: false, isReEntry: true };
  if (s === "유지") return { rankChange: 0, isNew: false, isReEntry: false };

  if (s.startsWith("▲")) {
    const n = parseInt(s.replace("▲", "").trim(), 10);
    return { rankChange: Number.isNaN(n) ? null : n, isNew: false, isReEntry: false };
  }
  if (s.startsWith("▼")) {
    const n = parseInt(s.replace("▼", "").trim(), 10);
    return { rankChange: Number.isNaN(n) ? null : -n, isNew: false, isReEntry: false };
  }
  return { rankChange: null, isNew: false, isReEntry: false };
}

function mapRowToNovel(row: TodayCombinedRow, index: number): Novel {
  const platform = toPlatform(row["출처"]);
  const todayRank = parseRank(row["오늘순위"]) ?? (index + 1);
  const prevRank = parseRank(row["전일순위"]);

  const { rankChange, isNew, isReEntry } = parseRankChange(row["순위변화"]);

  // ✅ 플랫폼별 조회수/평가수 해석
  const rawTodayViews = row["오늘조회수"];
  const rawPrevViews = row["전일조회수"];

  const todayViewsNumber =
    platform === "ridi"
      ? (typeof rawTodayViews === "number"
          ? rawTodayViews
          : parseViewsToNumber(String(rawTodayViews || "0").replace(/,/g, "")))
      : parseViewsToNumber(rawTodayViews);

  const prevViewsNumber =
    platform === "ridi"
      ? (typeof rawPrevViews === "number"
          ? rawPrevViews
          : parseViewsToNumber(String(rawPrevViews || "0").replace(/,/g, "")))
      : parseViewsToNumber(rawPrevViews);

  const viewsChangeNumber = todayViewsNumber - prevViewsNumber;
  const viewsChangePctNumber =
    prevViewsNumber > 0
      ? (viewsChangeNumber / prevViewsNumber) * 100
      : parsePercent(row["조회수증감률"]);

  // id는 platform+제목으로 임시 구성
  const id = `${platform}-${row["제목"]}-${todayRank}`;

  // ✅ 리디 회차수 파싱 ("총 101화" → 101)
  let episodeCount = 0;
  const totalEpisodesRaw = (row as any)["총회차수"];
  if (platform === "ridi" && typeof totalEpisodesRaw === "string") {
    const m = totalEpisodesRaw.match(/(\d+)\s*화/);
    if (m) episodeCount = Number(m[1]) || 0;
  }

  const novel: Novel = {
    id,
    title: row["제목"] || "(제목 없음)",
    author: row["작가"] || "-",
    genre: toGenre(row["장르"] || "기타"),
    publisher: "-", // (필요하면 통합 시트에 출판사 추가 후 여기서 매핑)
    platform,
    coverGradient:
      platform === "naver"
        ? "from-emerald-900 to-green-700"
        : platform === "kakao"
        ? "from-amber-900 to-orange-700"
        : "from-blue-900 to-indigo-700",
    coverEmoji: platform === "naver" ? "📗" : platform === "kakao" ? "💛" : "📘",
    thumbnailUrl: row["썸네일"] || undefined,
    todayRank,
    prevRank,
    rankChange,
    isNew,
    isReEntry,
    todayViews: todayViewsNumber,      // 리디는 평가수 숫자 그대로
    viewsChange: viewsChangeNumber,
    viewsChangePct: viewsChangePctNumber,
    rating: 0,                         // 아직 통합 평점 없음
    commentCount: 0,                   // 댓글수도 아직 없음
    episodeCount,
    firstAppeared: row["날짜"] || "",
    consecutiveDays: 0,
    peakRank: todayRank,
  };

  return novel;
}


export function useTodayCombined(): UseTodayCombinedResult {
  const [data, setData] = useState<Novel[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!APPS_SCRIPT_URL) {
          throw new Error("VITE_APPS_SCRIPT_URL이 설정되지 않았습니다.");
        }

        const res = await fetch(`${APPS_SCRIPT_URL}?action=getTodayCombined`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const rows = (await res.json()) as TodayCombinedRow[];

        const novels = rows.map((row, idx) => mapRowToNovel(row, idx));

        setData(novels);
        setError(null);
      } catch (err: any) {
        console.error("useTodayCombined error:", err);
        setError(err?.message ?? String(err));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return { data, isLoading, error };
}
