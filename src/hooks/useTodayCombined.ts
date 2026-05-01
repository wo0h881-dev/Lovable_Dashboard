import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Novel, Platform, Genre, PromotionInfo } from "@/data/mockData";
import {
  getPlatformMaxStats,
  computeUnifiedScore,
  computeTrendScore,
  type UnifiedNovel,
} from "@/lib/rankingScore";

const PROMO_API_KAKAO = "/api/promotions/kakao-today";
const PROMO_API_NAVER = "/api/promotions/naver-today";
const PROMO_API_RIDI = "/api/promotions/ridi-today";

export type DateRange = "today" | "7d" | "30d";

export const dateRangeLabels: Record<DateRange, string> = {
  today: "오늘",
  "7d": "최근 7일",
  "30d": "최근 30일",
};

type PromotionPayload = {
  date: string;
  platform: Platform;
  items: { title: string; promotion: PromotionInfo }[];
};

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
  comments?: string | number;
  commentCount?: string | number;
  totalEpisodes?: string | number;
  episodeCount?: string | number;
  promotion?: PromotionInfo | string | null;
  rankHistory?: { date: string; rank: number | null }[];
  viewsHistory?: { date: string; views: string | number }[];
  [key: string]: unknown;
}

type PromotionRecord = Record<string, unknown>;

interface TodayCombinedRawData {
  rows: TodayCombinedRow[];
  kakaoPromoMap: Map<string, PromotionInfo>;
  naverPromoMap: Map<string, PromotionInfo>;
  ridiPromoMap: Map<string, PromotionInfo>;
  dates: string[];
}

export interface ScoredNovel extends Novel {
  overallScore: number;
  trendScore: number;
}

function toUnifiedGenre(platform: Platform, rawGenre: string): Genre {
  const raw = (rawGenre || "").trim();

  if (platform === "naver" || platform === "kakao") {
    const validGenres: Genre[] = [
      "현판",
      "로판",
      "로맨스",
      "판타지",
      "무협",
      "BL",
      "현대물",
      "역사/시대물",
      "기타",
    ];
    return validGenres.includes(raw as Genre) ? (raw as Genre) : "기타";
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

function parseViewsToNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (!s || s === "#ERROR!" || s === "-") return 0;

  const regex = /([\d.,]+)\s*억|([\d.,]+)\s*만/g;
  let total = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(s)) !== null) {
    if (m[1]) total += parseFloat(m[1].replace(/,/g, "")) * 100_000_000;
    if (m[2]) total += parseFloat(m[2].replace(/,/g, "")) * 10_000;
  }
  if (total > 0) return total;

  if (s.endsWith("억")) {
    return (parseFloat(s.replace("억", "").replace(/,/g, "")) || 0) * 100_000_000;
  }
  if (s.endsWith("만")) {
    return (parseFloat(s.replace("만", "").replace(/,/g, "")) || 0) * 10_000;
  }

  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseCommentCount(raw: unknown): number {
  const s = String(raw || "").trim();
  if (s.endsWith("만")) {
    return Math.round((parseFloat(s.replace("만", "")) || 0) * 10_000);
  }
  return parseInt(s.replace(/,/g, ""), 10) || 0;
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => {
    if (value === null || value === undefined) return false;
    const text = String(value).trim();
    return text !== "" && text !== "-" && text !== "#ERROR!";
  });
}

function parseEpisodeCount(raw: unknown): number {
  const value = firstPresent(raw);
  if (value === undefined) return 0;
  return parseInt(String(value).match(/\d[\d,]*/)?.[0]?.replace(/,/g, "") || "0", 10);
}

