// src/hooks/useTodayCombined.ts
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

// Kakao 전용 프로모션 페이로드 타입 (시트 → API 서버에서 내려주는 구조)
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

type PromotionPayload = {
  date: string;
  platform: Platform;
  items: { title: string; promotion: PromotionInfo }[];
};

const PROMO_API_KAKAO = "/api/promotions/kakao-today";
const PROMO_API_NAVER = "/api/promotions/naver-today";
const PROMO_API_RIDI = "/api/promotions/ridi-today";

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

  // 시트에 이미 프로모션 컬럼을 넣어 두었다면 여기에 들어옴
  promotion?: PromotionInfo | string | null;

  [key: string]: any;
}

export interface ScoredNovel extends Novel {
  overallScore: number;
  trendScore: number;
}

// --- 장르 통합 함수 ---
function toUnifiedGenre(platform: Platform, rawGenre: string): Genre {
  const raw = (rawGenre || "").trim();

  // 1. 네이버/카카오는 이미 정제되어 있음
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

  // 2. 리디북스의 상세 장르를 통합 장르로 매핑
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

// --- 보조 파서 함수들 ---
function toPlatform(src: string): Platform {
  const s = String(src || "").trim();
  if (s.includes("네이버") || s.toLowerCase().includes("naver")) return "naver";
  if (s.includes("리디") || s.toLowerCase().includes("ridi")) return "ridi";
  if (s.includes("카카오") || s.toLowerCase().includes("kakao")) return "kakao";
  return "kakao";
}

function parseViewsToNumber(v: string | number): number {
  if (v === null || v === undefined) return 0;
  let s = String(v).trim();
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

  // 시트/Apps Script에서 JSON 문자열로 내려오는 경우 대응
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
          .map((b: any) => ({
            title: String(b.title ?? "").trim(),
            subtitle: String(b.subtitle ?? "").trim(),
          }))
      : undefined,
    notices: Array.isArray(parsed.notices)
      ? parsed.notices
          .filter(
            (n: any) =>
              n && typeof n === "object" && (typeof n.title === "string" || typeof n.body === "string"),
          )
          .map((n: any) => ({
            title: String(n.title ?? "").trim(),
            body: String(n.body ?? "").trim(),
            date: n.date ? String(n.date).trim() : undefined,
          }))
      : undefined,
    ridiWaitFree:
      typeof parsed.ridiWaitFree === "boolean" ? parsed.ridiWaitFree : undefined,
    ridiFreeLabel:
      parsed.ridiFreeLabel == null
        ? parsed.ridiFreeLabel
        : String(parsed.ridiFreeLabel).trim() || null,
  };

  // 네이버/리디가 카카오처럼 카드에 보이도록 최소한의 보정
  if (platform === "ridi") {
    if (!normalized.timeFreeType) {
      if (normalized.ridiWaitFree) {
        normalized.timeFreeType = "waitFree";
      } else if (normalized.ridiFreeLabel) {
        const label = normalized.ridiFreeLabel.replace(/\s+/g, "").toLowerCase();
        if (label.includes("3")) {
          normalized.timeFreeType = "threeHour";
        } else if (label.includes("기다무") || label.includes("대여") || label.includes("무료")) {
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
      if (tag.includes("3다무") || tag.includes("3시간")) {
        normalized.timeFreeType = "threeHour";
      } else if (
        tag.includes("기다무") ||
        tag.includes("매일무료") ||
        tag.includes("기다리면무료")
      ) {
        normalized.timeFreeType = "waitFree";
      } else if (tag.includes("이용권") || tag.includes("패스")) {
        normalized.timeFreeType = "pass";
      }
    }
  }

  // 비어있는 객체면 undefined 처리
  const hasValue = Object.values(normalized).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined;
  });

  return hasValue ? normalized : undefined;
}

// --- 메인 매핑 함수 ---
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
    rankHistory.find((h) => h.rank !== null)?.date || rankHistory[0]?.date || row["날짜"] || "";

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
    commentCount: parseCommentCount(row["댓글수"]),
    episodeCount: parseInt(String(row["총회차수"]).match(/\d+/)?.[0] || "0", 10),
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

    // 문자열/객체 어떤 형태로 와도 정규화
    promotion: normalizePromotion(platform, row.promotion),

    // 책장 기본값
    status: "none",
    currentEpisode: 0,
    readingGoalDays: 0,
  };
}

// --- Hook ---
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

        const res = await fetch(`${APPS_SCRIPT_URL}?action=getTodayCombined`);
        const rows = (await res.json()) as TodayCombinedRow[];
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

        const [kakaoPromoMap, naverPromoMap, ridiPromoMap] = await Promise.all([
  fetchPromotionMap(PROMO_API_KAKAO, "kakao"),
  fetchPromotionMap(PROMO_API_NAVER, "naver"),
  fetchPromotionMap(PROMO_API_RIDI, "ridi"),
]);

        // Novel로 변환 + Kakao에만 기존 구조 그대로 프로모션 주입
        const novels: Novel[] = rows
  .filter((r) => r.날짜 === mostRecentDate)
  .map((row, idx) => {
    console.log("🔥 row promotion 체크:", row["제목"], row.promotion);

    const n = mapRowToNovel(row, idx);

    console.log("🔥 mapped promotion:", n.title, n.promotion);

    const key = `${n.platform}::${n.title.trim()}`;

const promo =
  n.platform === "kakao"
    ? kakaoPromoMap.get(key)
    : n.platform === "naver"
      ? naverPromoMap.get(key)
      : ridiPromoMap.get(key);

if (promo) {
  n.promotion = {
    ...(n.promotion ?? {}),
    ...promo,
  };
}
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
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return { data, isLoading, error, latestDate };
}
