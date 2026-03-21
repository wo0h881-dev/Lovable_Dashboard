// src/lib/rankingScore.ts
import type { Novel } from "@/data/mockData";

export type Platform = "kakao" | "naver" | "ridi" | "etc";
export type UnifiedNovel = Novel;

// 순위 점수: 1위=20, 20위=1, 그 외 0
export function rankToScore(rank: number | null | undefined): number {
  if (!rank || typeof rank !== "number") return 0;
  if (rank > 20) return 0;
  return 21 - rank;
}

// 시장 점유율 기반 플랫폼 가중치 (종합 랭킹에만 사용)
export function platformWeight(p: Platform): number {
  if (p === "naver") return 0.58;
  if (p === "kakao") return 0.27;
  if (p === "ridi") return 0.08;
  return 0.07; // 기타
}

// 플랫폼별 최대값 계산
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
    const p = n.platform as Platform;

    if (n.todayViews > maxViewsByPlatform[p]) {
      maxViewsByPlatform[p] = n.todayViews;
    }
    if (n.commentCount > maxCommentsByPlatform[p]) {
      maxCommentsByPlatform[p] = n.commentCount;
    }
    const delta = Math.max(0, n.viewsChangePct || 0);
    if (delta > maxDeltaByPlatform[p]) {
      maxDeltaByPlatform[p] = delta;
    }
  }

  return { maxViewsByPlatform, maxCommentsByPlatform, maxDeltaByPlatform };
}

/**
 * 1) 종합 랭킹용 점수
 * - 플랫폼 가중치 포함
 * - 네이버/카카오: 순위 0.4, 증감률 0.25, 조회수 0.15, 댓글 0.1, 플랫폼 0.1
 * - 리디: 순위 0.3, 증감률 0.1, 댓글 0.05, 플랫폼 0.3
 */
export function computeUnifiedScore(
  n: UnifiedNovel,
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = n.platform as Platform;
  const rs = rankToScore(n.todayRank);

  const maxV = maxViewsByPlatform[p] || 0;
  const maxC = maxCommentsByPlatform[p] || 0;
  const maxD = maxDeltaByPlatform[p] || 0;

  // 네이버/카카오만 조회수 사용
  const viewRatio =
    p === "ridi" || maxV <= 0 ? 0 : n.todayViews / maxV;

  // 조회수 증감률: 음수는 0으로 자르고, 플랫폼 내 최대를 1로 정규화
  const deltaRaw = Math.max(0, n.viewsChangePct || 0);
  const deltaRatio = maxD > 0 ? deltaRaw / maxD : 0;

  // 댓글(또는 평가) 비율
  const commentRatio = maxC > 0 ? n.commentCount / maxC : 0;

  const pw = platformWeight(p);

  if (p === "ridi") {
    // 리디: 순위 0.3, delta 0.1, 댓글 0.05, 플랫폼 0.3
    return (
      rs * 0.3 +
      deltaRatio * 0.1 +
      commentRatio * 0.05 +
      pw * 0.3
    );
  }

  // 네이버/카카오: 순위 0.4, delta 0.25, 조회 0.15, 댓글 0.1, 플랫폼 0.1
  return (
    rs * 0.4 +
    deltaRatio * 0.25 +
    viewRatio * 0.15 +
    commentRatio * 0.1 +
    pw * 0.1
  );
}

/**
 * 2) 트렌드 랭킹용 점수
 * - 플랫폼 가중치 제거
 * - 순위 > 증감률 > 조회수 > 댓글
 */
export function computeTrendScore(
  n: UnifiedNovel,
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = n.platform as Platform;
  const rs = rankToScore(n.todayRank);

  const maxV = maxViewsByPlatform[p] || 0;
  const maxC = maxCommentsByPlatform[p] || 0;
  const maxD = maxDeltaByPlatform[p] || 0;

  const viewRatio =
    maxV <= 0 ? 0 : n.todayViews / maxV;

  const deltaRaw = Math.max(0, n.viewsChangePct || 0);
  const deltaRatio = maxD > 0 ? deltaRaw / maxD : 0;

  const commentRatio = maxC > 0 ? n.commentCount / maxC : 0;

  // 트렌드에서는 플랫폼 가중치 완전히 제거
  if (p === "ridi") {
    // 리디도 동일하게 순위/증감/댓글만 반영
    return (
      rs * 0.4 +
      deltaRatio * 0.35 +
      commentRatio * 0.25
    );
  }

  return (
    rs * 0.4 +
    deltaRatio * 0.35 +
    viewRatio * 0.15 +
    commentRatio * 0.1
  );
}
