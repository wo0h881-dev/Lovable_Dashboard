import { useEffect, useState } from "react";
import type { Novel, Platform, Genre, PromotionInfo } from "@/data/mockData";
import {
  getPlatformMaxStats,
  computeUnifiedScore,
  computeTrendScore,
  type UnifiedNovel,
} from "@/lib/rankingScore";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
const PROMO_API_KAKAO = "/api/promotions/kakao-today";
const PROMO_API_NAVER = "/api/promotions/naver-today";
const PROMO_API_RIDI = "/api/promotions/ridi-today";

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
  promotion?: PromotionInfo | string | null;
  [key: string]: any;
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

  if (s.endsWith("억")) {
    return (parseFloat(s.replace("억", "").replace(/,/g, "")) || 0) * 100_000_000;
  }
  if (s.endsWith("만")) {
    return (parseFloat(s.replace("만", "").replace(/,/g, "")) || 0) * 10_000;
  }

  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseCommentCount(raw: any): number {
  const s = String(raw || "").trim();
  if (s.endsWith("만")) {
    return Math.round((parseFloat(s.replace("만", "")) || 0) * 10_000);
  }
  return parseInt(s.replace(/,/g, ""), 10) || 0;
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

function normalizePromotion(
  platform: Platform,
  promotion: TodayCombinedRow["promotion"],
): PromotionInfo | undefined {
  if (!promotion) return undefined;

  let parsed: any = promotion;

  if (typeof parsed === "string") {
    const s = parsed.trim();
    if (!s) return undefined;
    try {
      parsed = JSON.parse(s);
    } catch {
      return undefined;
    }
  }

  if (!parsed || typeof parsed !== "object") return undefined;

  const normalized: PromotionInfo = {
    timeFreeType:
      parsed.timeFreeType === "none" ||
      parsed.timeFreeType === "waitFree" ||
      parsed.timeFreeType === "threeHour" ||
      parsed.timeFreeType === "pass"
        ? parsed.timeFreeType
        : undefined,

    tag: typeof parsed.tag === "string" ? parsed.tag.trim() || undefined : undefined,
    freeEpisodes: toOptionalNumber(parsed.freeEpisodes),
    daysLeft: toOptionalNumber(parsed.daysLeft),

    eventBanners: Array.isArray(parsed.eventBanners)
      ? parsed.eventBanners
          .filter(
            (b: any) =>
              b &&
              typeof b === "object" &&
              (typeof b.title === "string" || typeof b.subtitle === "string"),
          )
          .map((b: any) => {
            const title = String(b.title ?? "").trim();
            const subtitle = String(b.subtitle ?? "").trim();
            return {
              title,
              subtitle: subtitle || undefined,
            };
          })
          .filter((b: any) => b.title || b.subtitle)
      : undefined,

    notices: Array.isArray(parsed.notices)
      ? parsed.notices
          .filter(
            (n: any) =>
              n &&
              typeof n === "object" &&
              (typeof n.title === "string" || typeof n.body === "string"),
          )
          .map((n: any) => {
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
          .filter((n: any) => n.title)
      : undefined,

    benefits: Array.isArray(parsed.benefits)
      ? parsed.benefits
          .filter(
            (b: any) =>
              b &&
              typeof b === "object" &&
              (typeof b.title === "string" || typeof b.subtitle === "string"),
          )
          .map((b: any) => {
            const label = String(b.label ?? "").trim();
            const title = String(b.title ?? "").trim();
            const subtitle = String(b.subtitle ?? "").trim();

            return {
              label: label || undefined,
              title,
              subtitle: subtitle || undefined,
            };
          })
          .filter((b: any) => b.title)
      : undefined,

    serialSchedule:
      typeof parsed.serialSchedule === "string"
        ? parsed.serialSchedule.trim() || undefined
        : undefined,

    exclusiveText:
      typeof parsed.exclusiveText === "string"
        ? parsed.exclusiveText.trim() || undefined
        : undefined,

    ridiWaitFreeText:
      typeof parsed.ridiWaitFreeText === "string"
        ? parsed.ridiWaitFreeText.trim() || undefined
        : undefined,

    ridiWaitFree:
      typeof parsed.ridiWaitFree === "boolean" ? parsed.ridiWaitFree : undefined,

    ridiFreeLabel:
      parsed.ridiFreeLabel == null
        ? parsed.ridiFreeLabel
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

  console.log("PROMO MAP SIZE", platform, map.size);
  return map;
}

function mapRowToNovel(row: TodayCombinedRow, index: number): Novel {
  const platform = toPlatform(row["출처"]);
  const todayRank = parseInt(String(row["오늘순위"])) || index + 1;
  const { rankChange, isNew, isReEntry } = parseRankChange(row["순위변화"]);

  const todayViewsNumber = parseViewsToNumber(row["오늘조회수"]);
  const prevViewsNumber = parseViewsToNumber(row["전일조회수"]);

  const rawRankHistory = ((row["rankHistory"] ?? []) as {
    date: string;
    rank: number | null;
  }[])
    .filter((r) => r?.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rawViewsHistory = ((row["viewsHistory"] ?? []) as {
    date: string;
    views: string | number;
  }[])
    .filter((v) => v?.date)
    .map((v) => ({
      date: v.date,
      views: parseViewsToNumber(String(v.views)),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rankHistory =
    rawRankHistory.length > 0
      ? rawRankHistory
      : [
          {
            date: row["날짜"] || "",
            rank: typeof todayRank === "number" ? todayRank : null,
          },
        ];

  const viewsHistory =
    rawViewsHistory.length > 0
      ? rawViewsHistory
      : [{ date: row["날짜"] || "", views: todayViewsNumber }];

  const firstAppeared =
    rankHistory.find((h) => h.rank !== null)?.date ||
    rankHistory[0]?.date ||
    row["날짜"] ||
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

  return {
    id: `${platform}-${row["제목"]}-${todayRank}`,
    title: row["제목"] || "(제목 없음)",
    author: row["작가"] || "-",
    genre: toUnifiedGenre(platform, row["장르"] || "기타"),
    publisher: row["출판사"] || "-",
    platform,
    thumbnailUrl:
      row["썸네일"] && row["썸네일"] !== "-" ? row["썸네일"] : undefined,
    todayRank,
    prevRank:
      row["전일순위"] === "NEW" ? null : parseInt(String(row["전일순위"])),
    rankChange,
    isNew,
    isReEntry,
    todayViews: todayViewsNumber,
    viewsChange: todayViewsNumber - prevViewsNumber,
    viewsChangePct:
      prevViewsNumber > 0
        ? ((todayViewsNumber - prevViewsNumber) / prevViewsNumber) * 100
        : 0,
    rating: parseFloat(String(row["평점"])) || 0,
    commentCount: parseCommentCount(row["댓글수"]),
    episodeCount: parseInt(
      String(row["총회차수"]).match(/\d+/)?.[0] || "0",
      10,
    ),
    firstAppeared,
    coverGradient:
      platform === "naver"
        ? "from-emerald-900 to-green-700"
        : platform === "kakao"
          ? "from-amber-900 to-orange-700"
          : "from-blue-900 to-indigo-700",
    coverEmoji:
      platform === "naver" ? "📗" : platform === "kakao" ? "💛" : "📘",
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

export function useTodayCombined() {
  const [data, setData] = useState<ScoredNovel[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        if (!APPS_SCRIPT_URL) {
          throw new Error("VITE_APPS_SCRIPT_URL 미설정");
        }

        const [rowsRes, kakaoPromoMap, naverPromoMap, ridiPromoMap] =
          await Promise.all([
            fetch(`${APPS_SCRIPT_URL}?action=getTodayCombined`),
            fetchPromotionMap(PROMO_API_KAKAO, "kakao"),
            fetchPromotionMap(PROMO_API_NAVER, "naver"),
            fetchPromotionMap(PROMO_API_RIDI, "ridi"),
          ]);

        const rows = (await rowsRes.json()) as TodayCombinedRow[];

        if (!rows || rows.length === 0) {
          setData([]);
          return;
        }

        const dates = rows
          .map((r) => r.날짜)
          .filter(Boolean)
          .sort()
          .reverse();

        const mostRecentDate = dates[0];
        setLatestDate(mostRecentDate);

        const novels: Novel[] = rows
  .filter((r) => r.날짜 === mostRecentDate)
  .map((row, idx) => {
    const n = mapRowToNovel(row, idx);
    const key = `${n.platform}::${n.title.trim()}`;

    const promo =
      n.platform === "kakao"
        ? kakaoPromoMap.get(key)
        : n.platform === "naver"
          ? naverPromoMap.get(key)
          : ridiPromoMap.get(key);

    if (n.platform === "ridi") {
      console.log("RIDI KEY CHECK", {
        title: n.title,
        key,
        hasPromo: !!promo,
        promo,
      });
    }

    if (promo) {
      n.promotion = {
        ...(n.promotion ?? {}),
        ...promo,
      };
    }

    return n;
  });
        const stats = getPlatformMaxStats(novels as unknown as UnifiedNovel[]);
        const scoredNovels: ScoredNovel[] = novels.map((n) => ({
          ...n,
          overallScore: computeUnifiedScore(
            n as unknown as UnifiedNovel,
            stats.maxViewsByPlatform,
            stats.maxCommentsByPlatform,
            stats.maxDeltaByPlatform,
          ),
          trendScore: computeTrendScore(
            n as unknown as UnifiedNovel,
            stats.maxViewsByPlatform,
            stats.maxCommentsByPlatform,
            stats.maxDeltaByPlatform,
          ),
        }));

        setData(scoredNovels);
      } catch (err: any) {
        setError(err.message || "데이터 로드 실패");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return { data, isLoading, error, latestDate };
}
