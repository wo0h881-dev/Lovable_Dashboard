import { useEffect, useState } from "react";
import type { Novel, Platform, Genre } from "@/data/mockData";
import {
  getPlatformMaxStats,
  computeUnifiedScore,
  computeTrendScore,
  type UnifiedNovel,
} from "@/lib/rankingScore";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
const PROMO_API_KAKAO = "/api/promotions/kakao-today";

type PromotionInfo = {
  timeFreeType: "none" | "waitFree" | "threeHour";
  notices: { title: string; body: string; date?: string | null }[];
};

type KakaoPromotionPayload = {
  date: string;
  platform: "kakao";
  items: { title: string; promotion: PromotionInfo }[];
};

async function fetchKakaoPromotionMap() {
  const res = await fetch(PROMO_API_KAKAO);
  const json = (await res.json()) as KakaoPromotionPayload;

  const map = new Map<string, PromotionInfo>();
  for (const item of json.items) {
    const key = `kakao::${item.title.trim()}`;
    map.set(key, item.promotion);
  }
  return map;
}

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
  promotion?: PromotionInfo;
  rankHistory?: { date: string; rank: number | null }[];
  viewsHistory?: { date: string; views: string | number }[];
  [key: string]: any;
}

export interface ScoredNovel extends Novel {
  overallScore: number;
  trendScore: number;
}

type InternalNovel = Novel & {
  __scoreCommentCount: number;
};

function toUnifiedGenre(platform: Platform, rawGenre: string): Genre {
  const raw = (rawGenre || "").trim();

  if (platform === "naver" || platform === "kakao") {
    const validGenres = ["현판", "로판", "로맨스", "판타지", "무협", "BL", "기타"];
    return validGenres.includes(raw) ? (raw as Genre) : "기타";
  }

  const upper = raw.toUpperCase();
  if (upper.includes("BL")) return "BL";
  if (raw.includes("로맨스") && raw.includes("현대물")) return "로맨스";
  if (raw.includes("서양풍") && raw.includes("로판")) return "로판";
  if (raw.includes("로판")) return "로판";
  if (raw.includes("로맨스")) return "로맨스";
  if (raw.includes("현대 판타지") || raw.includes("현판")) return "현판";
  if (raw.includes("퓨전 판타지") || raw.includes("판타지")) return "판타지";
  if (raw.includes("무협")) return "무협";

  return "기타";
}

function toPlatform(src: string): Platform {
  const s = String(src || "").trim();
  if (s.includes("네이버") || s.toLowerCase().includes("naver")) return "naver";
  if (s.includes("리디") || s.toLowerCase().includes("ridi")) return "ridi";
  if (s.includes("카카오") || s.toLowerCase().includes("kakao")) return "kakao";
  return "kakao";
}

function parseViewsToNumber(v: string | number): number {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (!s || s === "#ERROR!") return 0;

  const regex = /([\d.,]+)\s*억|([\d.,]+)\s*만/g;
  let total = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(s)) !== null) {
    if (m[1]) total += parseFloat(m[1].replace(/,/g, "")) * 100_000_000;
    if (m[2]) total += parseFloat(m[2].replace(/,/g, "")) * 10_000;
  }
  if (total > 0) return total;

  if (s.endsWith("억")) return (parseFloat(s.replace("억", "").replace(/,/g, "")) || 0) * 100_000_000;
  if (s.endsWith("만")) return (parseFloat(s.replace("만", "").replace(/,/g, "")) || 0) * 10_000;
  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseCommentCount(raw: any): number {
  const s = String(raw || "").trim();
  if (!s || s === "-") return 0;
  if (s.endsWith("만")) return Math.round((parseFloat(s.replace("만", "")) || 0) * 10_000);
  if (s.endsWith("억")) return Math.round((parseFloat(s.replace("억", "")) || 0) * 100_000_000);
  return parseInt(s.replace(/,/g, ""), 10) || 0;
}

