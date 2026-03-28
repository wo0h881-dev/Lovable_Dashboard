import { useEffect, useState } from "react";
import type { Novel, Platform, Genre } from "@/data/mockData";
import {
  getPlatformMaxStats,
  computeUnifiedScore,
  computeTrendScore,
  type UnifiedNovel,
} from "@/lib/rankingScore";

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
  댓글수?: string | number;
  평점?: string | number;
  총회차수?: string | number;
  썸네일?: string;
  출판사?: string;
  promotion?: any;
  rankHistory?: { date: string; rank: number | null }[];
  viewsHistory?: { date: string; views: string | number }[];
}

export interface ScoredNovel extends Novel {
  overallScore: number;
  trendScore: number;
}

function toPlatform(raw: string): Platform {
  const s = String(raw || "").trim().toLowerCase();

  if (s.includes("naver") || s.includes("네이버")) return "naver";
  if (s.includes("kakao") || s.includes("카카오")) return "kakao";
  if (s.includes("ridi") || s.includes("리디")) return "ridi";

  return "ridi";
}

function toUnifiedGenre(platform: Platform, raw: string): Genre {
  const value = String(raw || "").trim();

  if (!value) return "기타";

  if (platform === "naver" || platform === "kakao") {
    const valid = ["현판", "로판", "로맨스", "판타지", "무협", "BL"];
    return valid.includes(value) ? (value as Genre) : "기타";
  }

  if (value.includes("BL")) return "BL";
  if (value.includes("로판")) return "로판";
  if (value.includes("판타지")) return "판타지";
  if (value.includes("현판")) return "현판";
  if (value.includes("무협")) return "무협";
  if (value.includes("로맨스")) return "로맨스";

  return "기타";
}

function parseViews(v: any): number {
  const s = String(v || "").trim();
  if (!s || s === "-") return 0;

  const regex = /([\d.,]+)\s*억|([\d.,]+)\s*만/g;
  let total = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(s)) !== null) {
    if (m[1]) total += (parseFloat(m[1].replace(/,/g, "")) || 0) * 100_000_000;
    if (m[2]) total += (parseFloat(m[2].replace(/,/g, "")) || 0) * 10_000;
  }

  if (total > 0) return total;

  if (s.endsWith("억")) return (parseFloat(s.replace("억", "").replace(/,/g, "")) || 0) * 100_000_000;
  if (s.endsWith("만")) return (parseFloat(s.replace("만", "").replace(/,/g, "")) || 0) * 10_000;

  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseComment(v: any): number {
  const s = String(v || "").trim();
  if (!s || s === "-") return 0;
  if (s.includes("억")) return Math.round((parseFloat(s.replace("억", "").replace(/,/g, "")) || 0) * 100_000_000);
  if (s.includes("만")) return Math.round((parseFloat(s.replace("만", "").replace(/,/g, "")) || 0) * 10_000);
  return parseInt(s.replace(/,/g, ""), 10) || 0;
}

function parseRankChange(label: string) {
  const s = String(label || "").trim();

  if (s === "NEW") return { rankChange: null, isNew: true, isReEntry: false };
  if (s === "재진입") return { rankChange: null, isNew: false, isReEntry: true };
  if (s === "유지") return { rankChange: 0, isNew: false, isReEntry: false };

  if (s.startsWith("▲")) {
    return {
      rankChange: parseInt(s.replace("▲", ""), 10) || null,
      isNew: false,
      isReEntry: false,
    };
  }

  if (s.startsWith("▼")) {
    return {
      rankChange: -(parseInt(s.replace("▼", ""), 10) || 0),
      isNew: false,
      isReEntry: false,
    };
  }

  return { rankChange: null, isNew: false, isReEntry: false };
}

