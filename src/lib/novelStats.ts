// src/lib/novelStats.ts
import type { Novel } from "@/data/mockData";

export interface RankHistoryPoint {
  date: string;           // "2026-02-12"
  rank: number | null;    // null이면 차트아웃
}

export interface NovelStats {
  firstAppearDate: string | null;
  lastChartOutDate: string | null;
  bestRank: number | null;
  worstRank: number | null;
  chartInCount: number;       // 차트인 구간 개수
  currentStreakDays: number;  // 오늘 기준 연속 진입일
}

export function computeNovelStats(
  rankHistory: RankHistoryPoint[],
): NovelStats {
  if (!rankHistory || rankHistory.length === 0) {
    return {
      firstAppearDate: null,
      lastChartOutDate: null,
      bestRank: null,
      worstRank: null,
      chartInCount: 0,
      currentStreakDays: 0,
    };
  }

  // 1) 첫 등장: rank != null인 첫 날짜
  const firstIn = rankHistory.find((p) => p.rank != null && p.rank > 0);
  const firstAppearDate = firstIn?.date ?? null;

  // 2) 마지막 차트아웃: rank가 null로 바뀌는 가장 마지막 날짜
  let lastChartOutDate: string | null = null;
  for (let i = 1; i < rankHistory.length; i++) {
    const prev = rankHistory[i - 1];
    const cur = rankHistory[i];
    if (prev.rank != null && prev.rank > 0 && (cur.rank == null || cur.rank <= 0)) {
      lastChartOutDate = cur.date;
    }
  }

  // 3) 최고/최저 순위
  const inRanks = rankHistory
    .map((p) => p.rank)
    .filter((r): r is number => r != null && r > 0);

  const bestRank =
    inRanks.length > 0 ? Math.min(...inRanks) : null;
  const worstRank =
    inRanks.length > 0 ? Math.max(...inRanks) : null;

  // 4) 차트인 횟수 (연속 인 구간 개수)
  let chartInCount = 0;
  let inStreak = false;
  for (const p of rankHistory) {
    if (p.rank != null && p.rank > 0) {
      if (!inStreak) {
        chartInCount += 1;
        inStreak = true;
      }
    } else {
      inStreak = false;
    }
  }

  // 5) 현재 연속 진입일 (마지막에서부터 역순으로 세기)
  let currentStreakDays = 0;
  for (let i = rankHistory.length - 1; i >= 0; i--) {
    const p = rankHistory[i];
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
