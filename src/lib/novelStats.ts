// src/lib/novelStats.ts
import type { Novel } from "@/data/mockData";

export interface RankHistoryPoint {
  date: string;
  rank: number | null;
}

export interface NovelStats {
  firstAppearDate: string | null;
  lastChartOutDate: string | null;
  bestRank: number | null;
  worstRank: number | null;
  chartInCount: number;
  currentStreakDays: number;
}

export function computeNovelStats(novel: Novel): NovelStats {
  const raw: RankHistoryPoint[] = novel.rankHistory ?? [];

  if (!raw.length) {
    return {
      firstAppearDate: novel.firstAppeared || null,
      lastChartOutDate: null,
      bestRank: null,
      worstRank: null,
      chartInCount: 0,
      currentStreakDays: 0,
    };
  }

  // ✅ 날짜 오름차순 정렬 (이게 빠져있어서 모든 계산이 틀렸음)
  const history = [...raw].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // 1) 첫 등장
  const firstIn = history.find((p) => p.rank != null && p.rank > 0);
  const firstAppearDate = firstIn?.date ?? novel.firstAppeared ?? null;

  // 2) 마지막 차트아웃
  let lastChartOutDate: string | null = null;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const cur = history[i];
    if (
      prev.rank != null && prev.rank > 0 &&
      (cur.rank == null || cur.rank <= 0)
    ) {
      lastChartOutDate = cur.date;
    }
  }

  // 3) 최고/최저 순위
  const ranks = history
    .map((p) => p.rank)
    .filter((r): r is number => r != null && r > 0);
  const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;
  const worstRank = ranks.length > 0 ? Math.max(...ranks) : null;

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

  // 5) ✅ 현재 연속 진입일: 날짜가 실제로 하루씩 연속인지 체크
  let currentStreakDays = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const p = history[i];
    if (p.rank == null || p.rank <= 0) break;

    if (currentStreakDays === 0) {
      // 첫 번째 (가장 최근)
      currentStreakDays = 1;
    } else {
      // 이전 날짜와 하루 차이인지 확인
      const currDate = new Date(history[i].date).getTime();
      const nextDate = new Date(history[i + 1].date).getTime();
      const diffDays = Math.round((nextDate - currDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreakDays += 1;
      } else {
        // 날짜가 연속이 아니면 스트릭 종료
        break;
      }
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