function parseRankChange(label: string) {
  const s = (label || "").trim();
  if (s === "NEW") {
    return { rankChange: null, isNew: true, isReEntry: false };
  }
  if (s === "재진입") {
    return { rankChange: null, isNew: false, isReEntry: true };
  }
  if (s === "유지") {
    return { rankChange: 0, isNew: false, isReEntry: false };
  }
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

function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (value === undefined || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;

  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function isPromotionRecord(value: unknown): value is PromotionRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function getArray(value: unknown): PromotionRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(isPromotionRecord);
}

function normalizePromotion(
  platform: Platform,
  promotion: TodayCombinedRow["promotion"],
): PromotionInfo | undefined {
  if (!promotion) return undefined;

  let parsed: unknown = promotion;

  if (typeof parsed === "string") {
    const s = parsed.trim();
    if (!s) return undefined;
    try {
      parsed = JSON.parse(s);
    } catch {
      return undefined;
    }
  }

  if (!isPromotionRecord(parsed)) return undefined;

  const normalized: PromotionInfo = {
    timeFreeType:
      parsed.timeFreeType === "none" ||
      parsed.timeFreeType === "waitFree" ||
      parsed.timeFreeType === "threeHour" ||
      parsed.timeFreeType === "pass"
        ? parsed.timeFreeType
        : undefined,

    tag: getString(parsed.tag),
    freeEpisodes: toOptionalNumber(parsed.freeEpisodes),
    daysLeft: toOptionalNumber(parsed.daysLeft),

    eventBanners: getArray(parsed.eventBanners)
      ?.filter((b) => typeof b.title === "string" || typeof b.subtitle === "string")
      .map((b) => {
            const title = String(b.title ?? "").trim();
            const subtitle = String(b.subtitle ?? "").trim();
            return {
              title,
              subtitle: subtitle || undefined,
            };
          })
          .filter((b) => b.title || b.subtitle),

    notices: getArray(parsed.notices)
      ?.filter((n) => typeof n.title === "string" || typeof n.body === "string")
      .map((n) => {
            const label = String(n.label ?? "").trim();
            const title = String(n.title ?? "").trim();
            const body = String(n.body ?? "").trim();

            return {
              label: label || undefined,
              title: title || body || "",
              body: body || undefined,
              date: n.date ? String(n.date).trim() : undefined,
            };
          })
          .filter((n) => n.title),

    benefits: getArray(parsed.benefits)
      ?.filter((b) => typeof b.title === "string" || typeof b.subtitle === "string")
      .map((b) => {
            const label = String(b.label ?? "").trim();
            const title = String(b.title ?? "").trim();
            const subtitle = String(b.subtitle ?? "").trim();

            return {
              label: label || undefined,
              title,
              subtitle: subtitle || undefined,
            };
          })
          .filter((b) => b.title),

    serialSchedule: getString(parsed.serialSchedule),

    exclusiveText: getString(parsed.exclusiveText),

    ridiWaitFreeText: getString(parsed.ridiWaitFreeText),

    ridiWaitFree:
      typeof parsed.ridiWaitFree === "boolean" ? parsed.ridiWaitFree : undefined,

    ridiFreeLabel:
      parsed.ridiFreeLabel == null
        ? null
        : String(parsed.ridiFreeLabel).trim() || null,
  };

  if (platform === "ridi") {
    if (!normalized.timeFreeType) {
      if (normalized.ridiWaitFree) {
        normalized.timeFreeType = "waitFree";
      } else if (normalized.ridiFreeLabel) {
        const label = normalized.ridiFreeLabel.replace(/\s+/g, "").toLowerCase();
        if (label.includes("3")) {
          normalized.timeFreeType = "threeHour";
        } else if (
          label.includes("기다무") ||
          label.includes("리다무") ||
          label.includes("대여") ||
          label.includes("무료")
        ) {
          normalized.timeFreeType = "waitFree";
        }
      }
    }

    if (!normalized.tag && normalized.ridiFreeLabel) {
      normalized.tag = normalized.ridiFreeLabel;
    }
  }

  if (platform === "naver") {
    if (!normalized.timeFreeType && normalized.tag) {
      const tag = normalized.tag.replace(/\s+/g, "").toLowerCase();
      if (tag.includes("3다무") || tag.includes("3시간") || tag.includes("타임딜")) {
        normalized.timeFreeType = "threeHour";
      } else if (
        tag.includes("기다무") ||
        tag.includes("매일무료") ||
        tag.includes("매일10시무료") ||
        tag.includes("기다리면무료")
      ) {
        normalized.timeFreeType = "waitFree";
      } else if (tag.includes("이용권") || tag.includes("패스") || tag.includes("에디션")) {
        normalized.timeFreeType = "pass";
      }
    }
  }

  const hasValue = Object.values(normalized).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined;
  });

  return hasValue ? normalized : undefined;
}

