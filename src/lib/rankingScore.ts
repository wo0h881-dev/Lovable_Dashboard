import type { Novel } from "@/data/mockData";

export type Platform = "kakao" | "naver" | "ridi" | "etc";
export type UnifiedNovel = Novel;

export function rankToScore(rank: number | null | undefined): number {
  if (!rank || typeof rank !== "number") return 0;
  if (rank > 20) return 0;
  return 21 - rank;
}

function normalizedRankScore(rank: number | null | undefined): number {
  return rankToScore(rank) / 20;
}

function logRatio(value: number | null | undefined, max: number): number {
  const v = Math.max(0, value || 0);
  if (max <= 0) return 0;
  return Math.log10(v + 1) / Math.log10(max + 1);
}

export function platformWeight(_p: Platform): number {
  return 0;
}

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

    const views = Math.max(0, n.todayViews || 0);
    const comments = Math.max(0, n.commentCount || 0);
    const delta = Math.max(0, n.viewsChangePct || 0);

    if (views > maxViewsByPlatform[p]) maxViewsByPlatform[p] = views;
    if (comments > maxCommentsByPlatform[p]) maxCommentsByPlatform[p] = comments;
    if (delta > maxDeltaByPlatform[p]) maxDeltaByPlatform[p] = delta;
  }

  return {
    maxViewsByPlatform,
    maxCommentsByPlatform,
    maxDeltaByPlatform,
  };
}

/**
 * 리디 내부 순위 계산
 * 리디는 장르별 1위가 여러 개 나오므로 전체 리디 작품 안에서 다시 정렬합니다.
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
 * 종합 인기 점수
 *
 * 목적:
 * - 누적 조회수/평가수가 높은, 꾸준히 인기 많은 작품을 우선 노출
 * - 리디는 전체 이용자 규모가 작으므로 플랫폼 내부 정규화로 보정
 * - 실제 댓글수는 순위에 큰 영향을 주지 않는 보조지표
 *
 * 비율:
 * - 누적 조회수/리디 평가수 55%
 * - 현재 순위 30%
 * - 댓글수 10%
 * - 최근 상승세 5%
 */
export function computeUnifiedScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = (n.platform || "etc") as Platform;
  const rank = p === "ridi" && n.ridiInnerRank ? n.ridiInnerRank : n.todayRank;

  const popularityScore = logRatio(n.todayViews, maxViewsByPlatform[p] || 0);
  const rankScore = normalizedRankScore(rank);
  const commentScore = logRatio(n.commentCount, maxCommentsByPlatform[p] || 0);
  const deltaScore =
    (maxDeltaByPlatform[p] || 0) > 0
      ? Math.max(0, n.viewsChangePct || 0) / maxDeltaByPlatform[p]
      : 0;

  return (
    popularityScore * 0.55 +
    rankScore * 0.30 +
    commentScore * 0.10 +
    deltaScore * 0.05
  );
}

/**
 * 트렌드 랭킹 점수
 *
 * 목적:
 * - 최근에 뜨고 있는 작품을 우선 노출
 * - 상승세를 가장 크게 보고, 현재 순위와 기본 체급을 보조로 사용
 * - 댓글수는 실제값을 쓰되 과도한 순위 변동을 막기 위해 로그 정규화
 *
 * 비율:
 * - 최근 상승세 50%
 * - 현재 순위 25%
 * - 누적 조회수/리디 평가수 15%
 * - 댓글수 10%
 */
export function computeTrendScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = (n.platform || "etc") as Platform;
  const rank = p === "ridi" && n.ridiInnerRank ? n.ridiInnerRank : n.todayRank;

  const deltaScore =
    (maxDeltaByPlatform[p] || 0) > 0
      ? Math.max(0, n.viewsChangePct || 0) / maxDeltaByPlatform[p]
      : 0;
  const rankScore = normalizedRankScore(rank);
  const popularityScore = logRatio(n.todayViews, maxViewsByPlatform[p] || 0);
  const commentScore = logRatio(n.commentCount, maxCommentsByPlatform[p] || 0);

  return (
    deltaScore * 0.50 +
    rankScore * 0.25 +
    popularityScore * 0.15 +
    commentScore * 0.10
  );
}
