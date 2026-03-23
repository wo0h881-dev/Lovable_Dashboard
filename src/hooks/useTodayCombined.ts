// src/hooks/useTodayCombined.ts
import { useEffect, useState } from "react";
import type { Novel, Platform, Genre } from "@/data/mockData";
import { 
  getPlatformMaxStats, 
  computeUnifiedScore, 
  computeTrendScore,
  type UnifiedNovel 
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
  [key: string]: any;
}

export interface ScoredNovel extends Novel {
  overallScore: number;
  trendScore: number;
}

// --- 장르 통합 함수 (이게 빠져서 이상해졌던 거예요!) ---
function toUnifiedGenre(platform: Platform, rawGenre: string): Genre {
  const raw = (rawGenre || "").trim();
  
  // 1. 네이버/카카오는 이미 정제되어 있음
  if (platform === "naver" || platform === "kakao") {
    const validGenres = ["현판", "로판", "로맨스", "판타지", "무협", "BL", "기타"];
    return validGenres.includes(raw) ? (raw as Genre) : "기타";
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

function parseCommentCount(raw: any): number {
  const s = String(raw || "").trim();
  if (s.endsWith("만")) return Math.round((parseFloat(s.replace("만", "")) || 0) * 10_000);
  return parseInt(s.replace(/,/g, ""), 10) || 0;
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

// --- 메인 매핑 함수 ---
function mapRowToNovel(row: TodayCombinedRow, index: number): Novel {
  const platform = toPlatform(row["출처"]);
  const todayRank = parseInt(String(row["오늘순위"])) || index + 1;
  const { rankChange, isNew, isReEntry } = parseRankChange(row["순위변화"]);

  const todayViewsNumber = parseViewsToNumber(row["오늘조회수"]);
  const prevViewsNumber = parseViewsToNumber(row["전일조회수"]);

  return {
    id: `${platform}-${row["제목"]}-${todayRank}`,
    title: row["제목"] || "(제목 없음)",
    author: row["작가"] || "-",
    // 🔥 아래 줄에서 장르 통합 함수를 사용합니다!
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
    viewsChangePct: prevViewsNumber > 0 ? ((todayViewsNumber - prevViewsNumber) / prevViewsNumber) * 100 : 0,
    rating: parseFloat(String(row["평점"])) || 0,
    commentCount: parseCommentCount(row["댓글수"]),
    episodeCount: parseInt(String(row["총회차수"]).match(/\d+/)?.[0] || "0", 10),
    firstAppeared: row["날짜"] || "",
    coverGradient: platform === "naver" ? "from-emerald-900 to-green-700" : platform === "kakao" ? "from-amber-900 to-orange-700" : "from-blue-900 to-indigo-700",
    coverEmoji: platform === "naver" ? "📗" : platform === "kakao" ? "💛" : "📘",
    rankHistory: row["rankHistory"] ?? [],
    viewsHistory: (row["viewsHistory"] ?? []).map((v: { date: string; views: string | number }) => ({
  date: v.date,
  views: parseViewsToNumber(String(v.views)),
})),
    consecutiveDays: 0,
    peakRank: todayRank,
    promotion: row.promotion,   // 🔹 백엔드에서 내려준 걸 그대로
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
        if (!APPS_SCRIPT_URL) throw new Error("VITE_APPS_SCRIPT_URL 미설정");
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getTodayCombined`);
              const rows = (await res.json()) as TodayCombinedRow[];
        if (!rows || rows.length === 0) { setData([]); return; }

        const dates = rows.map(r => r.날짜).filter(Boolean).sort().reverse();
        const mostRecentDate = dates[0];
        setLatestDate(mostRecentDate);

        // 🔹 Kakao 프로모션 맵 가져오기
        const promoMap = await fetchKakaoPromotionMap();

        // 🔹 Novel로 변환하면서 Kakao에만 promotion 주입
        const novels = rows
          .filter(r => r.날짜 === mostRecentDate)
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


        const stats = getPlatformMaxStats(novels as unknown as UnifiedNovel[]);
        const scoredNovels: ScoredNovel[] = novels.map(n => ({
          ...n,
          overallScore: computeUnifiedScore(n as unknown as UnifiedNovel, stats.maxViewsByPlatform, stats.maxCommentsByPlatform, stats.maxDeltaByPlatform),
          trendScore: computeTrendScore(n as unknown as UnifiedNovel, stats.maxViewsByPlatform, stats.maxCommentsByPlatform, stats.maxDeltaByPlatform)
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