function mergeNoticeArrays(
  base?: PromotionInfo["notices"],
  incoming?: PromotionInfo["notices"],
): PromotionInfo["notices"] {
  const merged = [...(base ?? []), ...(incoming ?? [])]
    .filter((item) => item && (item.title || item.body))
    .map((item) => ({
      label: item.label,
      title: item.title || item.body || "",
      body: item.body,
      date: item.date,
    }));

  if (merged.length === 0) return undefined;

  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = `${item.label ?? ""}::${item.title ?? ""}::${item.body ?? ""}::${item.date ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeBannerArrays(
  base?: PromotionInfo["eventBanners"],
  incoming?: PromotionInfo["eventBanners"],
): PromotionInfo["eventBanners"] {
  const merged = [...(base ?? []), ...(incoming ?? [])]
    .filter((item) => item && (item.title || item.subtitle))
    .map((item) => ({
      title: item.title || "",
      subtitle: item.subtitle,
    }));

  if (merged.length === 0) return undefined;

  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = `${item.title ?? ""}::${item.subtitle ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeBenefitArrays(
  base?: PromotionInfo["benefits"],
  incoming?: PromotionInfo["benefits"],
): PromotionInfo["benefits"] {
  const merged = [...(base ?? []), ...(incoming ?? [])]
    .filter((item) => item && item.title)
    .map((item) => ({
      label: item.label,
      title: item.title,
      subtitle: item.subtitle,
    }));

  if (merged.length === 0) return undefined;

  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = `${item.label ?? ""}::${item.title ?? ""}::${item.subtitle ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeRidiPromotion(
  base?: PromotionInfo,
  incoming?: PromotionInfo,
): PromotionInfo | undefined {
  if (!base && !incoming) return undefined;
  if (!base) return incoming;
  if (!incoming) return base;

  return {
    ...base,
    ...incoming,
    timeFreeType: incoming.timeFreeType || base.timeFreeType,
    tag: incoming.tag || base.tag,
    freeEpisodes:
      incoming.freeEpisodes !== undefined ? incoming.freeEpisodes : base.freeEpisodes,
    daysLeft:
      incoming.daysLeft !== undefined ? incoming.daysLeft : base.daysLeft,

    eventBanners: mergeBannerArrays(base.eventBanners, incoming.eventBanners),
    notices: mergeNoticeArrays(base.notices, incoming.notices),
    benefits: mergeBenefitArrays(base.benefits, incoming.benefits),

    serialSchedule: incoming.serialSchedule || base.serialSchedule,
    exclusiveText: incoming.exclusiveText || base.exclusiveText,
    ridiWaitFreeText: incoming.ridiWaitFreeText || base.ridiWaitFreeText,

    ridiWaitFree:
      incoming.ridiWaitFree !== undefined ? incoming.ridiWaitFree : base.ridiWaitFree,
    ridiFreeLabel:
      incoming.ridiFreeLabel !== undefined ? incoming.ridiFreeLabel : base.ridiFreeLabel,
  };
}

async function fetchPromotionMap(
  url: string,
  platform: Platform,
): Promise<Map<string, PromotionInfo>> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${platform} promotion fetch failed: ${res.status}`);
  }

  const json = (await res.json()) as PromotionPayload;
  const map = new Map<string, PromotionInfo>();

  for (const item of json.items ?? []) {
    const key = `${platform}::${item.title.trim()}`;
    map.set(key, item.promotion);
  }

  return map;
}

async function fetchTodayCombinedRaw(): Promise<TodayCombinedRawData> {
  const [rowsRes, kakaoPromoMap, naverPromoMap, ridiPromoMap] =
    await Promise.all([
      fetch("/api/rankings?action=getTodayCombined"),
      fetchPromotionMap(PROMO_API_KAKAO, "kakao"),
      fetchPromotionMap(PROMO_API_NAVER, "naver"),
      fetchPromotionMap(PROMO_API_RIDI, "ridi"),
    ]);

  if (!rowsRes.ok) {
    throw new Error(`today combined fetch failed: ${rowsRes.status}`);
  }

  const rows = (await rowsRes.json()) as TodayCombinedRow[];
  const dates = getAvailableDates(rows);

  return { rows, kakaoPromoMap, naverPromoMap, ridiPromoMap, dates };
}

function getAvailableDates(rows: TodayCombinedRow[]): string[] {
  const dates = new Set<string>();

  for (const row of rows) {
    if (row.날짜) dates.add(row.날짜);

    for (const history of row.rankHistory ?? []) {
      if (history?.date) dates.add(history.date);
    }

    for (const history of row.viewsHistory ?? []) {
      if (history?.date) dates.add(history.date);
    }
  }

  return Array.from(dates).sort().reverse();
}

function getDateLimit(dateRange: DateRange): number {
  if (dateRange === "30d") return 30;
  if (dateRange === "7d") return 7;
  return 1;
}