function parseRankChange(label: string) {
  const s = (label || "").trim();
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
  return String(v || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function buildStableKey(platform: Platform, title: string, author: string) {
  return `${platform}::${normalizeText(title)}::${normalizeText(author)}`;
}

function buildNovelId(platform: Platform, title: string, author: string) {
  return `${platform}-${normalizeText(title)}-${normalizeText(author)}`;
}

function normalizeRankHistory(
  row: TodayCombinedRow,
  fallbackDate: string,
  fallbackRank: number | null
) {
  const raw = ((row["rankHistory"] ?? []) as { date: string; rank: number | null }[])
    .filter((r) => r?.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const merged = new Map<string, number | null>();
  for (const item of raw) {
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
  const raw = ((row["viewsHistory"] ?? []) as { date: string; views: string | number }[])
    .filter((v) => v?.date)
    .map((v) => ({
      date: v.date,
      views: parseViewsToNumber(v.views),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const merged = new Map<string, number>();
  for (const item of raw) {
    const prev = merged.get(item.date) ?? 0;
    merged.set(item.date, Math.max(prev, item.views));
  }

  if (fallbackDate && fallbackViews > 0 && !merged.has(fallbackDate)) {
    merged.set(fallbackDate, fallbackViews);
  }

  return Array.from(merged.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function computeFirstAppeared(rankHistory: { date: string; rank: number | null }[], fallbackDate: string) {
  return (
    rankHistory.find((h) => h.rank !== null)?.date ||
    rankHistory[0]?.date ||
    fallbackDate ||
    ""
  );
}

function computeConsecutiveDays(rankHistory: { date: string; rank: number | null }[]) {
  const sortedDesc = [...rankHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let count = 0;
  for (const h of sortedDesc) {
    if (h.rank !== null) count++;
    else break;
  }
  return count;
}

function computePeakRank(rankHistory: { date: string; rank: number | null }[], todayRank: number) {
  const ranks = rankHistory
    .map((h) => h.rank)
    .filter((r): r is number => typeof r === "number" && r > 0);

  if (ranks.length === 0) return todayRank;
  return Math.min(...ranks);
}

function mapRowToNovel(row: TodayCombinedRow, index: number): InternalNovel {
  const platform = toPlatform(row["출처"]);
  const todayRank = parseInt(String(row["오늘순위"])) || index + 1;
  const { rankChange, isNew, isReEntry } = parseRankChange(row["순위변화"]);

  const todayViewsNumber = parseViewsToNumber(row["오늘조회수"]);
  const prevViewsNumber = parseViewsToNumber(row["전일조회수"]);
  const originalCommentCount = parseCommentCount(row["댓글수"]);

  const rankHistory = normalizeRankHistory(row, row["날짜"] || "", todayRank);
  const viewsHistory = normalizeViewsHistory(row, row["날짜"] || "", todayViewsNumber);

  return {
    id: buildNovelId(platform, row["제목"] || "", row["작가"] || ""),
    title: row["제목"] || "(제목 없음)",
    author: row["작가"] || "-",
    genre: toUnifiedGenre(platform, row["장르"] || "기타"),
    publisher: row["출판사"] || "-",
    platform,
    thumbnailUrl: row["썸네일"] && row["썸네일"] !== "-" ? row["썸네일"] : undefined,
    todayRank,
    prevRank: row["전일순위"] === "NEW" ? null : parseInt(String(row["전일순위"])),
    rankChange,
    isNew,
    isReEntry,
    todayViews: todayViewsNumber,
    viewsChange: todayViewsNumber - prevViewsNumber,
    viewsChangePct:
      prevViewsNumber > 0 ? ((todayViewsNumber - prevViewsNumber) / prevViewsNumber) * 100 : 0,
    rating: parseFloat(String(row["평점"])) || 0,
    // 표시용: 리디는 평가수를 댓글처럼 보이게
    commentCount: platform === "ridi" ? todayViewsNumber : originalCommentCount,
    __scoreCommentCount: originalCommentCount,
    episodeCount: parseInt(String(row["총회차수"]).match(/\d+/)?.[0] || "0", 10),
    firstAppeared: computeFirstAppeared(rankHistory, row["날짜"] || ""),
    coverGradient:
      platform === "naver"
        ? "from-emerald-900 to-green-700"
        : platform === "kakao"
          ? "from-amber-900 to-orange-700"
          : "from-blue-900 to-indigo-700",
    coverEmoji: platform === "naver" ? "📗" : platform === "kakao" ? "💛" : "📘",
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

function chooseBetterNovel(prev: InternalNovel, next: InternalNovel): InternalNovel {
  const mergedRankHistory = mergeRankHistory(
    prev.rankHistory as { date: string; rank: number | null }[],
    next.rankHistory as { date: string; rank: number | null }[]
  );

  const mergedViewsHistory = mergeViewsHistory(
    prev.viewsHistory as { date: string; views: number }[],
    next.viewsHistory as { date: string; views: number }[]
  );

  const betterTodayRank =
    typeof prev.todayRank === "number" && typeof next.todayRank === "number"
      ? Math.min(prev.todayRank, next.todayRank)
      : (prev.todayRank ?? next.todayRank);

  const betterTodayViews = Math.max(Number(prev.todayViews || 0), Number(next.todayViews || 0));
  const displayCommentCount = Math.max(Number(prev.commentCount || 0), Number(next.commentCount || 0));
  const scoreCommentCount = Math.max(
    Number(prev.__scoreCommentCount || 0),
    Number(next.__scoreCommentCount || 0)
  );

  const base =
    (next.rankHistory?.length || 0) > (prev.rankHistory?.length || 0)
      ? next
      : prev;

  return {
    ...base,
    id: buildNovelId(base.platform, base.title, base.author),
    title: prev.title || next.title,
    author: prev.author || next.author,
    genre: prev.genre || next.genre,
    publisher: prev.publisher !== "-" ? prev.publisher : next.publisher,
    thumbnailUrl: prev.thumbnailUrl || next.thumbnailUrl,
    todayRank: betterTodayRank,
    prevRank: prev.prevRank ?? next.prevRank,
    rankChange: prev.rankChange ?? next.rankChange,
    isNew: prev.isNew || next.isNew,
    isReEntry: prev.isReEntry || next.isReEntry,
    todayViews: betterTodayViews,
    viewsChange: Math.max(Number(prev.viewsChange || 0), Number(next.viewsChange || 0)),
    viewsChangePct: Math.max(Number(prev.viewsChangePct || 0), Number(next.viewsChangePct || 0)),
    rating: Math.max(Number(prev.rating || 0), Number(next.rating || 0)),
    commentCount: displayCommentCount,
    __scoreCommentCount: scoreCommentCount,
    episodeCount: Math.max(Number(prev.episodeCount || 0), Number(next.episodeCount || 0)),
    promotion: prev.promotion || next.promotion,
    rankHistory: mergedRankHistory,
    viewsHistory: mergedViewsHistory,
    firstAppeared: computeFirstAppeared(
      mergedRankHistory,
      prev.firstAppeared || next.firstAppeared || ""
    ),
    consecutiveDays: computeConsecutiveDays(mergedRankHistory),
    peakRank: computePeakRank(mergedRankHistory, betterTodayRank || 999),
  };
}

function dedupeNovels(novels: InternalNovel[]) {
  const map = new Map<string, InternalNovel>();

  for (const novel of novels) {
    const key = buildStableKey(novel.platform, novel.title, novel.author);
    const prev = map.get(key);

    if (!prev) {
      map.set(key, novel);
      continue;
    }

    map.set(key, chooseBetterNovel(prev, novel));
  }

  return Array.from(map.values());
}

export function useTodayCombined() {
  const [data, setData] = useState<ScoredNovel[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        if (!APPS_SCRIPT_URL) throw new Error("VITE_APPS_SCRIPT_URL 미설정");

        const res = await fetch(`${APPS_SCRIPT_URL}?action=getTodayCombined`);
        const rows = (await res.json()) as TodayCombinedRow[];

        if (!rows || rows.length === 0) {
          setData([]);
          return;
        }

        const dates = rows.map((r) => r.날짜).filter(Boolean).sort().reverse();
        const mostRecentDate = dates[0];
        setLatestDate(mostRecentDate);

        const promoMap = await fetchKakaoPromotionMap();

        const mapped = rows
          .filter((r) => r.날짜 === mostRecentDate)
          .map((row, idx) => {
            const n = mapRowToNovel(row, idx);

            if (n.platform === "kakao") {
              const key = `kakao::${n.title.trim()}`;
              const promo = promoMap.get(key);
              if (promo) {
                n.promotion = promo;
              }
            }

            return n;
          });

        // 중복 제거는 적용
        const novels = dedupeNovels(mapped);

        // 점수 계산은 원래와 같은 필드 사용
        const scoringInput = novels.map((n) => ({
          ...n,
          commentCount: n.__scoreCommentCount,
        })) as unknown as UnifiedNovel[];

        const stats = getPlatformMaxStats(scoringInput);

        const scoredNovels: ScoredNovel[] = novels.map((n) => {
          const scoreNovel = {
            ...n,
            commentCount: n.__scoreCommentCount,
          } as unknown as UnifiedNovel;

          return {
            ...n,
            overallScore: computeUnifiedScore(
              scoreNovel,
              stats.maxViewsByPlatform,
              stats.maxCommentsByPlatform,
              stats.maxDeltaByPlatform
            ),
            trendScore: computeTrendScore(
              scoreNovel,
              stats.maxViewsByPlatform,
              stats.maxCommentsByPlatform,
              stats.maxDeltaByPlatform
            ),
          };
        });

        setData(scoredNovels);
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