function normalizeText(v: string | undefined | null) {
  return String(v || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function buildNovelId(row: TodayCombinedRow, platform: Platform) {
  return `${platform}-${normalizeText(row["제목"])}-${normalizeText(row["작가"])}`;
}

function buildStableKey(novel: Novel) {
  return `${novel.platform}::${normalizeText(novel.title)}::${normalizeText(novel.author)}`;
}

function normalizeRankHistory(
  row: TodayCombinedRow,
  fallbackDate: string,
  fallbackRank: number | null
) {
  const raw = (row.rankHistory ?? []) as { date: string; rank: number | null }[];
  const merged = new Map<string, number | null>();

  for (const item of raw) {
    if (!item?.date) continue;
    if (!merged.has(item.date) || (merged.get(item.date) === null && item.rank !== null)) {
      merged.set(item.date, item.rank ?? null);
    }
  }

  if (fallbackDate && !merged.has(fallbackDate)) {
    merged.set(fallbackDate, fallbackRank);
  }

  return Array.from(merged.entries())
    .map(([date, rank]) => ({ date, rank }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function normalizeViewsHistory(
  row: TodayCombinedRow,
  fallbackDate: string,
  fallbackViews: number
) {
  const raw = (row.viewsHistory ?? []) as { date: string; views: string | number }[];
  const merged = new Map<string, number>();

  for (const item of raw) {
    if (!item?.date) continue;
    merged.set(item.date, parseViews(item.views));
  }

  if (fallbackDate && fallbackViews > 0 && !merged.has(fallbackDate)) {
    merged.set(fallbackDate, fallbackViews);
  }

  return Array.from(merged.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function computeFirstAppeared(history: { date: string; rank: number | null }[], fallbackDate: string) {
  return history.find((h) => h.rank !== null)?.date || fallbackDate || "";
}

function computeConsecutiveDays(history: { date: string; rank: number | null }[]) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let count = 0;
  for (const item of sorted) {
    if (item.rank !== null) count++;
    else break;
  }
  return count;
}

function computePeakRank(history: { date: string; rank: number | null }[], fallbackRank: number) {
  const ranks = history
    .map((h) => h.rank)
    .filter((r): r is number => typeof r === "number" && r > 0);

  if (ranks.length === 0) return fallbackRank;
  return Math.min(...ranks);
}

function mapRowToNovel(row: TodayCombinedRow, index: number): Novel {
  const platform = toPlatform(row.출처);
  const todayRank = Number(row.오늘순위) || index + 1;
  const { rankChange, isNew, isReEntry } = parseRankChange(row.순위변화);

  const todayViews = parseViews(row.오늘조회수);
  const prevViews = parseViews(row.전일조회수);

  const rankHistory = normalizeRankHistory(row, row.날짜 || "", todayRank);
  const viewsHistory = normalizeViewsHistory(row, row.날짜 || "", todayViews);

  const commentCount =
    platform === "ridi"
      ? todayViews
      : parseComment(row.댓글수);

  return {
    id: buildNovelId(row, platform),
    title: row.제목 || "(제목 없음)",
    author: row.작가 || "-",
    genre: toUnifiedGenre(platform, row.장르),
    publisher: row.출판사 || "-",
    platform,
    thumbnailUrl: row.썸네일 && row.썸네일 !== "-" ? row.썸네일 : undefined,
    todayRank,
    prevRank: row.전일순위 === "NEW" ? null : Number(row.전일순위) || null,
    rankChange,
    isNew,
    isReEntry,
    todayViews,
    viewsChange: todayViews - prevViews,
    viewsChangePct: prevViews > 0 ? ((todayViews - prevViews) / prevViews) * 100 : 0,
    rating: Number(row.평점) || 0,
    commentCount,
    episodeCount: Number(String(row.총회차수 || "").match(/\d+/)?.[0] || 0),
    firstAppeared: computeFirstAppeared(rankHistory, row.날짜 || ""),
    rankHistory,
    viewsHistory,
    consecutiveDays: computeConsecutiveDays(rankHistory),
    peakRank: computePeakRank(rankHistory, todayRank),
    promotion: row.promotion,
    status: "none",
    readingGoal: 0,
    currentEpisode: 0,
  };
}

function mergeRankHistory(
  a: { date: string; rank: number | null }[] = [],
  b: { date: string; rank: number | null }[] = []
) {
  const merged = new Map<string, number | null>();

  for (const item of [...a, ...b]) {
    if (!item?.date) continue;
    if (!merged.has(item.date) || (merged.get(item.date) === null && item.rank !== null)) {
      merged.set(item.date, item.rank ?? null);
    }
  }

  return Array.from(merged.entries())
    .map(([date, rank]) => ({ date, rank }))
    .sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
}

function mergeViewsHistory(
  a: { date: string; views: number }[] = [],
  b: { date: string; views: number }[] = []
) {
  const merged = new Map<string, number>();

  for (const item of [...a, ...b]) {
    if (!item?.date) continue;
    const prev = merged.get(item.date) ?? 0;
    merged.set(item.date, Math.max(prev, Number(item.views || 0)));
  }

  return Array.from(merged.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
}

function chooseBetterNovel(prev: Novel, next: Novel): Novel {
  const mergedRankHistory = mergeRankHistory(
    prev.rankHistory as { date: string; rank: number | null }[],
    next.rankHistory as { date: string; rank: number | null }[]
  );

  const mergedViewsHistory = mergeViewsHistory(
    prev.viewsHistory as { date: string; views: number }[],
    next.viewsHistory as { date: string; views: number }[]
  );

  const todayRank =
    typeof prev.todayRank === "number" && typeof next.todayRank === "number"
      ? Math.min(prev.todayRank, next.todayRank)
      : (prev.todayRank ?? next.todayRank);

  const todayViews = Math.max(Number(prev.todayViews || 0), Number(next.todayViews || 0));
  const commentCount = Math.max(Number(prev.commentCount || 0), Number(next.commentCount || 0));

  const base =
    (next.rankHistory?.length || 0) > (prev.rankHistory?.length || 0)
      ? next
      : prev;

  return {
    ...base,
    title: prev.title || next.title,
    author: prev.author || next.author,
    genre: prev.genre || next.genre,
    publisher: prev.publisher !== "-" ? prev.publisher : next.publisher,
    thumbnailUrl: prev.thumbnailUrl || next.thumbnailUrl,
    todayRank,
    prevRank: prev.prevRank ?? next.prevRank,
    rankChange: prev.rankChange ?? next.rankChange,
    isNew: prev.isNew || next.isNew,
    isReEntry: prev.isReEntry || next.isReEntry,
    todayViews,
    viewsChange: Math.max(Number(prev.viewsChange || 0), Number(next.viewsChange || 0)),
    viewsChangePct: Math.max(Number(prev.viewsChangePct || 0), Number(next.viewsChangePct || 0)),
    rating: Math.max(Number(prev.rating || 0), Number(next.rating || 0)),
    commentCount,
    episodeCount: Math.max(Number(prev.episodeCount || 0), Number(next.episodeCount || 0)),
    promotion: prev.promotion || next.promotion,
    rankHistory: mergedRankHistory,
    viewsHistory: mergedViewsHistory,
    firstAppeared: computeFirstAppeared(
      mergedRankHistory,
      prev.firstAppeared || next.firstAppeared || ""
    ),
    consecutiveDays: computeConsecutiveDays(mergedRankHistory),
    peakRank: computePeakRank(mergedRankHistory, todayRank || 999),
  };
}

function dedupeNovels(novels: Novel[]) {
  const map = new Map<string, Novel>();

  for (const novel of novels) {
    const key = buildStableKey(novel);
    const prev = map.get(key);

    if (!prev) {
      map.set(key, novel);
      continue;
    }

    map.set(key, chooseBetterNovel(prev, novel));
  }

  return Array.from(map.values());
}

export interface ScoredNovel extends Novel {
  overallScore: number;
  trendScore: number;
}

export function useTodayCombined() {
  const [data, setData] = useState<ScoredNovel[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (!APPS_SCRIPT_URL) {
          throw new Error("VITE_APPS_SCRIPT_URL 미설정");
        }

        const res = await fetch(`${APPS_SCRIPT_URL}?action=getTodayCombined`);
        const rows: TodayCombinedRow[] = await res.json();

        if (!rows || rows.length === 0) {
          setData([]);
          setLatestDate("");
          return;
        }

        const latest = rows
          .map((r) => r.날짜)
          .filter(Boolean)
          .sort()
          .reverse()[0];

        setLatestDate(latest);

        const novels = rows
          .filter((r) => r.날짜 === latest)
          .map((row, idx) => mapRowToNovel(row, idx));

        const deduped = dedupeNovels(novels);

        const stats = getPlatformMaxStats(deduped as unknown as UnifiedNovel[]);

        const scored: ScoredNovel[] = deduped.map((n) => ({
          ...n,
          overallScore: computeUnifiedScore(
            n as unknown as UnifiedNovel,
            stats.maxViewsByPlatform,
            stats.maxCommentsByPlatform,
            stats.maxDeltaByPlatform
          ),
          trendScore: computeTrendScore(
            n as unknown as UnifiedNovel,
            stats.maxViewsByPlatform,
            stats.maxCommentsByPlatform,
            stats.maxDeltaByPlatform
          ),
        }));

        setData(scored);
      } catch (e: any) {
        setError(e.message || "데이터를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return { data, isLoading, error, latestDate };
}