function getIdentity(row: TodayCombinedRow): string {
  return [
    toPlatform(row.출처),
    String(row.제목 || "").trim().replace(/\s+/g, " ").toLowerCase(),
    String(row.작가 || "").trim().replace(/\s+/g, " ").toLowerCase(),
  ].join("::");
}

function getLatestRow(rows: TodayCombinedRow[]): TodayCombinedRow {
  return [...rows].sort((a, b) => {
    const dateDiff = String(b.날짜 || "").localeCompare(String(a.날짜 || ""));
    if (dateDiff !== 0) return dateDiff;
    return (parseInt(String(a.오늘순위), 10) || 999) - (parseInt(String(b.오늘순위), 10) || 999);
  })[0];
}

function rowHasSelectedDate(row: TodayCombinedRow, selectedDateSet: Set<string>): boolean {
  if (row.날짜 && selectedDateSet.has(row.날짜)) return true;
  if ((row.rankHistory ?? []).some((history) => history?.date && selectedDateSet.has(history.date))) {
    return true;
  }
  return (row.viewsHistory ?? []).some(
    (history) => history?.date && selectedDateSet.has(history.date),
  );
}

function mergePromotionForNovel(
  novel: Novel,
  rawData: TodayCombinedRawData,
): PromotionInfo | undefined {
  const key = `${novel.platform}::${novel.title.trim()}`;
  const promo =
    novel.platform === "kakao"
      ? rawData.kakaoPromoMap.get(key)
      : novel.platform === "naver"
        ? rawData.naverPromoMap.get(key)
        : rawData.ridiPromoMap.get(key);

  if (!promo) return novel.promotion;
  if (novel.platform === "ridi") {
    return mergeRidiPromotion(novel.promotion, promo);
  }

  return {
    ...(novel.promotion ?? {}),
    ...promo,
  };
}

