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
  출판사?: string;
  평점?: string | number;
  댓글수?: string | number;
  총회차수?: string | number;
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
  if (s === "리디") return "ridi";
  return "kakao";
}

/**
 * 플랫폼별 장르 매핑
 * - 네이버/카카오는 들어오는 값 그대로 사용
 * - 리디만 매핑 규칙 적용
 */
function toGenreByPlatform(platform: Platform, rawGenre: string): Genre {
  const raw = (rawGenre || "").trim();

  // 1) 네이버/카카오는 그대로 사용
  if (platform === "naver" || platform === "kakao") {
    if (
      raw === "현판" ||
      raw === "로판" ||
      raw === "로맨스" ||
      raw === "판타지" ||
      raw === "무협" ||
      raw === "BL" ||
      raw === "현대물" ||
      raw === "역사/시대물" ||
      raw === "기타"
    ) {
      return raw as Genre;
    }
    return "기타";
  }

  // 2) 리디: 문자열 패턴에 따라 매핑
  const upper = raw.toUpperCase();

  // BL 계열: "BL · 현대물", "BL · 판타지물", "BL · 역사/시대물" 등 → BL
  if (upper.startsWith("BL")) return "BL";

  // 로맨스 · 현대물 → 로맨스
  if (raw.includes("로맨스") && raw.includes("현대물")) return "로맨스";

  // 서양풍 로판 → 로판
  if (raw.includes("서양풍") && raw.includes("로판")) return "로판";

  // 현대 판타지 → 현판
  if (raw.includes("현대 판타지")) return "현판";

  // 퓨전 판타지 → 판타지
  if (raw.includes("퓨전 판타지")) return "판타지";

  // 무협 소설 → 무협
  if (raw.includes("무협")) return "무협";

  // 그 밖의 로맨스 계열
  if (raw.includes("로맨스")) return "로맨스";

  // 그 밖의 판타지 계열
  if (raw.includes("판타지")) return "판타지";

  // 나머지
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

function parseRankChange(label: string): {
  rankChange: number | null;
  isNew: boolean;
  isReEntry: boolean;
} {
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

// 🔹 "1.2만", "1만", "1,440" 같은 댓글 수를 숫자로 변환
function parseCommentCount(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === "-") return 0;

  const s = String(raw).trim();
  if (!s) return 0;

  // "1,440" 같은 형식
  if (/^\d{1,3}(,\d{3})*$/.test(s)) {
    const n = Number(s.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  // "1.2만", "1만"
  if (s.endsWith("만")) {
    const base = s.replace("만", "");
    const n = Number(base.replace(/,/g, ""));
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 10_000);
  }

  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function mapRowToNovel(row: TodayCombinedRow, index: number): Novel {
  const platform = toPlatform(row["출처"]);
  const todayRank = parseRank(row["오늘순위"]) ?? index + 1;
  const prevRank = parseRank(row["전일순위"]);

  const { rankChange, isNew, isReEntry } = parseRankChange(row["순위변화"]);

  // 플랫폼별 조회수/평가수 해석
  const rawTodayViews = row["오늘조회수"];
  const rawPrevViews = row["전일조회수"];

  const todayViewsNumber =
    platform === "ridi"
      ? typeof rawTodayViews === "number"
        ? rawTodayViews
        : parseViewsToNumber(String(rawTodayViews || "0").replace(/,/g, ""))
      : parseViewsToNumber(rawTodayViews);

  const prevViewsNumber =
    platform === "ridi"
      ? typeof rawPrevViews === "number"
        ? rawPrevViews
        : parseViewsToNumber(String(rawPrevViews || "0").replace(/,/g, ""))
      : parseViewsToNumber(rawPrevViews);

  const viewsChangeNumber = todayViewsNumber - prevViewsNumber;
  const viewsChangePctNumber =
    prevViewsNumber > 0
      ? (viewsChangeNumber / prevViewsNumber) * 100
      : parsePercent(row["조회수증감률"]);

  const id = `${platform}-${row["제목"]}-${todayRank}`;

  // 출판사
  const publisher = (row["출판사"] as string) || "-";

  // 평점
  let rating = 0;
  if (row["평점"] !== undefined && row["평점"] !== null && row["평점"] !== "-") {
    const r = parseFloat(String(row["평점"]));
    rating = Number.isNaN(r) ? 0 : r;
  }

  // 🔹 댓글수: "1.2만", "1,440" 모두 숫자로 변환
  const commentCount = parseCommentCount(row["댓글수"]);

  // 회차수 ("총 101화", "101화", "101" 모두 대응)
  let episodeCount = 0;
  const totalEpRaw = row["총회차수"];
  if (typeof totalEpRaw === "string") {
    const m = totalEpRaw.match(/(\d+)/);
    if (m) episodeCount = Number(m[1]) || 0;
  } else if (typeof totalEpRaw === "number") {
    episodeCount = totalEpRaw;
  }

  const novel: Novel = {
    id,
    title: row["제목"] || "(제목 없음)",
    author: row["작가"] || "-",
    genre: toGenreByPlatform(platform, row["장르"] || "기타"),
    publisher,
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
    todayViews: todayViewsNumber,
    viewsChange: viewsChangeNumber,
    viewsChangePct: viewsChangePctNumber,
    rating,
    commentCount,
    episodeCount,
    firstAppeared: row["날짜"] || "",
    consecutiveDays: 0,
    peakRank: todayRank,
    rankHistory: row["rankHistory"] ?? [],
    viewsHistory: row["viewsHistory"] ?? [],
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
