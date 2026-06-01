// src/lib/rankingScore.ts
import type { Novel } from "@/data/mockData";

export type Platform = "kakao" | "naver" | "ridi" | "etc";
export type UnifiedNovel = Novel;

// 1. 순위 점수
export function rankToScore(rank: number | null | undefined): number {
  if (!rank || typeof rank !== "number") return 0;
  if (rank > 20) return 0;
  return 21 - rank;
}

// 2. 로그 정규화
function logRatio(value: number | null | undefined, max: number): number {
  const v = Math.max(0, value || 0);
  if (max <= 0) return 0;
  return Math.log10(v + 1) / Math.log10(max + 1);
}

// 3. 0~1 순위 정규화
function normalizedRankScore(rank: number | null | undefined): number {
  return rankToScore(rank) / 20;
}

// 4. 플랫폼 가중치
export function platformWeight(p: Platform): number {
  if (p === "naver") return 0.03;
  if (p === "kakao") return 0.03;
  if (p === "ridi") return 0.03;
  return 0.01;
}

// 5. 플랫폼별 최대값 계산
export function getPlatformMaxStats(novels: UnifiedNovel[]) {
  const maxViewsByPlatform: Record<Platform, number> = {
    naver: 0,
    kakao: 0,
    ridi: 0,
    etc: 0,
  };

  const maxCommentsByPlatform: Record<Platform, number> = {
    naver: 0,
    kakao: 0,
    ridi: 0,
    etc: 0,
  };

  const maxDeltaByPlatform: Record<Platform, number> = {
    naver: 0,
    kakao: 0,
    ridi: 0,
    etc: 0,
  };

  for (const n of novels) {
    const p = (n.platform || "etc") as Platform;

    if ((n.todayViews || 0) > (maxViewsByPlatform[p] || 0)) {
      maxViewsByPlatform[p] = n.todayViews || 0;
    }

    if ((n.commentCount || 0) > (maxCommentsByPlatform[p] || 0)) {
      maxCommentsByPlatform[p] = n.commentCount || 0;
    }

    const delta = Math.max(0, n.viewsChangePct || 0);
    if (delta > (maxDeltaByPlatform[p] || 0)) {
      maxDeltaByPlatform[p] = delta;
    }
  }

  return {
    maxViewsByPlatform,
    maxCommentsByPlatform,
    maxDeltaByPlatform,
  };
}

/**
 * 6. 리디 내부 순위 계산
 * 리디는 장르별 1위가 여러 개 나오므로, 전체 리디 작품 안에서 한 번 더 정렬합니다.
 * 여기서 실제 댓글수는 보조값으로만 사용합니다.
 */
export function computeRidiInnerScore(
  n: UnifiedNovel,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  if (n.platform !== "ridi") return 0;

  const rankScore = normalizedRankScore(n.todayRank);
  const commentScore = logRatio(n.commentCount, maxCommentsByPlatform.ridi || 0);
  const deltaScore =
    (maxDeltaByPlatform.ridi || 0) > 0
      ? Math.max(0, n.viewsChangePct || 0) / maxDeltaByPlatform.ridi
      : 0;

  return (
    rankScore * 0.75 +
    deltaScore * 0.15 +
    commentScore * 0.10
  );
}

export function attachRidiInnerRank(
  novels: UnifiedNovel[],
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): (UnifiedNovel & { ridiInnerRank?: number })[] {
  const cloned = novels.map((n) => ({ ...n })) as (UnifiedNovel & {
    ridiInnerRank?: number;
  })[];

  const scoredRidi = cloned
    .filter((n) => n.platform === "ridi")
    .map((n) => ({
      novel: n,
      score: computeRidiInnerScore(
        n,
        maxCommentsByPlatform,
        maxDeltaByPlatform,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  scoredRidi.forEach((item, idx) => {
    item.novel.ridiInnerRank = idx + 1;
  });

  return cloned;
}

/**
 * 7. 종합 인기 점수
 * 모든 플랫폼을 같은 구조로 계산합니다.
 *
 * 카카오/네이버: todayViews = 조회수
 * 리디: todayViews = 평가수
 * commentCount = 실제 댓글수, 순위 영향은 작게 제한
 */
export function computeUnifiedScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = (n.platform || "etc") as Platform;

  const rank = p === "ridi" && n.ridiInnerRank ? n.ridiInnerRank : n.todayRank;

  const rankScore = normalizedRankScore(rank);
  const popularityScore = logRatio(n.todayViews, maxViewsByPlatform[p] || 0);
  const commentScore = logRatio(n.commentCount, maxCommentsByPlatform[p] || 0);
  const deltaScore =
    (maxDeltaByPlatform[p] || 0) > 0
      ? Math.max(0, n.viewsChangePct || 0) / maxDeltaByPlatform[p]
      : 0;

  return (
    rankScore * 0.55 +
    popularityScore * 0.30 +
    deltaScore * 0.10 +
    commentScore * 0.02 +
    platformWeight(p)
  );
}

/**
 * 8. 트렌드 랭킹 점수
 * 트렌드는 상승세 중심.
 * 댓글수는 실제값을 넣더라도 거의 흔들리지 않도록 3%만 반영합니다.
 */
export function computeTrendScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = (n.platform || "etc") as Platform;

  const rank = p === "ridi" && n.ridiInnerRank ? n.ridiInnerRank : n.todayRank;

  const rankScore = normalizedRankScore(rank);
  const popularityScore = logRatio(n.todayViews, maxViewsByPlatform[p] || 0);
  const commentScore = logRatio(n.commentCount, maxCommentsByPlatform[p] || 0);
  const deltaScore =
    (maxDeltaByPlatform[p] || 0) > 0
      ? Math.max(0, n.viewsChangePct || 0) / maxDeltaByPlatform[p]
      : 0;

  return (
    deltaScore * 0.50 +
    rankScore * 0.35 +
    popularityScore * 0.12 +
    commentScore * 0.03
  );
}