function mapRowToNovel(
  row: TodayCombinedRow,
  periodRows: TodayCombinedRow[],
  index: number,
  selectedDateSet: Set<string>,
): Novel {
  const platform = toPlatform(row.출처);
  const todayRank = parseInt(String(row.오늘순위), 10) || index + 1;
  const { rankChange, isNew, isReEntry } = parseRankChange(row.순위변화);
  const todayViewsNumber = parseViewsToNumber(row.오늘조회수);
  const prevViewsNumber = parseViewsToNumber(row.전일조회수);

  const rankHistoryMap = new Map<string, number | null>();
  const viewsHistoryMap = new Map<string, number>();

  for (const history of row.rankHistory ?? []) {
    if (history?.date && selectedDateSet.has(history.date)) {
      rankHistoryMap.set(history.date, history.rank);
    }
  }

  for (const history of row.viewsHistory ?? []) {
    if (history?.date && selectedDateSet.has(history.date)) {
      viewsHistoryMap.set(history.date, parseViewsToNumber(history.views));
    }
  }

  for (const periodRow of periodRows) {
    if (!selectedDateSet.has(periodRow.날짜)) continue;
    rankHistoryMap.set(
      periodRow.날짜,
      parseInt(String(periodRow.오늘순위), 10) || null,
    );
    viewsHistoryMap.set(
      periodRow.날짜,
      parseViewsToNumber(periodRow.오늘조회수),
    );
  }

  const rawRankHistory = Array.from(rankHistoryMap.entries())
    .map(([date, rank]) => ({ date, rank }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rawViewsHistory = Array.from(viewsHistoryMap.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rankHistory =
    rawRankHistory.length > 0
      ? rawRankHistory
      : [
          {
            date: row.날짜 || "",
            rank: Number.isFinite(todayRank) ? todayRank : null,
          },
        ];

  const viewsHistory =
    rawViewsHistory.length > 0
      ? rawViewsHistory
      : [{ date: row.날짜 || "", views: todayViewsNumber }];

  const firstAppeared =
    rankHistory.find((h) => h.rank !== null)?.date ||
    rankHistory[0]?.date ||
    row.날짜 ||
    "";

  const consecutiveDays = (() => {
    const sortedDesc = [...rankHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    let count = 0;
    for (const h of sortedDesc) {
      if (h.rank !== null) count++;
      else break;
    }
    return count;
  })();

  const peakRank = (() => {
    const ranks = rankHistory
      .map((h) => h.rank)
      .filter((r): r is number => typeof r === "number" && r > 0);
    if (ranks.length === 0) return todayRank;
    return Math.min(...ranks);
  })();

  const firstViews = viewsHistory[0]?.views ?? 0;
  const lastViews = viewsHistory[viewsHistory.length - 1]?.views ?? todayViewsNumber;
  const rangeViewsChange =
    viewsHistory.length > 1 ? lastViews - firstViews : todayViewsNumber - prevViewsNumber;
  const rangeViewsChangePct =
    viewsHistory.length > 1
      ? firstViews > 0
        ? (rangeViewsChange / firstViews) * 100
        : 0
      : prevViewsNumber > 0
        ? (rangeViewsChange / prevViewsNumber) * 100
        : 0;
  const firstRank = rankHistory.find((h) => h.rank !== null)?.rank ?? null;
  const latestRank =
    [...rankHistory].reverse().find((h) => h.rank !== null)?.rank ?? todayRank;
  const rangeRankChange =
    firstRank !== null && latestRank !== null ? firstRank - latestRank : rankChange;

  return {
    id: `${platform}-${row.제목}-${todayRank}`,
    title: row.제목 || "(제목 없음)",
    author: row.작가 || "-",
    genre: toUnifiedGenre(platform, row.장르 || "기타"),
    publisher: row.출판사 || "-",
    platform,
    thumbnailUrl: row.썸네일 && row.썸네일 !== "-" ? row.썸네일 : undefined,
    todayRank,
    prevRank: firstRank,
    rankChange: rangeRankChange,
    isNew,
    isReEntry,
    todayViews: lastViews,
    viewsChange: rangeViewsChange,
    viewsChangePct: rangeViewsChangePct,
    rating: parseFloat(String(row.평점)) || 0,
    commentCount: parseCommentCount(firstPresent(row.댓글수, row.comments, row.commentCount)),
    episodeCount: parseEpisodeCount(firstPresent(row.총회차수, row.totalEpisodes, row.episodeCount)),
    firstAppeared,
    coverGradient:
      platform === "naver"
        ? "from-emerald-900 to-green-700"
        : platform === "kakao"
          ? "from-amber-900 to-orange-700"
          : "from-blue-900 to-indigo-700",
    coverEmoji: platform === "naver" ? "📗" : platform === "kakao" ? "💛" : "📘",
    rankHistory,
    viewsHistory,
    consecutiveDays,
    peakRank,
    promotion: normalizePromotion(platform, row.promotion),
    status: "none",
    currentEpisode: 0,
    readingGoalDays: 0,
  };
}

function buildScoredNovels(
  rawData: TodayCombinedRawData | undefined,
  dateRange: DateRange,
): ScoredNovel[] {
  if (!rawData || rawData.rows.length === 0) return [];

  const selectedDates = rawData.dates.slice(0, getDateLimit(dateRange));
  const selectedDateSet = new Set(selectedDates);
  const groupedRows = new Map<string, TodayCombinedRow[]>();

  for (const row of rawData.rows) {
    if (!rowHasSelectedDate(row, selectedDateSet)) continue;
    const key = getIdentity(row);
    const group = groupedRows.get(key);
    if (group) group.push(row);
    else groupedRows.set(key, [row]);
  }

  const novels: Novel[] = Array.from(groupedRows.values()).map((rows, index) => {
    const novel = mapRowToNovel(getLatestRow(rows), rows, index, selectedDateSet);
    return {
      ...novel,
      promotion: mergePromotionForNovel(novel, rawData),
    };
  });

  const stats = getPlatformMaxStats(novels as unknown as UnifiedNovel[]);
  return novels.map((novel) => ({
    ...novel,
    overallScore: computeUnifiedScore(
      novel as unknown as UnifiedNovel,
      stats.maxViewsByPlatform,
      stats.maxCommentsByPlatform,
      stats.maxDeltaByPlatform,
    ),
    trendScore: computeTrendScore(
      novel as unknown as UnifiedNovel,
      stats.maxViewsByPlatform,
      stats.maxCommentsByPlatform,
      stats.maxDeltaByPlatform,
    ),
  }));
}

export function useTodayCombined(dateRange: DateRange = "today") {
  const query = useQuery({
    queryKey: ["today-combined-raw"],
    queryFn: fetchTodayCombinedRaw,
    staleTime: 1000 * 60 * 5,
  });

  const data = useMemo(
    () => buildScoredNovels(query.data, dateRange),
    [query.data, dateRange],
  );

  return {
    data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    latestDate: query.data?.dates[0] ?? "",
    selectedDates: query.data?.dates.slice(0, getDateLimit(dateRange)) ?? [],
  };
}
