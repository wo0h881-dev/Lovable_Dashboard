import { useEffect, useState } from "react";
import type { Novel, Platform, Genre } from "@/data/mockData";
import {
  getPlatformMaxStats,
  computeUnifiedScore,
  computeTrendScore,
  type UnifiedNovel,
} from "@/lib/rankingScore";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

/* =========================
   타입
========================= */

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
  댓글수?: string | number;
  평점?: string | number;
  총회차수?: string | number;
  썸네일?: string;
  출판사?: string;
  rankHistory?: { date: string; rank: number | null }[];
  viewsHistory?: { date: string; views: string | number }[];
}

export interface ScoredNovel extends Novel {
  overallScore: number;
  trendScore: number;
}

/* =========================
   공통 유틸
========================= */

function toPlatform(raw: string): Platform {
  const s = (raw || "").toLowerCase();
  if (s.includes("naver")) return "naver";
  if (s.includes("kakao")) return "kakao";
  return "ridi";
}

function toUnifiedGenre(platform: Platform, raw: string): Genre {
  if (!raw) return "기타";

  if (platform === "naver" || platform === "kakao") {
    const valid = ["현판", "로판", "로맨스", "판타지", "무협", "BL"];
    return valid.includes(raw) ? (raw as Genre) : "기타";
  }

  if (raw.includes("BL")) return "BL";
  if (raw.includes("로판")) return "로판";
  if (raw.includes("판타지")) return "판타지";
  if (raw.includes("현판")) return "현판";
  if (raw.includes("무협")) return "무협";
  if (raw.includes("로맨스")) return "로맨스";

  return "기타";
}

function parseViews(v: any): number {
  const s = String(v || "").trim();
  if (!s || s === "-") return 0;

  if (s.includes("억")) return parseFloat(s) * 100_000_000;
  if (s.includes("만")) return parseFloat(s) * 10_000;

  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseComment(v: any): number {
  const s = String(v || "").trim();
  if (!s || s === "-") return 0;
  if (s.includes("만")) return parseFloat(s) * 10_000;
  return parseInt(s.replace(/,/g, ""), 10) || 0;
}

function normalizeKey(text: string) {
  return (text || "").trim().toLowerCase();
}

function buildKey(n: Novel) {
  return `${n.platform}::${normalizeKey(n.title)}::${normalizeKey(n.author)}`;
}

/* =========================
   히스토리 계산
========================= */

function getFirstAppeared(history: any[], fallback: string) {
  return history.find((h) => h.rank !== null)?.date || fallback;
}

function getConsecutive(history: any[]) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let count = 0;
  for (const h of sorted) {
    if (h.rank !== null) count++;
    else break;
  }
  return count;
}

function getPeak(history: any[], todayRank: number) {
  const ranks = history
    .map((h) => h.rank)
    .filter((r): r is number => typeof r === "number");

  return ranks.length ? Math.min(...ranks) : todayRank;
}

/* =========================
   변환
========================= */

function mapRow(row: TodayCombinedRow, index: number): Novel {
  const platform = toPlatform(row.출처);
  const todayRank = Number(row.오늘순위) || index + 1;

  const todayViews = parseViews(row.오늘조회수);
  const prevViews = parseViews(row.전일조회수);

  const rankHistory = row.rankHistory || [
    { date: row.날짜, rank: todayRank },
  ];

  const viewsHistory = row.viewsHistory || [
    { date: row.날짜, views: todayViews },
  ];

  // ⭐ 리디 핵심 수정
  const commentCount =
    platform === "ridi"
      ? todayViews
      : parseComment(row.댓글수);

  return {
    id: `${platform}-${normalizeKey(row.제목)}-${normalizeKey(row.작가)}`,
    title: row.제목,
    author: row.작가,
    genre: toUnifiedGenre(platform, row.장르),
    publisher: row.출판사 || "-",
    platform,
    thumbnailUrl: row.썸네일,
    todayRank,
    prevRank: Number(row.전일순위) || null,
    rankChange: null,
    isNew: false,
    isReEntry: false,
    todayViews,
    viewsChange: todayViews - prevViews,
    viewsChangePct:
      prevViews > 0 ? ((todayViews - prevViews) / prevViews) * 100 : 0,
    rating: Number(row.평점) || 0,
    commentCount,
    episodeCount: Number(row.총회차수) || 0,
    firstAppeared: getFirstAppeared(rankHistory, row.날짜),
    rankHistory,
    viewsHistory,
    consecutiveDays: getConsecutive(rankHistory),
    peakRank: getPeak(rankHistory, todayRank),
    status: "none",
    readingGoal: 0,
    currentEpisode: 0,
  };
}

/* =========================
   중복 제거
========================= */

function dedupe(novels: Novel[]) {
  const map = new Map<string, Novel>();

  for (const n of novels) {
    const key = buildKey(n);
    const prev = map.get(key);

    if (!prev) {
      map.set(key, n);
      continue;
    }

    // 더 좋은 데이터 선택
    const better =
      (n.rankHistory?.length || 0) > (prev.rankHistory?.length || 0)
        ? n
        : prev;

    map.set(key, better);
  }

  return Array.from(map.values());
}

/* =========================
   메인 훅 (⭐ export 중요)
========================= */

export function useTodayCombined() {
  const [data, setData] = useState<ScoredNovel[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getTodayCombined`);
        const rows: TodayCombinedRow[] = await res.json();

        const latest = rows.map((r) => r.날짜).sort().reverse()[0];
        setLatestDate(latest);

        const novels = rows
          .filter((r) => r.날짜 === latest)
          .map(mapRow);

        const deduped = dedupe(novels);

        const stats = getPlatformMaxStats(deduped as any);

        const scored = deduped.map((n) => ({
          ...n,
          overallScore: computeUnifiedScore(n as any, stats.maxViewsByPlatform, stats.maxCommentsByPlatform, stats.maxDeltaByPlatform),
          trendScore: computeTrendScore(n as any, stats.maxViewsByPlatform, stats.maxCommentsByPlatform, stats.maxDeltaByPlatform),
        }));

        setData(scored);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return { data, isLoading, error, latestDate };
}
