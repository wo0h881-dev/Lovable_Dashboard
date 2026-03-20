// src/lib/novelStats.ts
import type { Novel } from "@/data/mockData";

export interface RankHistoryPoint {
  date: string;            // "2026-02-12"
  rank: number | null;     // null 이면 차트아웃
}

export interface NovelStats {
  firstAppearDate: string | null;   // 첫 등장
  lastChartOutDate: string | null;  // 마지막 차트아웃
  bestRank: number | null;          // 최고 순위 (숫자 가장 작은 값)
  worstRank: number | null;         // 최저 순위 (숫자 가장 큰 값)
  chartInCount: number;             // 차트인 구간 횟수
  currentStreakDays: number;        // 오늘 기준 연속 진입일
}

export function computeNovelStats(novel: Novel): NovelStats {
  const history: RankHistoryPoint[] = novel.rankHistory ?? [];

  if (!history.length) {
    return {
      firstAppearDate: novel.firstAppeared || null,
      lastChartOutDate: null,
      bestRank: null,
      worstRank: null,
      chartInCount: 0,
      currentStreakDays: 0,
    };
  }

  // 1) 첫 등장: rank != null인 첫 날짜
  const firstIn = history.find((p) => p.rank != null && p.rank > 0);
  const firstAppearDate = firstIn?.date ?? novel.firstAppeared ?? null;

  // 2) 마지막 차트아웃: 인→아웃으로 바뀐 마지막 날짜
  let lastChartOutDate: string | null = null;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const cur = history[i];
    if (prev.rank != null && prev.rank > 0 && (cur.rank == null || cur.rank <= 0)) {
      lastChartOutDate = cur.date;
    }
  }

  // 3) 최고/최저 순위
  const ranks = history
    .map((p) => p.rank)
    .filter((r): r is number => r != null && r > 0);

  const bestRank =
    ranks.length > 0 ? Math.min(...ranks) : null;
  const worstRank =
    ranks.length > 0 ? Math.max(...ranks) : null;

  // 4) 차트인 횟수 (연속 인 구간 개수)
  let chartInCount = 0;
  let inStreak = false;
  for (const p of history) {
    if (p.rank != null && p.rank > 0) {
      if (!inStreak) {
        chartInCount += 1;
        inStreak = true;
      }
    } else {
      inStreak = false;
    }
  }

  // 5) 현재 연속 진입일 (끝에서부터 역순으로 세기)
  let currentStreakDays = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const p = history[i];
    if (p.rank != null && p.rank > 0) {
      currentStreakDays += 1;
    } else {
      break;
    }
  }

  return {
    firstAppearDate,
    lastChartOutDate,
    bestRank,
    worstRank,
    chartInCount,
    currentStreakDays,
  };
}
